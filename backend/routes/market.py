import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
from utils.admin_helpers import is_primary_admin, get_user_permissions, log_admin_activity

market_bp = Blueprint('market', __name__)


def _get_current_user(user_id, conn=None):
    if not user_id:
        return None

    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True
    if not conn:
        return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, role, is_super_admin FROM users WHERE id = %s OR user_id = %s", (user_id, str(user_id)))
        return cursor.fetchone()
    except Exception as e:
        print("Error fetching user for auth check:", e)
        return None
    finally:
        if should_close:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass


def _check_market_permission(user_id, conn=None):
    """
    Returns True if user is Primary Admin or has MANAGE_MARKET_PRICES permission.
    Returns False otherwise.
    """
    user = _get_current_user(user_id, conn=conn)
    if not user:
        return False, "User account not found."

    if is_primary_admin(user):
        return True, user

    perms = get_user_permissions(user_id, conn=conn)
    if perms.get('MANAGE_MARKET_PRICES'):
        return True, user

    return False, "Permission denied: Requires MANAGE_MARKET_PRICES permission."


# ── MANDI MANAGEMENT ROUTES ───────────────────────────────────────────────────

@market_bp.route('/mandis', methods=['GET'])
def get_mandis():
    state = request.args.get('state', '').strip()
    district = request.args.get('district', '').strip()
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM mandis WHERE 1=1"
        params = []

        if state:
            query += " AND state = %s"
            params.append(state)
        if district:
            query += " AND district = %s"
            params.append(district)
        if status:
            query += " AND status = %s"
            params.append(status)
        if search:
            query += " AND (name LIKE %s OR district LIKE %s OR state LIKE %s)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param])

        query += " ORDER BY state ASC, name ASC"
        cursor.execute(query, tuple(params))
        mandis = cursor.fetchall()
        return jsonify({'mandis': mandis}), 200
    except Exception as e:
        print("Error fetching mandis:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@market_bp.route('/mandis', methods=['POST'])
@jwt_required()
def create_mandi():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    has_perm, user_or_err = _check_market_permission(current_user_id, conn=conn)
    if not has_perm:
        conn.close()
        return jsonify({'error': user_or_err}), 403

    user = user_or_err
    data = request.json or {}
    name = (data.get('name') or '').strip()
    state = (data.get('state') or '').strip()
    district = (data.get('district') or '').strip()
    location = (data.get('location') or '').strip()
    status = (data.get('status') or 'Active').strip()

    if not name or not state or not district:
        conn.close()
        return jsonify({'error': 'Mandi name, state, and district are required.'}), 400

    try:
        cursor = conn.cursor(dictionary=True)
        # Check duplicate
        cursor.execute("SELECT id FROM mandis WHERE name = %s AND state = %s", (name, state))
        if cursor.fetchone():
            return jsonify({'error': f'Mandi "{name}" in {state} already exists.'}), 400

        cursor.execute("""
            INSERT INTO mandis (name, state, district, location, status)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, state, district, location, status))
        mandi_id = cursor.lastrowid
        conn.commit()

        log_admin_activity(
            admin_id=user['id'],
            admin_name=user['name'],
            action='Create Mandi',
            details=f'Added new Mandi "{name}" ({district}, {state})',
            conn=conn
        )

        return jsonify({'message': f'Mandi "{name}" created successfully.', 'id': mandi_id}), 201
    except Exception as e:
        conn.rollback()
        print("Error creating mandi:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@market_bp.route('/mandis/<int:mandi_id>', methods=['PUT'])
@jwt_required()
def update_mandi(mandi_id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    has_perm, user_or_err = _check_market_permission(current_user_id, conn=conn)
    if not has_perm:
        conn.close()
        return jsonify({'error': user_or_err}), 403

    user = user_or_err
    data = request.json or {}

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM mandis WHERE id = %s", (mandi_id,))
        mandi = cursor.fetchone()
        if not mandi:
            return jsonify({'error': 'Mandi record not found.'}), 404

        name = (data.get('name') or mandi['name']).strip()
        state = (data.get('state') or mandi['state']).strip()
        district = (data.get('district') or mandi['district']).strip()
        location = data.get('location', mandi.get('location', ''))
        status = (data.get('status') or mandi.get('status', 'Active')).strip()

        cursor.execute("""
            UPDATE mandis
            SET name = %s, state = %s, district = %s, location = %s, status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (name, state, district, location, status, mandi_id))
        conn.commit()

        log_admin_activity(
            admin_id=user['id'],
            admin_name=user['name'],
            action='Update Mandi',
            details=f'Updated Mandi #{mandi_id} "{name}" ({status})',
            conn=conn
        )

        return jsonify({'message': f'Mandi "{name}" updated successfully.'}), 200
    except Exception as e:
        conn.rollback()
        print("Error updating mandi:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@market_bp.route('/mandis/<int:mandi_id>', methods=['DELETE'])
@jwt_required()
def delete_mandi(mandi_id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    has_perm, user_or_err = _check_market_permission(current_user_id, conn=conn)
    if not has_perm:
        conn.close()
        return jsonify({'error': user_or_err}), 403

    user = user_or_err
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name FROM mandis WHERE id = %s", (mandi_id,))
        mandi = cursor.fetchone()
        if not mandi:
            return jsonify({'error': 'Mandi not found.'}), 404

        # Soft deactivate mandi to preserve price history
        cursor.execute("UPDATE mandis SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (mandi_id,))
        conn.commit()

        log_admin_activity(
            admin_id=user['id'],
            admin_name=user['name'],
            action='Deactivate Mandi',
            details=f'Deactivated Mandi #{mandi_id} "{mandi["name"]}"',
            conn=conn
        )

        return jsonify({'message': f'Mandi "{mandi["name"]}" deactivated successfully.'}), 200
    except Exception as e:
        conn.rollback()
        print("Error deactivating mandi:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ── CROP PRICE MANAGEMENT ROUTES ───────────────────────────────────────────────

@market_bp.route('/prices', methods=['GET'])
def get_market_prices():
    crop = request.args.get('crop', '').strip()
    mandi_id = request.args.get('mandi_id', '').strip()
    state = request.args.get('state', '').strip()
    district = request.args.get('district', '').strip()
    status = request.args.get('status', '').strip()
    date_filter = request.args.get('date', '').strip()
    latest_param = request.args.get('latest_only', '').strip().lower()

    # Default to latest_only=True unless date is specified or latest_only=false is passed
    if latest_param in ['false', '0', 'no']:
        is_latest_only = False
    elif date_filter:
        is_latest_only = False
    else:
        is_latest_only = True

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        if is_latest_only:
            sub_where = []
            sub_params = []
            if crop:
                sub_where.append("LOWER(crop_name) = LOWER(%s)")
                sub_params.append(crop)
            if mandi_id:
                sub_where.append("mandi_id = %s")
                sub_params.append(mandi_id)
            if status:
                sub_where.append("status = %s")
                sub_params.append(status)

            sub_sql = " AND ".join(sub_where)
            if sub_sql:
                sub_sql = "WHERE " + sub_sql
            else:
                sub_sql = ""

            query = f"""
                SELECT mp.*, m.name as mandi_name, m.state as state, m.district as district, u.name as creator_name
                FROM market_prices mp
                JOIN (
                    SELECT mandi_id, crop_name, MAX(id) as max_id
                    FROM market_prices
                    {sub_sql}
                    GROUP BY mandi_id, crop_name
                ) latest ON mp.id = latest.max_id
                JOIN mandis m ON mp.mandi_id = m.id
                LEFT JOIN users u ON mp.created_by = u.id
                WHERE 1=1
            """
            params = list(sub_params)
            if state:
                query += " AND m.state = %s"
                params.append(state)
            if district:
                query += " AND m.district = %s"
                params.append(district)

            query += " ORDER BY m.state ASC, m.name ASC, mp.crop_name ASC"
        else:
            query = """
                SELECT mp.*, m.name as mandi_name, m.state as state, m.district as district, u.name as creator_name
                FROM market_prices mp
                JOIN mandis m ON mp.mandi_id = m.id
                LEFT JOIN users u ON mp.created_by = u.id
                WHERE 1=1
            """
            params = []

            if crop:
                query += " AND LOWER(mp.crop_name) = LOWER(%s)"
                params.append(crop)
            if mandi_id:
                query += " AND mp.mandi_id = %s"
                params.append(mandi_id)
            if state:
                query += " AND m.state = %s"
                params.append(state)
            if district:
                query += " AND m.district = %s"
                params.append(district)
            if status:
                query += " AND mp.status = %s"
                params.append(status)
            if date_filter:
                query += " AND mp.price_date = %s"
                params.append(date_filter)

            query += " ORDER BY mp.price_date DESC, m.name ASC"

        cursor.execute(query, tuple(params))
        prices = cursor.fetchall()
        return jsonify({
            'prices': prices,
            'total': len(prices),
            'latest_only': is_latest_only
        }), 200
    except Exception as e:
        print("Error fetching market prices:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@market_bp.route('/prices', methods=['POST'])
@jwt_required()
def add_market_price():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    has_perm, user_or_err = _check_market_permission(current_user_id, conn=conn)
    if not has_perm:
        conn.close()
        return jsonify({'error': user_or_err}), 403

    user = user_or_err
    data = request.json or {}

    try:
        mandi_id = int(data.get('mandi_id'))
    except (ValueError, TypeError):
        conn.close()
        return jsonify({'error': 'Valid Mandi selection is required.'}), 400

    crop_name = (data.get('crop_name') or '').strip()
    if not crop_name:
        conn.close()
        return jsonify({'error': 'Crop name is required.'}), 400

    try:
        price = float(data.get('price'))
        if price <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        conn.close()
        return jsonify({'error': 'Price must be a positive number greater than 0.'}), 400

    unit = (data.get('unit') or 'Quintal').strip()
    price_date = (data.get('price_date') or datetime.utcnow().strftime('%Y-%m-%d')).strip()

    min_price = float(data['min_price']) if data.get('min_price') is not None and str(data.get('min_price')).strip() != '' else round(price * 0.95, 2)
    max_price = float(data['max_price']) if data.get('max_price') is not None and str(data.get('max_price')).strip() != '' else round(price * 1.05, 2)
    modal_price = float(data['modal_price']) if data.get('modal_price') is not None and str(data.get('modal_price')).strip() != '' else price
    status = (data.get('status') or 'Active').strip()

    if not (min_price <= modal_price <= max_price):
        conn.close()
        return jsonify({'error': 'Price range validation failed: Minimum price must be ≤ Modal price ≤ Maximum price.'}), 400

    try:
        cursor = conn.cursor(dictionary=True)
        # Verify mandi exists
        cursor.execute("SELECT id, name FROM mandis WHERE id = %s", (mandi_id,))
        mandi = cursor.fetchone()
        if not mandi:
            return jsonify({'error': 'Selected Mandi does not exist.'}), 404

        # Upsert price for Mandi + Crop + Date to prevent duplicates
        cursor.execute("""
            SELECT id FROM market_prices
            WHERE mandi_id = %s AND LOWER(crop_name) = LOWER(%s) AND price_date = %s
        """, (mandi_id, crop_name, price_date))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE market_prices
                SET price = %s, unit = %s, min_price = %s, max_price = %s, modal_price = %s,
                    status = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (price, unit, min_price, max_price, modal_price, status, user['id'], existing['id']))
            price_id = existing['id']
            msg = f'Updated price entry for {crop_name} in {mandi["name"]} on {price_date}'
        else:
            cursor.execute("""
                INSERT INTO market_prices
                (mandi_id, crop_name, price, unit, min_price, max_price, modal_price, price_date, status, created_by, updated_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (mandi_id, crop_name, price, unit, min_price, max_price, modal_price, price_date, status, user['id'], user['id']))
            price_id = cursor.lastrowid
            msg = f'Recorded {crop_name} price ₹{price}/{unit} in {mandi["name"]} for {price_date}'

        conn.commit()

        log_admin_activity(
            admin_id=user['id'],
            admin_name=user['name'],
            action='Add Market Price',
            details=msg,
            conn=conn
        )

        return jsonify({'message': msg, 'id': price_id}), 201
    except Exception as e:
        conn.rollback()
        print("Error saving market price:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@market_bp.route('/prices/<int:price_id>', methods=['PUT'])
@jwt_required()
def update_market_price(price_id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    has_perm, user_or_err = _check_market_permission(current_user_id, conn=conn)
    if not has_perm:
        conn.close()
        return jsonify({'error': user_or_err}), 403

    user = user_or_err
    data = request.json or {}

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM market_prices WHERE id = %s", (price_id,))
        price_row = cursor.fetchone()
        if not price_row:
            return jsonify({'error': 'Market price record not found.'}), 404

        price = float(data.get('price', price_row['price']))
        unit = (data.get('unit') or price_row['unit']).strip()
        min_price = float(data['min_price']) if data.get('min_price') is not None and str(data.get('min_price')).strip() != '' else float(price_row['min_price'] or round(price * 0.95, 2))
        max_price = float(data['max_price']) if data.get('max_price') is not None and str(data.get('max_price')).strip() != '' else float(price_row['max_price'] or round(price * 1.05, 2))
        modal_price = float(data['modal_price']) if data.get('modal_price') is not None and str(data.get('modal_price')).strip() != '' else float(price_row['modal_price'] or price)
        status = (data.get('status') or price_row['status']).strip()

        if not (min_price <= modal_price <= max_price):
            return jsonify({'error': 'Price range validation failed: Minimum price must be ≤ Modal price ≤ Maximum price.'}), 400

        cursor.execute("""
            UPDATE market_prices
            SET price = %s, unit = %s, min_price = %s, max_price = %s, modal_price = %s,
                status = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (price, unit, min_price, max_price, modal_price, status, user['id'], price_id))
        conn.commit()

        log_admin_activity(
            admin_id=user['id'],
            admin_name=user['name'],
            action='Update Market Price',
            details=f'Updated Price #{price_id} to ₹{price}/{unit} ({status})',
            conn=conn
        )

        return jsonify({'message': 'Market price updated successfully.'}), 200
    except Exception as e:
        conn.rollback()
        print("Error updating price:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@market_bp.route('/prices/<int:price_id>', methods=['DELETE'])
@jwt_required()
def delete_market_price(price_id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    has_perm, user_or_err = _check_market_permission(current_user_id, conn=conn)
    if not has_perm:
        conn.close()
        return jsonify({'error': user_or_err}), 403

    user = user_or_err
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id FROM market_prices WHERE id = %s", (price_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Price record not found.'}), 404

        # Soft archive price record
        cursor.execute("UPDATE market_prices SET status = 'Archived', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (price_id,))
        conn.commit()

        log_admin_activity(
            admin_id=user['id'],
            admin_name=user['name'],
            action='Archive Market Price',
            details=f'Archived Price Record #{price_id}',
            conn=conn
        )

        return jsonify({'message': 'Market price record archived.'}), 200
    except Exception as e:
        conn.rollback()
        print("Error archiving market price:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ── FARMER MARKET HISTORY & TRENDS ────────────────────────────────────────────

@market_bp.route('/history', methods=['GET'])
def get_mandi_price_history():
    crop = request.args.get('crop', '').strip()
    mandi_id = request.args.get('mandi_id', '').strip()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT mp.price_date as date, mp.price as price, mp.min_price, mp.max_price, mp.modal_price, mp.unit,
                   m.name as mandi_name
            FROM market_prices mp
            JOIN mandis m ON mp.mandi_id = m.id
            WHERE mp.status = 'Active'
        """
        params = []
        if crop:
            query += " AND LOWER(mp.crop_name) = LOWER(%s)"
            params.append(crop)
        if mandi_id:
            query += " AND mp.mandi_id = %s"
            params.append(mandi_id)

        query += " ORDER BY mp.price_date ASC"
        cursor.execute(query, tuple(params))
        history = cursor.fetchall()
        return jsonify({'history': history}), 200
    except Exception as e:
        print("Error fetching mandi price history:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ── MARKET PRICE FORECAST (REGRESSION MODEL) ──────────────────────────────────

import os
import pickle
import numpy as np
from datetime import timedelta

CROP_MAPPING = {
    'Rice': 0,
    'Wheat': 1,
    'Maize': 2,
    'Cotton': 3,
    'Tomato': 4,
    'Potato': 5
}

_forecast_model_cache = None

def _load_market_forecast_model():
    global _forecast_model_cache
    if _forecast_model_cache is not None:
        return _forecast_model_cache

    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'trained_models', 'market_forecast_model.pkl'))
    if not os.path.exists(model_path):
        return None

    try:
        with open(model_path, 'rb') as f:
            _forecast_model_cache = pickle.load(f)
        return _forecast_model_cache
    except Exception as e:
        print("Error loading market forecast model:", e)
        return None


@market_bp.route('/forecast', methods=['POST'])
@jwt_required(optional=True)
def generate_market_forecast():
    current_user_id = get_jwt_identity()
    data = request.json or {}

    crop_name = (data.get('crop_name') or '').strip()
    try:
        mandi_id = int(data.get('mandi_id'))
    except (ValueError, TypeError):
        return jsonify({'error': 'Valid Mandi selection is required.'}), 400

    try:
        forecast_days = int(data.get('forecast_days', 7))
        if forecast_days not in [7, 14, 30]:
            forecast_days = 7
    except (ValueError, TypeError):
        forecast_days = 7

    if not crop_name:
        return jsonify({'error': 'Crop name is required.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Verify Mandi
        cursor.execute("SELECT id, name FROM mandis WHERE id = %s", (mandi_id,))
        mandi = cursor.fetchone()
        if not mandi:
            return jsonify({'error': 'Selected Mandi not found.'}), 404

        # Fetch recent price history for this crop & mandi (up to last 30 daily records)
        cursor.execute("""
            SELECT price, price_date
            FROM market_prices
            WHERE mandi_id = %s AND LOWER(crop_name) = LOWER(%s) AND status = 'Active'
            ORDER BY price_date DESC
            LIMIT 30
        """, (mandi_id, crop_name))
        price_rows = cursor.fetchall()

        if not price_rows:
            # Fallback search for crop in any mandi
            cursor.execute("""
                SELECT price, price_date
                FROM market_prices
                WHERE LOWER(crop_name) = LOWER(%s) AND status = 'Active'
                ORDER BY price_date DESC
                LIMIT 30
            """, (crop_name,))
            price_rows = cursor.fetchall()

        if not price_rows:
            return jsonify({'error': f'No historical market price data found for {crop_name}.'}), 404

        # Sort chronologically (oldest to newest)
        price_rows.reverse()
        prices = [float(r['price']) for r in price_rows]
        dates = [r['price_date'] for r in price_rows]

        current_price = prices[-1]

        # Lags & rolling features
        lag_1 = prices[-2] if len(prices) >= 2 else current_price
        lag_7 = prices[-7] if len(prices) >= 7 else prices[0]
        recent_7 = prices[-7:] if len(prices) >= 7 else prices
        rolling_7 = float(np.mean(recent_7))

        # Target future date calculations
        latest_date = dates[-1]
        if isinstance(latest_date, str):
            latest_date_obj = datetime.strptime(latest_date, '%Y-%m-%d').date()
        elif hasattr(latest_date, 'date'):
            latest_date_obj = latest_date.date() if isinstance(latest_date, datetime) else latest_date
        else:
            latest_date_obj = datetime.utcnow().date()

        target_date_obj = latest_date_obj + timedelta(days=forecast_days)
        day_of_week = target_date_obj.weekday()
        month = target_date_obj.month

        crop_code = CROP_MAPPING.get(crop_name, 0)

        # Load ML model & predict
        model_payload = _load_market_forecast_model()
        if not model_payload or 'model' not in model_payload:
            return jsonify({'error': 'Market forecast model is not trained yet.'}), 503

        model = model_payload['model']
        feature_vector = np.array([[
            mandi_id, crop_code, current_price, lag_1, lag_7, rolling_7, day_of_week, month, forecast_days
        ]])

        predicted_price = float(round(model.predict(feature_vector)[0], 2))

        # Calculate expected % change
        expected_change_pct = float(round(((predicted_price - current_price) / current_price) * 100.0, 2))

        # Trend label (±2% threshold)
        if expected_change_pct >= 2.0:
            trend = 'Increasing'
        elif expected_change_pct <= -2.0:
            trend = 'Decreasing'
        else:
            trend = 'Stable'

        # Volatility & confidence calculation
        p_std = np.std(prices)
        p_mean = np.mean(prices)
        volatility = (p_std / p_mean) if p_mean > 0 else 0.0
        confidence = float(round(max(55.0, min(98.5, 100.0 - (volatility * 100.0 * 2.5))), 1))

        # Resolve user_id integer if current_user_id exists
        u_id = None
        if current_user_id:
            try:
                u_id = int(current_user_id)
            except (ValueError, TypeError):
                cursor.execute("SELECT id FROM users WHERE user_id = %s OR email = %s", (str(current_user_id), str(current_user_id)))
                u_row = cursor.fetchone()
                if u_row:
                    u_id = u_row['id']

        # Save prediction to market_forecasts table
        cursor.execute("""
            INSERT INTO market_forecasts
            (user_id, crop_name, mandi_id, forecast_days, current_price, predicted_price, expected_change_pct, trend, confidence)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (u_id, crop_name, mandi_id, forecast_days, current_price, predicted_price, expected_change_pct, trend, confidence))
        conn.commit()

        # Build chart data: recent 14 points + forecasted point
        chart_data = []
        recent_rows = price_rows[-14:]
        for r in recent_rows:
            d_val = r['price_date']
            if hasattr(d_val, 'strftime'):
                d_str = d_val.strftime('%Y-%m-%d')
            else:
                d_str = str(d_val)
            chart_data.append({
                'date': d_str,
                'price': float(r['price']),
                'type': 'historical'
            })

        chart_data.append({
            'date': target_date_obj.strftime('%Y-%m-%d'),
            'price': predicted_price,
            'type': 'forecast'
        })

        return jsonify({
            'crop_name': crop_name,
            'mandi_id': mandi_id,
            'mandi_name': mandi['name'],
            'forecast_days': forecast_days,
            'current_price': current_price,
            'predicted_price': predicted_price,
            'expected_change_pct': expected_change_pct,
            'trend': trend,
            'confidence': confidence,
            'chart_data': chart_data
        }), 200

    except Exception as e:
        conn.rollback()
        print("Error generating market forecast:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@market_bp.route('/forecast/history', methods=['GET'])
@jwt_required(optional=True)
def get_market_forecast_history():
    current_user_id = get_jwt_identity()
    user_id_param = request.args.get('user_id')

    target_user_id = user_id_param or current_user_id

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        u_id = None
        if target_user_id:
            try:
                u_id = int(target_user_id)
            except (ValueError, TypeError):
                cursor.execute("SELECT id FROM users WHERE user_id = %s OR email = %s", (str(target_user_id), str(target_user_id)))
                u_row = cursor.fetchone()
                if u_row:
                    u_id = u_row['id']

        query = """
            SELECT mf.*, m.name as mandi_name
            FROM market_forecasts mf
            JOIN mandis m ON mf.mandi_id = m.id
        """
        params = []
        if u_id:
            query += " WHERE mf.user_id = %s"
            params.append(u_id)

        query += " ORDER BY mf.created_at DESC LIMIT 50"
        cursor.execute(query, tuple(params))
        forecasts = cursor.fetchall()
        return jsonify({'forecasts': forecasts}), 200

    except Exception as e:
        print("Error fetching forecast history:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

