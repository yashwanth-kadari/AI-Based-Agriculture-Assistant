from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from utils.db import get_db_connection
from ml.ml_model import predict_crop, predict_pest, predict_yield

predictions_bp = Blueprint('predictions', __name__)

CROP_EXTRAS = {
    'Rice': {
        'fertilizer': 'Urea (Nitrogen), DAP (Phosphorus), and MOP (Potassium).',
        'tips': 'Maintain 2-5 cm standing water in fields during seedling and active vegetative stages.'
    },
    'Wheat': {
        'fertilizer': 'Balanced NPK (120:60:40 ratio). Top dress with Urea at crown root initiation stage.',
        'tips': 'Schedule irrigation at critical crown root initiation (CRI) stage (~21 days after sowing).'
    },
    'Maize': {
        'fertilizer': 'Compost manure along with NPK (120:60:40). Zinc sulfate for micro-nutrient backup.',
        'tips': 'Ensure well-draining loamy soil. Weed early in the first 4 weeks to avoid resource competition.'
    },
    'Cotton': {
        'fertilizer': 'Nitrogenous fertilizers (NPK 80:40:40). Focus on calcium and boron if soil tests indicate deficiencies.',
        'tips': 'Watch closely for Bollworm outbreaks using pheromone traps. Pick cotton only when bolls are fully dry.'
    },
    'Sugarcane': {
        'fertilizer': 'High Nitrogen requirement (150-250 kg/ha) spread in 3 split doses, along with phosphorus and potash.',
        'tips': 'Ensure regular deep irrigation. Perform "earthing up" operation at 4 months to prevent lodging of taller stalks.'
    }
}


def _save_history(user_id, action_label, details):
    if not user_id:
        return
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO history (user_id, action, details)
            VALUES (%s, %s, %s)
        """, (user_id, action_label, details))
        conn.commit()
    except Exception as e:
        print(f'Error saving history ({action_label}):', e)
    finally:
        cursor.close()
        conn.close()


STATE_CLIMATE_NORMALS = {
    'Punjab': {'temperature': 24.5, 'humidity': 62.0, 'rainfall': 140.0},
    'Haryana': {'temperature': 25.0, 'humidity': 60.0, 'rainfall': 130.0},
    'Uttar Pradesh': {'temperature': 26.0, 'humidity': 65.0, 'rainfall': 180.0},
    'Maharashtra': {'temperature': 27.5, 'humidity': 70.0, 'rainfall': 220.0},
    'Karnataka': {'temperature': 26.5, 'humidity': 72.0, 'rainfall': 210.0},
    'Gujarat': {'temperature': 28.0, 'humidity': 58.0, 'rainfall': 110.0},
    'Rajasthan': {'temperature': 29.0, 'humidity': 45.0, 'rainfall': 85.0},
    'Tamil Nadu': {'temperature': 29.5, 'humidity': 75.0, 'rainfall': 190.0},
    'West Bengal': {'temperature': 27.0, 'humidity': 80.0, 'rainfall': 250.0},
    'Bihar': {'temperature': 26.0, 'humidity': 70.0, 'rainfall': 200.0},
    'Madhya Pradesh': {'temperature': 26.5, 'humidity': 55.0, 'rainfall': 150.0},
    'Andhra Pradesh': {'temperature': 28.5, 'humidity': 72.0, 'rainfall': 175.0},
    'Telangana': {'temperature': 28.0, 'humidity': 65.0, 'rainfall': 160.0},
    'Kerala': {'temperature': 27.0, 'humidity': 85.0, 'rainfall': 300.0},
    'Odisha': {'temperature': 27.5, 'humidity': 78.0, 'rainfall': 240.0},
    'Assam': {'temperature': 24.0, 'humidity': 82.0, 'rainfall': 280.0}
}


def _process_input_params(data):
    mandatory_soil_keys = ['N', 'P', 'K', 'ph']
    missing_soil = [k for k in mandatory_soil_keys if k not in data or data[k] is None or str(data[k]).strip() == '']
    if missing_soil:
        return None, True, jsonify({'error': 'Please provide mandatory N, P, K and pH soil test parameters.'}), 400

    parsed = {}
    for key in mandatory_soil_keys:
        try:
            parsed[key] = float(data[key])
        except (ValueError, TypeError):
            return None, False, jsonify({'error': f'Field {key} must be a valid number'}), 400

    if not (0 <= parsed['N'] <= 250 and 0 <= parsed['P'] <= 200 and 0 <= parsed['K'] <= 200):
        return None, False, jsonify({'error': 'NPK values are out of realistic agricultural range (0-250 mg/kg)'}), 400
    if not (3.0 <= parsed['ph'] <= 10.0):
        return None, False, jsonify({'error': 'pH level must be between 3.0 and 10.0'}), 400

    env_keys = ['temperature', 'humidity', 'rainfall']
    missing_env = [k for k in env_keys if k not in data or data[k] is None or str(data[k]).strip() == '']

    user_state = (data.get('state') or '').strip()
    user_id = data.get('user_id')
    if missing_env:
        if not user_state and user_id:
            conn = get_db_connection()
            if conn:
                try:
                    cursor = conn.cursor(dictionary=True)
                    cursor.execute("SELECT state FROM users WHERE id = %s", (user_id,))
                    u_row = cursor.fetchone()
                    if u_row and u_row.get('state'):
                        user_state = u_row['state'].strip()
                except Exception as e:
                    print('Error fetching user state for climate fallback:', e)
                finally:
                    cursor.close()
                    conn.close()

        if not user_state:
            user_state = 'Andhra Pradesh'

        climate_normals = None
        conn_cn = get_db_connection()
        if conn_cn:
            try:
                cursor_cn = conn_cn.cursor(dictionary=True)
                cursor_cn.execute("SELECT temperature, humidity, rainfall FROM climate_normals WHERE LOWER(state) = LOWER(%s)", (user_state,))
                cn_row = cursor_cn.fetchone()
                if cn_row:
                    climate_normals = cn_row
            except Exception as e:
                print('Error fetching climate normals from DB:', e)
            finally:
                try:
                    cursor_cn.close()
                    conn_cn.close()
                except Exception:
                    pass

        if not climate_normals:
            climate_normals = STATE_CLIMATE_NORMALS.get(user_state, {'temperature': 28.5, 'humidity': 72.0, 'rainfall': 175.0})

        for k in env_keys:
            if k in data and data[k] not in (None, ''):
                try:
                    parsed[k] = float(data[k])
                except (ValueError, TypeError):
                    return None, False, jsonify({'error': f'Field {k} must be a valid number'}), 400
            else:
                parsed[k] = float(climate_normals[k])
    else:
        for k in env_keys:
            try:
                parsed[k] = float(data[k])
            except (ValueError, TypeError):
                return None, False, jsonify({'error': f'Field {k} must be a valid number'}), 400

    return parsed, bool(missing_env), None, 200


@predictions_bp.route('/crop', methods=['POST'])
def recommend_crop():
    data = request.json or {}
    user_id = data.get('user_id')
    try:
        verify_jwt_in_request(optional=True)
        jwt_uid = get_jwt_identity()
        if jwt_uid:
            user_id = jwt_uid
    except Exception:
        pass

    parsed, used_climate, err_res, status_code = _process_input_params(data)
    if err_res:
        return err_res, status_code

    predicted_crop, confidence = predict_crop(parsed)
    if predicted_crop in ('Error', 'Model not trained yet'):
        return jsonify({'error': predicted_crop}), 500

    crop_info = CROP_EXTRAS.get(predicted_crop, {
        'fertilizer': 'Balanced application of organic manure and standard NPK (15:15:15).',
        'tips': 'Conduct regular soil tests, carry out field weeding, and follow rotation schedules.'
    })

    _save_history(user_id, 'Crop Recommendation', f"Recommended {predicted_crop} with {confidence:.1f}% confidence")
    if user_id:
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO predictions
                    (user_id, n_content, p_content, k_content, temperature, humidity, ph, rainfall, predicted_crop, confidence)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, parsed['N'], parsed['P'], parsed['K'],
                    parsed['temperature'], parsed['humidity'], parsed['ph'], parsed['rainfall'],
                    predicted_crop, confidence
                ))
                conn.commit()
            except Exception as e:
                print('Error saving prediction row:', e)
            finally:
                cursor.close()
                conn.close()

    return jsonify({
        'crop': predicted_crop,
        'confidence': confidence,
        'fertilizer': crop_info['fertilizer'],
        'tips': crop_info['tips'],
        'used_climate_normals': used_climate,
        'parsed_parameters': parsed,
        'message': f'Successfully recommended {predicted_crop} via Gaussian Naive Bayes ML model.',
    }), 200


@predictions_bp.route('/pest', methods=['POST'])
def handle_predict_pest():
    data = request.json or {}
    user_id = data.get('user_id')
    try:
        verify_jwt_in_request(optional=True)
        jwt_uid = get_jwt_identity()
        if jwt_uid:
            user_id = jwt_uid
    except Exception:
        pass
    crop = (data.get('crop') or 'General Crop').strip()

    parsed, used_climate, err_res, status_code = _process_input_params(data)
    if err_res:
        return err_res, status_code

    # Call trained GaussianNB pest model with parsed parameters
    predicted_pest, confidence = predict_pest(parsed)
    if predicted_pest in ('Error', 'Model not trained yet'):
        return jsonify({'error': predicted_pest}), 500

    if predicted_pest == 'Aphids':
        risk_level = 'High'
        remedy = 'Spray Neem oil (5ml/L) or Acetamiprid 20% SP. Reduce excessive nitrogen fertilization.'
    elif predicted_pest == 'Locust':
        risk_level = 'Critical'
        remedy = 'Report swarm activity to local agricultural officers. Apply recommended boundary protection spray.'
    else:
        predicted_pest = 'NoPest'
        risk_level = 'Low'
        remedy = 'No major pest threat detected. Continue regular crop monitoring and field sanitation.'

    is_estimated = bool(data.get('is_estimated', False))
    estimated_tag = " (Qualitative Estimation)" if is_estimated else ""

    msg = f"Pest Risk Model: {predicted_pest} ({risk_level} Risk) predicted for {crop} with {confidence}% confidence."

    _save_history(
        user_id,
        'Pest Risk Analysis',
        f"Predicted {predicted_pest} ({risk_level} Risk) for {crop}{estimated_tag}"
    )

    return jsonify({
        'pest': predicted_pest,
        'crop': crop,
        'confidence': confidence,
        'risk_level': risk_level,
        'remedy': remedy,
        'message': msg,
        'used_climate_normals': used_climate,
        'is_estimated': is_estimated,
    }), 200


@predictions_bp.route('/yield', methods=['POST'])
def handle_predict_yield():
    data = request.json or {}
    user_id = data.get('user_id')
    try:
        verify_jwt_in_request(optional=True)
        jwt_uid = get_jwt_identity()
        if jwt_uid:
            user_id = jwt_uid
    except Exception:
        pass
    crop_type = (data.get('crop_type') or 'Crop').strip()
    is_estimated = bool(data.get('is_estimated', False))
    estimated_tag = " (Qualitative Estimation)" if is_estimated else ""

    parsed, used_climate, err_res, status_code = _process_input_params(data)
    if err_res:
        return err_res, status_code

    # Call trained GaussianNB yield classification model (High, Medium, Low)
    predicted_category, confidence = predict_yield(parsed)
    if predicted_category in ('Error', 'Model not trained yet'):
        return jsonify({'error': predicted_category}), 500

    recommendations = []
    if predicted_category == 'High':
        recommendations.append('Optimal growing conditions detected! Plan for timely harvesting and storage.')
    elif predicted_category == 'Medium':
        recommendations.append('Moderate yield anticipated. Ensure adequate irrigation and micronutrient application.')
    else:
        recommendations.append('Low yield risk detected. Perform soil test and check for nutrient deficiencies.')

    msg = f"Yield Model: {predicted_category} yield level predicted for {crop_type} with {confidence}% confidence."

    _save_history(
        user_id,
        'Yield Classification',
        f"Predicted {predicted_category} yield category for {crop_type}{estimated_tag}"
    )

    if user_id:
        try:
            area_acres = float(data.get('area', 1.0))
            base_yield_per_acre = 2200.0 if predicted_category == 'High' else (1600.0 if predicted_category == 'Medium' else 900.0)
            expected_total_kg = base_yield_per_acre * area_acres
            status_label = 'Estimated (Qualitative)' if is_estimated else 'Lab-Based'
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO crop_yield_records
                    (user_id, crop_type, area_acres, expected_yield_kg, yield_per_acre, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (user_id, crop_type, area_acres, expected_total_kg, base_yield_per_acre, status_label))
                conn.commit()
                cursor.close()
                conn.close()
        except Exception as e:
            print('Error saving yield record row:', e)

    return jsonify({
        'yield_category': predicted_category,
        'yield_level': predicted_category,
        'crop_type': crop_type,
        'confidence': confidence,
        'recommendations': recommendations,
        'message': msg,
        'used_climate_normals': used_climate,
        'is_estimated': is_estimated,
    }), 200


@predictions_bp.route('/crop/history', methods=['GET'])
@jwt_required()
def get_crop_history():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, user_id, n_content, p_content, k_content, ph, temperature, humidity, rainfall, predicted_crop, confidence, created_at
            FROM predictions
            WHERE user_id = %s
            ORDER BY created_at DESC LIMIT 20
        """, (user_id,))
        records = cursor.fetchall()
        return jsonify({'history': records}), 200
    except Exception as e:
        print('Error fetching crop prediction history:', e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@predictions_bp.route('/pest/history', methods=['GET'])
@jwt_required()
def get_pest_history():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, user_id, action, details, created_at
            FROM history
            WHERE user_id = %s AND action = 'Pest Risk Analysis'
            ORDER BY created_at DESC LIMIT 20
        """, (user_id,))
        records = cursor.fetchall()
        return jsonify({'history': records}), 200
    except Exception as e:
        print('Error fetching pest prediction history:', e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@predictions_bp.route('/yield/history', methods=['GET'])
@jwt_required()
def get_yield_history():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, user_id, crop_type, area_acres, expected_yield_kg, yield_per_acre, status, harvest_date, created_at
            FROM crop_yield_records
            WHERE user_id = %s
            ORDER BY created_at DESC LIMIT 20
        """, (user_id,))
        records = cursor.fetchall()
        return jsonify({'history': records}), 200
    except Exception as e:
        print('Error fetching yield prediction history:', e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()




