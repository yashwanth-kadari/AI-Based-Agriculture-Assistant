from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

financial_bp = Blueprint('financial', __name__)

CROP_DEFAULTS = {
    'rice': {'seed_cost': 3000, 'fertilizer_cost': 8000, 'labor_cost': 12000, 'other_cost': 2000, 'price_per_kg': 25.5, 'yield_kg_per_acre': 2000},
    'wheat': {'seed_cost': 2500, 'fertilizer_cost': 6000, 'labor_cost': 10000, 'other_cost': 2000, 'price_per_kg': 22.0, 'yield_kg_per_acre': 1800},
    'maize': {'seed_cost': 3500, 'fertilizer_cost': 7000, 'labor_cost': 9000, 'other_cost': 2000, 'price_per_kg': 18.0, 'yield_kg_per_acre': 2200},
    'cotton': {'seed_cost': 5000, 'fertilizer_cost': 10000, 'labor_cost': 15000, 'other_cost': 2500, 'price_per_kg': 55.0, 'yield_kg_per_acre': 400},
    'sugarcane': {'seed_cost': 8000, 'fertilizer_cost': 12000, 'labor_cost': 18000, 'other_cost': 3000, 'price_per_kg': 3.2, 'yield_kg_per_acre': 30000},
}


@financial_bp.route('/autofill', methods=['GET'])
@jwt_required()
def get_autofill_data():
    crop = (request.args.get('crop') or 'rice').lower()
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass

    defaults = CROP_DEFAULTS.get(crop, CROP_DEFAULTS['rice'])
    auto_price = defaults['price_per_kg']
    auto_yield = defaults['yield_kg_per_acre']
    price_source = 'Default Baseline'
    yield_source = 'Default Baseline'

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)

            farmer_district = None
            farmer_state = None
            if user_id:
                cursor.execute("SELECT district, state FROM users WHERE id = %s OR user_id = %s", (user_id, user_id))
                u_row = cursor.fetchone()
                if u_row:
                    farmer_district = u_row.get('district')
                    farmer_state = u_row.get('state')

            # 1. Fetch real market price from database (preferring farmer's mandi/district/state)
            m_row = None
            if farmer_district or farmer_state:
                query_dist = f"%{(farmer_district or '').lower()}%"
                query_state = f"%{(farmer_state or '').lower()}%"
                cursor.execute("""
                    SELECT mp.modal_price, mp.price, mp.price_date, m.name as mandi_name
                    FROM market_prices mp
                    JOIN mandis m ON mp.mandi_id = m.id
                    WHERE LOWER(mp.crop_name) LIKE %s AND (LOWER(m.district) LIKE %s OR LOWER(m.state) LIKE %s)
                    ORDER BY mp.price_date DESC, mp.id DESC LIMIT 1
                """, (f'%{crop}%', query_dist, query_state))
                m_row = cursor.fetchone()

            if not m_row:
                cursor.execute("""
                    SELECT mp.modal_price, mp.price, mp.price_date, m.name as mandi_name
                    FROM market_prices mp
                    LEFT JOIN mandis m ON mp.mandi_id = m.id
                    WHERE LOWER(mp.crop_name) LIKE %s
                    ORDER BY mp.price_date DESC, mp.id DESC LIMIT 1
                """, (f'%{crop}%',))
                m_row = cursor.fetchone()

            if m_row:
                raw_price = m_row.get('modal_price') or m_row.get('price')
                if raw_price and raw_price > 0:
                    # If price is per quintal (> 100), convert to per kg
                    auto_price = round(float(raw_price) / 100.0 if raw_price > 100 else float(raw_price), 2)
                    mandi_label = m_row.get('mandi_name') or 'Live Mandi'
                    price_source = f"{mandi_label} ({m_row.get('price_date', 'Recent')})"

            # 2. Fetch real user yield prediction history
            if user_id:
                cursor.execute("""
                    SELECT expected_yield_kg, area_acres, yield_per_acre FROM crop_yield_records
                    WHERE user_id = %s AND LOWER(crop_type) LIKE %s
                    ORDER BY id DESC LIMIT 1
                """, (user_id, f'%{crop}%'))
                y_row = cursor.fetchone()
                if y_row:
                    y_per_acre = y_row.get('yield_per_acre')
                    if not y_per_acre and y_row.get('area_acres') and y_row.get('area_acres') > 0:
                        y_per_acre = y_row['expected_yield_kg'] / y_row['area_acres']
                    if y_per_acre and y_per_acre > 0:
                        auto_yield = round(float(y_per_acre), 1)
                        yield_source = "Your Prediction History"
        except Exception as e:
            print("Error fetching autofill data:", e)
        finally:
            cursor.close()
            conn.close()

    return jsonify({
        'crop': crop,
        'defaults': defaults,
        'autofill': {
            'price_per_kg': auto_price,
            'expected_yield_kg': auto_yield,
            'price_source': price_source,
            'yield_source': yield_source
        }
    }), 200


@financial_bp.route('/calculate', methods=['POST'])
@jwt_required()
def calculate_financials():
    data = request.json or {}
    crop = (data.get('crop') or 'rice').lower()
    area = float(data.get('area', 1))

    defaults = CROP_DEFAULTS.get(crop, CROP_DEFAULTS['rice'])
    seed = float(data.get('seed_cost') or defaults['seed_cost']) * area
    fertilizer = float(data.get('fertilizer_cost') or defaults['fertilizer_cost']) * area
    labor = float(data.get('labor_cost') or defaults['labor_cost']) * area
    other = float(data.get('other_cost') or defaults['other_cost']) * area
    price = float(data.get('price_per_kg') or defaults['price_per_kg'])
    yield_kg = float(data.get('expected_yield_kg') or defaults['yield_kg_per_acre']) * area

    total_cost = seed + fertilizer + labor + other
    total_income = yield_kg * price
    profit = total_income - total_cost
    profit_margin = (profit / total_income * 100) if total_income > 0 else 0

    # Market trend-aware recommendation logic
    conn = get_db_connection()
    is_price_rising = True
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT modal_price, price FROM market_prices
                WHERE LOWER(crop_name) LIKE %s
                ORDER BY price_date DESC LIMIT 5
            """, (f'%{crop}%',))
            rows = cursor.fetchall()
            if len(rows) >= 2:
                p_latest = rows[0].get('modal_price') or rows[0].get('price') or 0
                p_prev = rows[1].get('modal_price') or rows[1].get('price') or 0
                if p_latest < p_prev:
                    is_price_rising = False
        except Exception:
            pass
        finally:
            cursor.close()
            conn.close()

    if profit_margin > 20:
        if is_price_rising:
            suggestion = 'Sell Now — strong profit margin (>{:.1f}%) and rising Mandi market prices.'.format(profit_margin)
        else:
            suggestion = 'Store & Wait — high profit margin (>{:.1f}%), but market prices are dipping; store 40% to sell at peak.'.format(profit_margin)
    elif profit_margin > 0:
        suggestion = 'Partial Sale — moderate profit margin ({:.1f}%); sell 60% now to cover production costs.'.format(profit_margin)
    else:
        suggestion = 'Review Operational Costs — net financial loss projected (-₹{:,.0f}); reduce fertilizer/labor expenses or change target crop.'.format(abs(profit))

    user_id = get_jwt_identity()
    if user_id:
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            pass
    if user_id:
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO financial_records 
                    (user_id, crop_type, season, seed_cost, fertilizer_cost, pesticide_cost, labor_cost, irrigation_cost, other_cost, total_expense, revenue, profit)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, crop.title(), 'Kharif', seed, fertilizer, 0, labor, 0, other, total_cost, total_income, profit
                ))
                cursor.execute("""
                    INSERT INTO history (user_id, action, details)
                    VALUES (%s, %s, %s)
                """, (
                    user_id, 'Financial Planning',
                    f'{crop.title()} on {area} acre(s): cost ₹{total_cost:,.0f}, income ₹{total_income:,.0f}, profit ₹{profit:,.0f}'
                ))
                conn.commit()
            except Exception as e:
                print('Error saving financial history:', e)
            finally:
                cursor.close()
                conn.close()

    return jsonify({
        'crop': crop,
        'area_acres': area,
        'costs': {
            'seed': round(seed, 2),
            'fertilizer': round(fertilizer, 2),
            'labor': round(labor, 2),
            'other': round(other, 2),
            'total': round(total_cost, 2),
        },
        'income': round(total_income, 2),
        'profit': round(profit, 2),
        'profit_margin': round(profit_margin, 2),
        'sell_suggestion': suggestion,
    }), 200


@financial_bp.route('/summary', methods=['GET'])
@jwt_required()
def financial_summary():
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
            SELECT details FROM history
            WHERE user_id = %s AND action = 'Financial Planning'
            ORDER BY created_at DESC LIMIT 5
        """, (user_id,))
        records = cursor.fetchall()
        return jsonify({'recent_calculations': [r['details'] for r in records]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@financial_bp.route('/history', methods=['GET'])
@jwt_required()
def get_financial_history():
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
            SELECT id, user_id, crop_type, season, seed_cost, fertilizer_cost, pesticide_cost, labor_cost, irrigation_cost, other_cost, total_expense, revenue, profit, created_at
            FROM financial_records
            WHERE user_id = %s
            ORDER BY created_at DESC LIMIT 20
        """, (user_id,))
        records = cursor.fetchall()
        return jsonify({'history': records}), 200
    except Exception as e:
        print('Error fetching financial history:', e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

