from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

marketplace_bp = Blueprint('marketplace', __name__)


@marketplace_bp.route('/items', methods=['GET'])
def get_items():
    from flask_jwt_extended import verify_jwt_in_request
    category = request.args.get('category')
    search = request.args.get('q') or request.args.get('search')
    req_state = request.args.get('state')
    req_district = request.args.get('district')
    req_village = request.args.get('city') or request.args.get('village')
    scope = (request.args.get('scope') or 'nearby').lower()

    jwt_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        jwt_raw = get_jwt_identity()
        if jwt_raw:
            try:
                jwt_user_id = int(jwt_raw)
            except (ValueError, TypeError):
                jwt_user_id = jwt_raw
    except Exception:
        pass

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed', 'items': []}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        user_loc = {'state': None, 'district': None, 'village': None}
        user_loc_missing = False

        if jwt_user_id:
            cursor.execute(
                "SELECT state, district, village FROM users WHERE id = %s",
                (jwt_user_id,)
            )
            u_row = cursor.fetchone()
            if u_row:
                user_loc['state'] = u_row.get('state')
                user_loc['district'] = u_row.get('district')
                user_loc['village'] = u_row.get('village')
                if not u_row.get('state') and not u_row.get('district'):
                    user_loc_missing = True
            else:
                user_loc_missing = True

        # Determine target state and district
        target_state = req_state if req_state and req_state != 'All' else user_loc['state']
        target_district = req_district if req_district and req_district != 'All' else user_loc['district']
        target_village = req_village if req_village and req_village != 'All' else user_loc['village']

        # If user explicitly requested scope='all' or location is missing completely
        if scope == 'all' or (not target_state and not target_district):
            effective_scope = 'all'
        else:
            effective_scope = 'nearby'

        query = """
            SELECT 
                m.id, m.title, m.category, m.description, m.price, m.quantity, m.contact, m.user_id, m.created_at,
                COALESCE(m.state, u.state, 'Andhra Pradesh') AS state,
                COALESCE(m.district, u.district, 'Guntur') AS district,
                COALESCE(m.village, u.village, '') AS village,
                COALESCE(u.name, 'Farmer') AS seller_name
            FROM marketplace_items m
            LEFT JOIN users u ON (m.user_id = u.id OR m.user_id = u.user_id)
            WHERE 1=1
        """
        params = []

        if category and category != 'All':
            query += ' AND m.category = %s'
            params.append(category)

        if search:
            query += ' AND (m.title LIKE %s OR m.description LIKE %s OR COALESCE(m.district, u.district) LIKE %s)'
            params.append(f'%{search}%')
            params.append(f'%{search}%')
            params.append(f'%{search}%')

        # Location filtering for nearby scope
        if effective_scope == 'nearby':
            if target_district and target_state:
                query += ' AND (COALESCE(m.district, u.district) = %s OR COALESCE(m.state, u.state) = %s)'
                params.append(target_district)
                params.append(target_state)
            elif target_state:
                query += ' AND COALESCE(m.state, u.state) = %s'
                params.append(target_state)
            elif target_district:
                query += ' AND COALESCE(m.district, u.district) = %s'
                params.append(target_district)

        # Ranking: Same District -> Same State -> Other States, then DESC created_at
        if target_district and target_state:
            query += """
                ORDER BY 
                    CASE 
                        WHEN COALESCE(m.district, u.district) = %s THEN 1
                        WHEN COALESCE(m.state, u.state) = %s THEN 2
                        ELSE 3
                    END ASC,
                    m.created_at DESC
            """
            params.append(target_district)
            params.append(target_state)
        elif target_state:
            query += """
                ORDER BY 
                    CASE 
                        WHEN COALESCE(m.state, u.state) = %s THEN 1
                        ELSE 2
                    END ASC,
                    m.created_at DESC
            """
            params.append(target_state)
        else:
            query += ' ORDER BY m.created_at DESC'

        cursor.execute(query, tuple(params))
        items = cursor.fetchall()

        # Add location comparison flags
        for item in items:
            item['is_same_district'] = bool(target_district and item.get('district') == target_district)
            item['is_same_state'] = bool(target_state and item.get('state') == target_state)

        return jsonify({
            'items': items,
            'user_location': user_loc,
            'user_location_missing': user_loc_missing,
            'scope': effective_scope,
            'active_filters': {
                'state': target_state,
                'district': target_district,
                'village': target_village
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e), 'items': []}), 500
    finally:
        cursor.close()
        conn.close()


@marketplace_bp.route('/items', methods=['POST'])
@jwt_required()
def add_item():
    data = request.json or {}
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass
    title = (data.get('title') or '').strip()
    category = (data.get('category') or '').strip()
    description = (data.get('description') or '').strip()
    price = data.get('price')
    quantity = (data.get('quantity') or '').strip()
    contact = (data.get('contact') or '').strip()
    state = (data.get('state') or '').strip()
    district = (data.get('district') or '').strip()
    village = (data.get('village') or '').strip()

    if not all([user_id, title, category, price, contact]):
        return jsonify({'error': 'Missing required listing information'}), 400

    try:
        price_val = float(price)
        if price_val < 0:
            return jsonify({'error': 'Price cannot be negative'}), 400
    except ValueError:
        return jsonify({'error': 'Price must be a valid number'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        # Fetch seller's default state/district/village if not explicitly passed
        if not state or not district:
            cursor.execute("SELECT state, district, village FROM users WHERE id = %s OR user_id = %s", (user_id, user_id))
            u_row = cursor.fetchone()
            if u_row:
                state = state or u_row.get('state') or 'Andhra Pradesh'
                district = district or u_row.get('district') or 'Guntur'
                village = village or u_row.get('village') or ''

        cursor.execute("""
            INSERT INTO marketplace_items (title, category, description, price, quantity, contact, user_id, state, district, village)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (title, category, description, price_val, quantity, contact, user_id, state, district, village))
        
        # log in history
        cursor.execute("""
            INSERT INTO history (user_id, action, details)
            VALUES (%s, %s, %s)
        """, (user_id, 'Marketplace Listing', f'Listed item "{title}" for ₹{price_val} in {district}, {state}'))
        
        conn.commit()
        return jsonify({'message': 'Marketplace item listed successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@marketplace_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    caller_id = get_jwt_identity()
    if not caller_id:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        caller_id = int(caller_id)
    except (ValueError, TypeError):
        pass

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT user_id, title FROM marketplace_items WHERE id = %s', (item_id,))
        item = cursor.fetchone()

        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Verify caller is item owner or admin
        cursor.execute("SELECT id, role, is_super_admin FROM users WHERE id = %s OR user_id = %s", (caller_id, str(caller_id)))
        caller = cursor.fetchone()
        is_admin = False
        if caller:
            cr = (caller.get('role') or '').lower()
            is_admin = bool(caller.get('is_super_admin')) or cr in ['primary_admin', 'superadmin', 'secondary_admin', 'admin']

        is_owner = (str(item['user_id']) == str(caller_id))
        if not (is_owner or is_admin):
            return jsonify({'error': 'Unauthorized to delete this listing'}), 403

        cursor.execute('DELETE FROM marketplace_items WHERE id = %s', (item_id,))
        
        # log in history
        cursor.execute("""
            INSERT INTO history (user_id, action, details)
            VALUES (%s, %s, %s)
        """, (caller_id, 'Marketplace Remove', f'Removed item "{item["title"]}"'))
        
        conn.commit()
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
