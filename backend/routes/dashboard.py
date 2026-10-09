from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
from datetime import datetime, date

dashboard_bp = Blueprint('dashboard', __name__)


def serialize_row(row):
    result = {}
    for k, v in row.items():
        if isinstance(v, (datetime, date)):
            result[k] = str(v)
        else:
            result[k] = v
    return result


def safe_get_identity():
    try:
        auth_header = request.headers.get('Authorization', '')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
            from flask_jwt_extended import decode_token
            decoded = decode_token(token)
            return decoded.get('sub')
    except Exception:
        pass
    return None


def _calculate_personalized_risk(db_user_id, user_state, user_district, cursor):
    """
    Calculates a personalized risk level and reason for a farmer based on:
    1. Farmer's own pest prediction history (highest weight)
    2. Farmer's own soil health status
    3. Regional location-scoped alerts
    4. Defaults to 'Low' if no personal or location risk signals are active.
    """
    risk_level = 'Low'
    risk_reason = 'Healthy soil parameters & no active pest threats'

    pest_risk = None
    pest_reason = None
    soil_risk = None
    soil_reason = None
    location_risk = None
    location_reason = None

    if db_user_id:
        # 1. Check pest prediction history for this farmer
        try:
            cursor.execute("""
                SELECT details FROM history
                WHERE user_id = %s AND action = 'Pest Prediction'
                ORDER BY created_at DESC LIMIT 1
            """, (db_user_id,))
            pest_row = cursor.fetchone()
            if pest_row and pest_row.get('details'):
                details = pest_row['details']
                details_lower = details.lower()
                if 'locust' in details_lower or 'critical' in details_lower:
                    pest_risk = 'Critical'
                    pest_reason = 'Recent pest prediction detected Locust Swarm'
                elif any(p in details_lower for p in ['aphid', 'bollworm', 'blight', 'rot', 'rust', 'caterpillar', 'beetle']):
                    pest_risk = 'High'
                    pest_name = 'Aphids' if 'aphid' in details_lower else ('Bollworm' if 'bollworm' in details_lower else 'crop pests')
                    pest_reason = f'Recent pest prediction detected {pest_name}'
                elif 'no pest' not in details_lower:
                    pest_risk = 'Medium'
                    pest_reason = 'Recent pest prediction flagged potential crop pest'
        except Exception:
            pass

        # 2. Check soil health status for this farmer
        try:
            cursor.execute("""
                SELECT health_status FROM soil_reports
                WHERE user_id = %s ORDER BY created_at DESC LIMIT 1
            """, (db_user_id,))
            soil_row = cursor.fetchone()
            if soil_row and soil_row.get('health_status'):
                status = soil_row['health_status']
                if status in ['Poor', 'Critical']:
                    soil_risk = 'High'
                    soil_reason = f'Poor soil health status ({status})'
                elif status in ['Needs Improvement', 'Fair']:
                    soil_risk = 'Medium'
                    soil_reason = f'Soil health status ({status}) needs attention'
        except Exception:
            pass

    # 3. Check location-specific alerts (matching state or district, active & non-expired)
    try:
        sql_query = """
            SELECT alert_type, message, severity FROM alerts
            WHERE (status IS NULL OR status = 'Active')
              AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE())
        """
        params = []
        if user_state:
            sql_query += " AND (state IS NULL OR state = 'All' OR LOWER(state) = LOWER(%s))"
            params.append(user_state)
        else:
            sql_query += " AND (state IS NULL OR state = 'All')"

        if user_district:
            sql_query += " AND (district IS NULL OR district = 'All' OR LOWER(district) = LOWER(%s))"
            params.append(user_district)
        else:
            sql_query += " AND (district IS NULL OR district = 'All')"

        sql_query += " ORDER BY created_at DESC, id DESC LIMIT 5"
        cursor.execute(sql_query, tuple(params))
        location_alerts = cursor.fetchall()
        for a in location_alerts:
            sev = a.get('severity', 'Low')
            if sev == 'Critical':
                location_risk = 'Critical'
                location_reason = f'Regional Alert: {a.get("message")}'
            elif sev == 'High' and location_risk != 'Critical':
                location_risk = 'High'
                location_reason = f'Regional Alert: {a.get("message")}'
    except Exception:
        pass

    # Evaluate priority: Critical > High > Medium > Low
    if pest_risk == 'Critical' or location_risk == 'Critical':
        risk_level = 'Critical'
        risk_reason = pest_reason if pest_risk == 'Critical' else location_reason
    elif pest_risk == 'High' or soil_risk == 'High' or location_risk == 'High':
        risk_level = 'High'
        risk_reason = pest_reason or soil_reason or location_reason
    elif pest_risk == 'Medium' or soil_risk == 'Medium':
        risk_level = 'Medium'
        risk_reason = pest_reason or soil_reason
    else:
        risk_level = 'Low'
        risk_reason = 'Healthy soil parameters & no active pest threats'

    return risk_level, risk_reason


@dashboard_bp.route('', methods=['GET'])
@dashboard_bp.route('/', methods=['GET'])
@dashboard_bp.route('/data', methods=['GET'])
@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    user_param = get_jwt_identity()

    conn = get_db_connection()
    if not conn:
        return jsonify({
            'soil_health': None,
            'sustainability_score': None,
            'overall_risk': 'Low',
            'risk_level': 'Low',
            'risk_reason': 'Healthy soil parameters & no active pest threats',
            'market_trend': 'N/A',
            'ai_recommended_crop': None,
            'ai_recommendation': None,
            'estimated_profit': None,
            'financials': None,
            'todays_market_prices': [],
            'market_prices': [],
            'top_recommendations': [],
            'recent_alerts': []
        }), 200

    try:
        cursor = conn.cursor(dictionary=True)

        db_user_id = None
        user_state = None
        user_district = None

        if user_param:
            try:
                db_user_id = int(user_param)
                cursor.execute("SELECT state, district FROM users WHERE id = %s", (db_user_id,))
                u_row = cursor.fetchone()
                if u_row:
                    user_state = u_row.get('state')
                    user_district = u_row.get('district')
            except (ValueError, TypeError):
                try:
                    cursor.execute("SELECT id, state, district FROM users WHERE user_id = %s OR email = %s", (user_param, user_param))
                    u_row = cursor.fetchone()
                    if u_row:
                        db_user_id = u_row['id']
                        user_state = u_row.get('state')
                        user_district = u_row.get('district')
                except Exception:
                    pass

        # 1. Soil Health & Sustainability Score
        latest_soil = None
        sustainability_score = None
        if db_user_id:
            try:
                cursor.execute("""
                    SELECT health_status, n_content, p_content, k_content, ph
                    FROM soil_reports
                    WHERE user_id = %s ORDER BY created_at DESC LIMIT 1
                """, (db_user_id,))
                soil_row = cursor.fetchone()
                if soil_row and soil_row.get('health_status'):
                    latest_soil = soil_row['health_status']

                cursor.execute("""
                    SELECT health_status FROM soil_reports
                    WHERE user_id = %s ORDER BY created_at DESC LIMIT 5
                """, (db_user_id,))
                soil_rows = cursor.fetchall()
                if soil_rows:
                    status_scores = {'Excellent': 95, 'Good': 85, 'Fair': 65, 'Needs Improvement': 50, 'Poor': 40}
                    scores = [status_scores.get(r['health_status'], 70) for r in soil_rows]
                    sustainability_score = round(sum(scores) / len(scores))
            except Exception:
                pass

        # 2. Latest AI Prediction
        ai_crop = None
        if db_user_id:
            try:
                cursor.execute("""
                    SELECT predicted_crop, confidence, created_at
                    FROM predictions WHERE user_id = %s
                    ORDER BY created_at DESC LIMIT 1
                """, (db_user_id,))
                latest_pred = cursor.fetchone()
                if latest_pred:
                    ai_crop = {
                        'crop': latest_pred['predicted_crop'],
                        'confidence': latest_pred.get('confidence', 85.0),
                        'date': latest_pred['created_at'].strftime('%Y-%m-%d') if latest_pred.get('created_at') else '',
                    }
            except Exception:
                pass

        # 3. Estimated Profit
        estimated_profit = None
        if db_user_id:
            try:
                cursor.execute("""
                    SELECT SUM(total_expense) as total_cost, SUM(revenue) as total_income, SUM(profit) as net_profit
                    FROM financial_records
                    WHERE user_id = %s
                """, (db_user_id,))
                fin_summary = cursor.fetchone()
                if fin_summary and fin_summary.get('total_cost') is not None and (fin_summary['total_cost'] > 0 or fin_summary['total_income'] > 0):
                    cost_val = float(fin_summary['total_cost'] or 0)
                    income_val = float(fin_summary['total_income'] or 0)
                    profit_val = float(fin_summary['net_profit'] or (income_val - cost_val))
                    margin_val = round((profit_val / income_val * 100), 1) if income_val > 0 else 0
                    estimated_profit = {
                        'income': round(income_val),
                        'cost': round(cost_val),
                        'profit': round(profit_val),
                        'margin': margin_val
                    }
            except Exception:
                pass

        # 4. Market Prices with Day-over-Day % Change Comparison (Location Scoped & Deduplicated)
        todays_market_prices = []
        market_trend = "Stable"
        market_prices_note = None
        try:
            raw_candidates = []
            if user_state or user_district:
                # 4a. Try district-level mandis first
                if user_district:
                    cursor.execute("""
                        SELECT mp.id, mp.crop_name as crop, mp.price, mp.unit, mp.mandi_id, mp.price_date, m.name as mandi_name, m.state, m.district
                        FROM market_prices mp
                        JOIN mandis m ON mp.mandi_id = m.id
                        WHERE mp.status = 'Active' AND LOWER(m.district) = LOWER(%s)
                        ORDER BY mp.price_date DESC, mp.id DESC
                        LIMIT 50
                    """, (user_district,))
                    raw_candidates = cursor.fetchall()

                # 4b. If district yields fewer than 10 mandis, query state-level mandis
                if len(raw_candidates) < 10 and user_state:
                    existing_ids = [r['id'] for r in raw_candidates]
                    if existing_ids:
                        placeholders = ','.join(['%s'] * len(existing_ids))
                        query = f"""
                            SELECT mp.id, mp.crop_name as crop, mp.price, mp.unit, mp.mandi_id, mp.price_date, m.name as mandi_name, m.state, m.district
                            FROM market_prices mp
                            JOIN mandis m ON mp.mandi_id = m.id
                            WHERE mp.status = 'Active' AND LOWER(m.state) = LOWER(%s) AND mp.id NOT IN ({placeholders})
                            ORDER BY mp.price_date DESC, mp.id DESC
                            LIMIT 50
                        """
                        params = [user_state] + existing_ids
                    else:
                        query = """
                            SELECT mp.id, mp.crop_name as crop, mp.price, mp.unit, mp.mandi_id, mp.price_date, m.name as mandi_name, m.state, m.district
                            FROM market_prices mp
                            JOIN mandis m ON mp.mandi_id = m.id
                            WHERE mp.status = 'Active' AND LOWER(m.state) = LOWER(%s)
                            ORDER BY mp.price_date DESC, mp.id DESC
                            LIMIT 50
                        """
                        params = [user_state]
                    cursor.execute(query, tuple(params))
                    state_rows = cursor.fetchall()
                    raw_candidates.extend(state_rows)

                # 4c. If no mandis found in state or district at all, fallback to all active mandis with clear label
                if not raw_candidates:
                    loc_name = f"{user_district}, {user_state}" if user_district and user_state else (user_district or user_state)
                    market_prices_note = f"No mandis found in {loc_name} — showing nearest available"
                    cursor.execute("""
                        SELECT mp.id, mp.crop_name as crop, mp.price, mp.unit, mp.mandi_id, mp.price_date, m.name as mandi_name, m.state, m.district
                        FROM market_prices mp
                        JOIN mandis m ON mp.mandi_id = m.id
                        WHERE mp.status = 'Active'
                        ORDER BY mp.price_date DESC, mp.id DESC
                        LIMIT 50
                    """)
                    raw_candidates = cursor.fetchall()
            else:
                cursor.execute("""
                    SELECT mp.id, mp.crop_name as crop, mp.price, mp.unit, mp.mandi_id, mp.price_date, m.name as mandi_name, m.state, m.district
                    FROM market_prices mp
                    JOIN mandis m ON mp.mandi_id = m.id
                    WHERE mp.status = 'Active'
                    ORDER BY mp.price_date DESC, mp.id DESC
                    LIMIT 50
                """)
                raw_candidates = cursor.fetchall()

            # Deduplicate candidates so each crop appears only ONCE per mandi (showing its most recent price)
            seen_keys = set()
            m_rows = []
            for r in raw_candidates:
                key = (r['crop'].lower(), r['mandi_id'])
                if key not in seen_keys:
                    seen_keys.add(key)
                    m_rows.append(r)
                    if len(m_rows) == 10:
                        break

            price_changes = []

            if m_rows:
                for r in m_rows:
                    price_val = float(r['price'])
                    cursor.execute("""
                        SELECT price, price_date
                        FROM market_prices
                        WHERE mandi_id = %s AND crop_name = %s AND (price_date < %s OR (price_date = %s AND id < %s))
                        ORDER BY price_date DESC, id DESC
                        LIMIT 1
                    """, (r['mandi_id'], r['crop'], r['price_date'], r['price_date'], r['id']))
                    prev_row = cursor.fetchone()

                    if prev_row and float(prev_row['price']) > 0:
                        prev_price = float(prev_row['price'])
                        diff_pct = ((price_val - prev_price) / prev_price) * 100
                        rounded_pct = round(diff_pct, 1)
                        if rounded_pct == 0.0 or abs(rounded_pct) == 0.0:
                            change_str = "0.0%"
                            price_changes.append(0.0)
                        elif rounded_pct > 0:
                            change_str = f"+{rounded_pct:.1f}%"
                            price_changes.append(rounded_pct)
                        else:
                            change_str = f"{rounded_pct:.1f}%"
                            price_changes.append(rounded_pct)
                    else:
                        change_str = "New"

                    p_date = r['price_date']
                    date_str = p_date.strftime('%Y-%m-%d') if hasattr(p_date, 'strftime') else str(p_date)

                    todays_market_prices.append({
                        'crop': r['crop'],
                        'price': price_val,
                        'unit': r['unit'],
                        'mandi': r['mandi_name'],
                        'state': r['state'],
                        'district': r['district'],
                        'date': date_str,
                        'change': change_str
                    })

                if price_changes:
                    avg_change = sum(price_changes) / len(price_changes)
                    if avg_change > 0.5:
                        market_trend = f"Upward (+{avg_change:.1f}%)"
                    elif avg_change < -0.5:
                        market_trend = f"Downward ({avg_change:.1f}%)"
                    else:
                        market_trend = f"Stable ({avg_change:+.1f}%)" if abs(avg_change) >= 0.1 else "Stable"
                else:
                    market_trend = "Stable"
            else:
                market_trend = "No Price Feed"
        except Exception:
            pass

        # 5. Top Recommendations
        recommendations = []
        try:
            cursor.execute('SELECT crop_name, description, best_season, avg_market_price, sustainability_score FROM crop_recommendations LIMIT 5')
            rows = cursor.fetchall()
            if rows:
                recommendations = [serialize_row(r) for r in rows]
        except Exception:
            pass

        # 6. Recent Alerts (Location-scoped, active, non-expired)
        alerts = []
        try:
            sql_query = """
                SELECT id, alert_type, message, severity, state, district, expiry_date, status, created_at
                FROM alerts
                WHERE (status IS NULL OR status = 'Active')
                  AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE())
            """
            params = []
            if user_state:
                sql_query += " AND (state IS NULL OR state = 'All' OR LOWER(state) = LOWER(%s))"
                params.append(user_state)
            else:
                sql_query += " AND (state IS NULL OR state = 'All')"

            if user_district:
                sql_query += " AND (district IS NULL OR district = 'All' OR LOWER(district) = LOWER(%s))"
                params.append(user_district)
            else:
                sql_query += " AND (district IS NULL OR district = 'All')"

            sql_query += " ORDER BY created_at DESC, id DESC LIMIT 5"
            cursor.execute(sql_query, tuple(params))
            rows = cursor.fetchall()
            if rows:
                alerts = [serialize_row(a) for a in rows]
        except Exception:
            pass

        # 7. Personalized Risk Calculation
        overall_risk, risk_reason = _calculate_personalized_risk(db_user_id, user_state, user_district, cursor)

        response_payload = {
            'soil_health': latest_soil,
            'sustainability_score': sustainability_score,
            'overall_risk': overall_risk,
            'risk_level': overall_risk,
            'risk_reason': risk_reason,
            'ai_recommended_crop': ai_crop,
            'ai_recommendation': ai_crop,
            'top_recommendations': recommendations,
            'recent_alerts': alerts,
            'market_trend': market_trend,
            'todays_market_prices': todays_market_prices,
            'market_prices': todays_market_prices,
            'market_prices_location_note': market_prices_note,
            'estimated_profit': estimated_profit,
            'financials': estimated_profit
        }

        return jsonify(response_payload), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
