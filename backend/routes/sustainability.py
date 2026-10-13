from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

sustainability_bp = Blueprint('sustainability', __name__)

PRACTICES = [
    {
        'id': 1,
        'title': 'Composting & Organic Matter Additions',
        'benefit': 'Improves soil moisture retention by up to 20% and acts as a slow-release natural fertilizer.',
        'difficulty': 'Easy'
    },
    {
        'id': 2,
        'title': 'Drip Irrigation Implementation',
        'benefit': 'Reduces water footprint by 40–60% compared to flood irrigation, putting water directly at root zones.',
        'difficulty': 'Medium'
    },
    {
        'id': 3,
        'title': 'Cover Cropping & Legume Rotation',
        'benefit': 'Naturally fixes atmospheric nitrogen, rebuilding soil topsoil and reducing synthetic fertilizer need.',
        'difficulty': 'Medium'
    },
    {
        'id': 4,
        'title': 'No-Till / Zero-Tillage Farming',
        'benefit': 'Drastically reduces soil erosion, stores carbon in topsoil, and preserves beneficial soil microbiome.',
        'difficulty': 'Hard'
    },
    {
        'id': 5,
        'title': 'Integrated Pest Management (IPM)',
        'benefit': 'Uses biological controls and natural predators first, reducing chemical pesticide footprint.',
        'difficulty': 'Medium'
    }
]

ROTATIONS = {
    'Rice': {
        'next_crop': 'Legumes (Lentils or Chickpeas)',
        'reason': 'Rice depletes soil nitrogen and structure. Legumes fix atmospheric nitrogen and restore soil aeration.',
        'water_impact': 'Decreases required water by 70% in following cycle'
    },
    'Wheat': {
        'next_crop': 'Mustard or Soybean',
        'reason': 'Rotates monoculture nutrient demands, suppressing fungal spores and balancing soil phosphorus.',
        'water_impact': 'Maintains consistent water table usage'
    },
    'Maize': {
        'next_crop': 'Peanuts or Cowpeas',
        'reason': 'Restores organic potassium and provides immediate ground cover, preventing seasonal topsoil erosion.',
        'water_impact': 'Increases rainfall retention by 15%'
    },
    'Cotton': {
        'next_crop': 'Mung beans or Barley',
        'reason': 'Alleviates soil compactness from deep cotton taproots, replenishing topsoil organic matter.',
        'water_impact': 'Reduces overall pesticide run-off risk'
    },
    'Sugarcane': {
        'next_crop': 'Soybean or Sunn Hemp',
        'reason': 'Breaks heavy trash accumulation cycles and restores soil nitrogen after multi-year ratoon crops.',
        'water_impact': 'Restores soil infiltration capacity'
    }
}


@sustainability_bp.route('/practices', methods=['GET'])
def get_practices():
    return jsonify({
        'practices': PRACTICES,
        'rotations': ROTATIONS
    }), 200


@sustainability_bp.route('/audit', methods=['POST'])
@jwt_required()
def calculate_audit():
    data = request.json or {}
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass
    water_hrs = float(data.get('water_hours', 4))
    fertilizer_type = data.get('fertilizer_type', 'Mixed')
    rotation_freq = data.get('crop_rotation', 'Occasional')
    tillage_type = data.get('tillage_type', 'Reduced')
    solar_energy = bool(data.get('solar_energy', False))
    crop = data.get('crop', 'Rice')

    # 1. Water score (30% weight)
    if water_hrs <= 3:
        water_score = 100
    elif water_hrs <= 5:
        water_score = 75
    elif water_hrs <= 7:
        water_score = 50
    else:
        water_score = 30

    # 2. Fertilizer score (25% weight)
    if fertilizer_type == 'Organic':
        fertilizer_score = 100
    elif fertilizer_type == 'Mixed':
        fertilizer_score = 70
    else:
        fertilizer_score = 40

    # 3. Crop Rotation score (15% weight)
    if rotation_freq == 'Regular':
        rotation_score = 100
    elif rotation_freq == 'Occasional':
        rotation_score = 70
    else:  # None / Monoculture
        rotation_score = 30

    # 4. Tillage score (15% weight)
    if tillage_type == 'Zero-Till':
        tillage_score = 100
    elif tillage_type == 'Reduced':
        tillage_score = 75
    else:  # Conventional
        tillage_score = 40

    # 5. Energy score (15% weight)
    energy_score = 100 if solar_energy else 40

    # Overall weighted score calculation using all 5 factors
    total_score = round(
        (water_score * 0.30) +
        (fertilizer_score * 0.25) +
        (rotation_score * 0.15) +
        (tillage_score * 0.15) +
        (energy_score * 0.15)
    )

    if total_score >= 80:
        grade = 'A'
        label = 'Regenerative Agriculture Leader'
        tips = [
            'Outstanding regenerative practices! High topsoil preservation and low environmental impact.',
            'Consider applying for organic certification or selling premium carbon-friendly produce.'
        ]
    elif total_score >= 60:
        grade = 'B'
        label = 'Transitioning Sustainable Farmer'
        tips = [
            'Good sustainability baseline! Transition further toward zero-till and organic composts.',
            'Increase legume crop rotation frequency to naturally fix nitrogen and cut chemical costs.'
        ]
    else:
        grade = 'C'
        label = 'High Footprint — Action Required'
        tips = [
            'High chemical dependency and soil disturbance detected.',
            'Switch flood irrigation to drip or sprinkler to save water and prevent nutrient leaching.',
            'Adopt minimum tillage and seasonal crop rotation to restore topsoil microbial health.'
        ]

    if user_id:
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO sustainability_assessments
                    (user_id, crop, water_hours, fertilizer_type, crop_rotation, tillage_type, solar_energy, score, grade, label)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (user_id, crop, water_hrs, fertilizer_type, rotation_freq, tillage_type, 1 if solar_energy else 0, total_score, grade, label))
                cursor.execute("""
                    INSERT INTO history (user_id, action, details)
                    VALUES (%s, %s, %s)
                """, (user_id, 'Sustainability Audit', f"Score: {total_score}/100 ({grade}) for {crop} — {label}"))
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                print('Error saving sustainability assessment:', e)

    return jsonify({
        'score': total_score,
        'grade': grade,
        'label': label,
        'crop': crop,
        'breakdown': {
            'water': water_score,
            'fertilizer': fertilizer_score,
            'rotation': rotation_score,
            'tillage': tillage_score,
            'energy': energy_score
        },
        'tips': tips
    }), 200


@sustainability_bp.route('/history', methods=['GET'])
@jwt_required()
def get_sustainability_history():
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, user_id, crop, water_hours, fertilizer_type, crop_rotation, tillage_type, solar_energy, score, grade, label, created_at
            FROM sustainability_assessments
            WHERE user_id = %s
            ORDER BY created_at DESC LIMIT 20
        """, (user_id,))
        records = cursor.fetchall()
        return jsonify({'history': records}), 200
    except Exception as e:
        print('Error fetching sustainability history:', e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

