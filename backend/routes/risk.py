from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

risk_bp = Blueprint('risk', __name__)

PEST_RISK_MAP = {
    'NoPest': 'Low',
    'Aphids': 'Medium',
    'Locust': 'Critical',
    'Bollworm': 'High',
    'Fungal': 'High',
}


@risk_bp.route('/status', methods=['GET'])
@jwt_required()
def get_risk_status():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 1. Active alerts from database (excluding expired alerts)
        cursor.execute("""
            SELECT * FROM alerts
            WHERE (status IS NULL OR status = 'Active')
              AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE())
            ORDER BY id DESC LIMIT 10
        """)
        alerts = cursor.fetchall()

        # Default risks
        pest_risk = 'Low'
        disease_risk = 'Low'
        climate_risk = 'Low'
        soil_risk = 'Low'
        market_risk = 'Low'

        if user_id:
            # 2. Pest Outbreak Risk (from user's recent pest prediction history)
            cursor.execute("""
                SELECT details FROM history
                WHERE user_id = %s AND action = 'Pest Prediction'
                ORDER BY created_at DESC LIMIT 1
            """, (user_id,))
            pest_row = cursor.fetchone()
            if pest_row:
                details = pest_row['details'].lower()
                if 'locust' in details or 'critical' in details:
                    pest_risk = 'Critical'
                elif 'aphid' in details or 'bollworm' in details or 'fungal' in details or 'high' in details:
                    pest_risk = 'High'
                elif 'no pest' not in details and 'low' not in details:
                    pest_risk = 'Medium'

            # 3. Disease & Climate Risk (from environmental predictions table)
            cursor.execute("""
                SELECT humidity, temperature FROM predictions
                WHERE user_id = %s ORDER BY created_at DESC LIMIT 1
            """, (user_id,))
            env_row = cursor.fetchone()
            if env_row:
                hum = env_row.get('humidity', 0)
                temp = env_row.get('temperature', 0)
                if hum > 80:
                    disease_risk = 'High'
                elif hum > 65:
                    disease_risk = 'Medium'

                if temp > 35 or temp < 10:
                    climate_risk = 'Critical'
                elif temp > 32 or temp < 15:
                    climate_risk = 'High'
                elif temp > 28:
                    climate_risk = 'Medium'

            # 4. Soil Risk (from user's real soil health report)
            cursor.execute("""
                SELECT ph, n_content, p_content, k_content FROM soil_reports
                WHERE user_id = %s ORDER BY id DESC LIMIT 1
            """, (user_id,))
            soil_row = cursor.fetchone()
            if soil_row:
                ph = float(soil_row.get('ph') or 6.5)
                n = float(soil_row.get('n_content') or 70)
                p = float(soil_row.get('p_content') or 30)
                k = float(soil_row.get('k_content') or 30)

                if ph < 5.2 or ph > 7.8 or n < 40 or p < 15 or k < 15:
                    soil_risk = 'High'
                elif ph < 5.8 or ph > 7.3 or n < 60 or p < 25 or k < 25:
                    soil_risk = 'Medium'
                else:
                    soil_risk = 'Low'
            else:
                soil_risk = 'Low (No Soil Test Found)'

        # 5. Market Volatility Risk (from real market prices table)
        cursor.execute("""
            SELECT modal_price, price, crop_name FROM market_prices
            ORDER BY price_date DESC, id DESC LIMIT 10
        """)
        m_rows = cursor.fetchall()
        if len(m_rows) >= 2:
            p1 = float(m_rows[0].get('modal_price') or m_rows[0].get('price') or 0)
            p2 = float(m_rows[1].get('modal_price') or m_rows[1].get('price') or 0)
            if p1 > 0 and p2 > 0:
                diff_pct = abs(p1 - p2) / p2 * 100.0
                if diff_pct > 15.0:
                    market_risk = 'High'
                elif diff_pct > 5.0:
                    market_risk = 'Medium'

        # 6. Overall Composite Risk calculation across all 5 risk dimensions
        severities = [a.get('severity', 'Low') for a in alerts] + [pest_risk, disease_risk, climate_risk, soil_risk, market_risk]
        if any(s in ['Critical', 'High'] for s in severities if 'High' in s or 'Critical' in s):
            if any('Critical' in s for s in severities):
                overall = 'Critical'
            else:
                overall = 'High'
        elif any('Medium' in s for s in severities):
            overall = 'Medium'
        else:
            overall = 'Low'

        return jsonify({
            'overall_risk': overall,
            'pest_outbreak_risk': pest_risk,
            'disease_risk': disease_risk,
            'climate_risk': climate_risk,
            'soil_risk': soil_risk,
            'market_risk': market_risk,
            'weather_alerts': [a for a in alerts if a.get('alert_type') == 'Weather'],
            'active_alerts': alerts,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
