from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from utils.db import get_db_connection

soil_bp = Blueprint('soil', __name__)


def analyze_npk(n, p, k):
    """Rule-based NPK analysis for beginner-friendly soil reports."""
    n_status = 'Optimal' if 40 <= n <= 100 else ('Low' if n < 40 else 'High')
    p_status = 'Optimal' if 20 <= p <= 60 else ('Low' if p < 20 else 'High')
    k_status = 'Optimal' if 20 <= k <= 50 else ('Low' if k < 20 else 'High')

    summary = (
        f"Nitrogen: {n_status} ({n} mg/kg), "
        f"Phosphorus: {p_status} ({p} mg/kg), "
        f"Potassium: {k_status} ({k} mg/kg)"
    )
    return n_status, p_status, k_status, summary


def get_fertilizer_recommendation(n, p, k, ph):
    tips = []
    if n < 40:
        tips.append('Apply urea (46-0-0) at 50–80 kg/acre to boost nitrogen.')
    elif n > 100:
        tips.append('Reduce nitrogen fertilizer; excess N causes leafy growth and pest risk.')
    if p < 20:
        tips.append('Add DAP (18-46-0) or single super phosphate for phosphorus deficiency.')
    elif p > 60:
        tips.append('Phosphorus is high — avoid additional P fertilizers this season.')
    if k < 20:
        tips.append('Apply muriate of potash (0-0-60) at 30–50 kg/acre.')
    elif k > 50:
        tips.append('Potassium levels are adequate; maintain with organic compost.')
    if ph < 6.0:
        tips.append('Soil is acidic — apply agricultural lime (1–2 tons/acre) to raise pH.')
    elif ph > 7.5:
        tips.append('Soil is alkaline — use gypsum or sulfur to lower pH gradually.')
    if not tips:
        tips.append('NPK and pH are balanced. Maintain with organic manure and crop rotation.')
    return ' '.join(tips)


def get_irrigation_suggestion(rainfall, humidity, temperature):
    if rainfall > 200:
        return 'High rainfall — reduce irrigation, ensure proper drainage to prevent waterlogging.'
    if rainfall < 80:
        return 'Low rainfall — schedule drip irrigation every 2–3 days; mulch to retain moisture.'
    if humidity > 80 and temperature > 28:
        return 'Hot and humid — irrigate early morning; watch for fungal disease in standing water.'
    if humidity < 40:
        return 'Low humidity — increase irrigation frequency; consider sprinkler system for even coverage.'
    return 'Moderate conditions — irrigate based on crop stage; 25–40 mm per week is typical.'


def get_health_status(n, p, k, ph):
    _, _, _, _ = analyze_npk(n, p, k)
    score = 0
    if 40 <= n <= 100:
        score += 1
    if 20 <= p <= 60:
        score += 1
    if 20 <= k <= 50:
        score += 1
    if 6.0 <= ph <= 7.5:
        score += 1
    if score >= 3:
        return 'Good'
    if score == 2:
        return 'Fair'
    return 'Needs Improvement'


@soil_bp.route('/analyze', methods=['POST'])
def analyze_soil():
    data = request.json or {}
    user_id = data.get('user_id')
    try:
        verify_jwt_in_request(optional=True)
        jwt_uid = get_jwt_identity()
        if jwt_uid:
            try:
                user_id = int(jwt_uid)
            except (ValueError, TypeError):
                user_id = jwt_uid
    except Exception:
        pass
    required = ['N', 'P', 'K', 'ph']
    missing = [k for k in required if k not in data or data[k] is None or data[k] == '']
    if missing:
        return jsonify({'error': f'Missing required soil parameters: {", ".join(missing)}'}), 400

    try:
        n, p, k = float(data['N']), float(data['P']), float(data['K'])
        ph = float(data['ph'])
        temp = float(data['temperature']) if data.get('temperature') else 25.0
        humidity = float(data['humidity']) if data.get('humidity') else 65.0
        rainfall = float(data['rainfall']) if data.get('rainfall') else 120.0
    except (ValueError, TypeError):
        return jsonify({'error': 'Soil test values must be valid numbers'}), 400

    n_status, p_status, k_status, npk_summary = analyze_npk(n, p, k)
    health_status = get_health_status(n, p, k, ph)
    fertilizer = get_fertilizer_recommendation(n, p, k, ph)
    irrigation = get_irrigation_suggestion(rainfall, humidity, temp)

    report = {
        'health_status': health_status,
        'npk_analysis': {
            'nitrogen': {'value': n, 'status': n_status},
            'phosphorus': {'value': p, 'status': p_status},
            'potassium': {'value': k, 'status': k_status},
        },
        'npk_summary': npk_summary,
        'ph': ph,
        'fertilizer_recommendation': fertilizer,
        'irrigation_suggestion': irrigation,
    }

    if user_id:
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO soil_reports
                    (user_id, n_content, p_content, k_content, ph, temperature, humidity, rainfall,
                     health_status, npk_summary, fertilizer_recommendation, irrigation_suggestion)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (user_id, n, p, k, ph, temp, humidity, rainfall,
                      health_status, npk_summary, fertilizer, irrigation))
                cursor.execute("""
                    INSERT INTO history (user_id, action, details)
                    VALUES (%s, %s, %s)
                """, (user_id, 'Soil Analysis', f'Soil health: {health_status}. {npk_summary}'))
                conn.commit()
            except Exception as e:
                print('Error saving soil report:', e)
            finally:
                cursor.close()
                conn.close()

    return jsonify(report), 200


@soil_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_soil_reports():
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed', 'reports': []}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            'SELECT * FROM soil_reports WHERE user_id = %s ORDER BY created_at DESC LIMIT 10',
            (user_id,)
        )
        reports = cursor.fetchall()
        return jsonify({'reports': reports}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'reports': []}), 500
    finally:
        cursor.close()
        conn.close()
