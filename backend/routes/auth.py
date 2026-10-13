from flask import Blueprint, request, jsonify
from utils.db import get_db_connection
import hashlib
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import ALLOWED_ROLES

auth_bp = Blueprint('auth', __name__)


def hash_password(password):
    """Use Werkzeug for new accounts."""
    return generate_password_hash(password, method='pbkdf2:sha256')


def verify_password(stored_hash, password):
    """Verify password against stored hash."""
    if stored_hash.startswith(('pbkdf2:', 'scrypt:')):
        return check_password_hash(stored_hash, password)
    # Legacy SHA-256 fallback
    return stored_hash == hashlib.sha256(password.encode()).hexdigest()


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json or {}
    user_id = (data.get('user_id') or data.get('userId') or data.get('username') or '').strip()
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password', '')
    raw_role = (data.get('role') or 'farmer').strip().lower()
    state = (data.get('state') or '').strip()
    district = (data.get('district') or '').strip()

    if not all([user_id, name, email, password, state, district]):
        return jsonify({'error': 'All mandatory fields (User ID, Full Name, Email, Password, State, District) are required'}), 400

    if '@' not in email or len(email) < 5:
        return jsonify({'error': 'Please provide a valid email address'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if raw_role not in ALLOWED_ROLES:
        return jsonify({'error': f"Invalid role '{raw_role}'. Allowed roles are: {', '.join(ALLOWED_ROLES)}"}), 400

    role = raw_role

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Check if User ID already exists
        cursor.execute("SELECT id FROM users WHERE user_id = %s", (user_id,))
        if cursor.fetchone():
            return jsonify({'error': 'User ID already exists. Please choose a different User ID.'}), 400

        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400

        hashed_pw = hash_password(password)

        # Admin requests go into pending verification queue
        if role == 'admin':
            is_verified = 0
            status = 'pending'
        else:
            is_verified = 1
            status = 'active'

        cursor.execute(
            "INSERT INTO users (user_id, name, email, password_hash, role, is_super_admin, is_verified, status, state, district) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (user_id, name, email, hashed_pw, role, 0, is_verified, status, state, district)
        )
        conn.commit()
        new_id = cursor.lastrowid

        # For admin signups: do NOT issue a token — they must wait for approval
        if role == 'admin':
            return jsonify({
                'message': 'Admin account request submitted. Awaiting Primary Admin approval.',
                'pending_approval': True,
                'user': {
                    'id': new_id,
                    'user_id': user_id,
                    'name': name,
                    'email': email,
                    'role': role,
                    'is_super_admin': False,
                    'is_verified': False,
                    'status': 'pending',
                    'state': state,
                    'district': district,
                }
            }), 201

        token = create_access_token(identity=str(new_id))

        # Read back the newly created row so we return real values from DB
        cursor.execute("SELECT state, district, phone, village, farm_size, main_crop FROM users WHERE id = %s", (new_id,))
        new_row = cursor.fetchone() or {}

        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': new_id,
                'user_id': user_id,
                'name': name,
                'email': email,
                'role': role,
                'is_super_admin': False,
                'is_verified': True,
                'status': 'active',
                'state': new_row.get('state') or state,
                'district': new_row.get('district') or district,
                'phone': new_row.get('phone'),
                'village': new_row.get('village'),
                'farm_size': new_row.get('farm_size'),
                'main_crop': new_row.get('main_crop'),
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email_or_id = (data.get('email') or data.get('user_id') or '').strip()
    password = data.get('password', '')
    selected_role = (data.get('role') or '').strip().lower()

    if not all([email_or_id, password]):
        return jsonify({'error': 'All fields are required'}), 400

    if selected_role and selected_role not in ALLOWED_ROLES:
        return jsonify({'error': f"Invalid role '{selected_role}'. Allowed roles are: {', '.join(ALLOWED_ROLES)}"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s OR user_id = %s", (email_or_id, email_or_id))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid email address or User ID'}), 401

        if not verify_password(user['password_hash'], password):
            return jsonify({'error': 'Incorrect password'}), 401

        user_status = (user.get('status') or 'active').lower()
        if user_status in ['disabled', 'suspended']:
            return jsonify({'error': 'Account is disabled. Access denied. Please contact the Primary Administrator.'}), 403

        # Standardize DB role
        raw_db_role = (user.get('role') or 'farmer').strip().lower()
        is_super = bool(user.get('is_super_admin'))
        if is_super or raw_db_role in ['primary_admin', 'superadmin']:
            db_role = 'primary_admin'
        elif raw_db_role in ['secondary_admin', 'admin']:
            db_role = 'secondary_admin'
        elif raw_db_role == 'user':
            db_role = 'user'
        else:
            db_role = 'farmer'

        # Role validation if caller selected a role dropdown
        if selected_role:
            sel_norm = selected_role
            if selected_role in ['admin', 'secondary_admin']:
                sel_norm = 'secondary_admin'
            elif selected_role in ['primary_admin', 'superadmin']:
                sel_norm = 'primary_admin'
            
            if sel_norm != db_role and not (sel_norm == 'secondary_admin' and db_role == 'primary_admin'):
                return jsonify({'error': 'Selected role does not match your account registration.'}), 400

        # Upgrade legacy SHA-256 hash to Werkzeug on successful login
        if not user['password_hash'].startswith(('pbkdf2:', 'scrypt:')):
            new_hash = hash_password(password)
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user['id']))
            conn.commit()

        from utils.admin_helpers import get_user_permissions
        user_perms = get_user_permissions(user['id'])

        token = create_access_token(identity=str(user['id']))
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'user_id': user.get('user_id'),
                'name': user['name'],
                'email': user['email'],
                'role': db_role,
                'can_create_accounts': bool(user.get('can_create_accounts', False)),
                'is_super_admin': is_super or db_role == 'primary_admin',
                'is_verified': bool(user.get('is_verified', True)),
                'status': user_status if user_status != 'approved' else 'active',
                'state': user.get('state', 'Andhra Pradesh'),
                'district': user.get('district', 'Guntur'),
                'phone': user.get('phone'),
                'village': user.get('village'),
                'farm_size': user.get('farm_size'),
                'main_crop': user.get('main_crop'),
                'permissions': user_perms
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    data = request.json or {}
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass
    name = (data.get('name') or '').strip()
    raw_role = (data.get('role') or '').strip().lower()
    state = (data.get('state') or 'Andhra Pradesh').strip()
    district = (data.get('district') or data.get('city_district') or 'Guntur').strip()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Only update provided fields
        updates = []
        params = []

        if name:
            updates.append("name = %s")
            params.append(name)
        if state:
            updates.append("state = %s")
            params.append(state)
        if district:
            updates.append("district = %s")
            params.append(district)

        if not updates:
            return jsonify({'error': 'No fields to update'}), 400

        params.append(user_id)
        cursor.execute(
            f"UPDATE users SET {', '.join(updates)} WHERE id = %s",
            tuple(params)
        )
        conn.commit()
        cursor.execute("SELECT id, user_id, name, email, role, state, district FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        return jsonify({'message': 'Profile updated successfully', 'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    """Admin-initiated password reset for a target user."""
    caller_id = get_jwt_identity()
    data = request.json or {}
    target_user_id = data.get('target_user_id') or data.get('user_id')
    new_password = data.get('new_password', '')

    if not target_user_id or not new_password:
        return jsonify({'error': 'Target user ID and new password are required.'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Verify caller is admin
        cursor.execute("SELECT id, role, is_super_admin FROM users WHERE id = %s", (caller_id,))
        caller = cursor.fetchone()
        if not caller:
            return jsonify({'error': 'Unauthorized.'}), 401

        cr = (caller.get('role') or '').lower()
        is_admin = bool(caller.get('is_super_admin')) or cr in ['primary_admin', 'superadmin', 'secondary_admin', 'admin']
        if not is_admin:
            return jsonify({'error': 'Forbidden. Admin access required.'}), 403

        # Find target user
        cursor.execute("SELECT id, name, email FROM users WHERE id = %s OR user_id = %s", (target_user_id, target_user_id))
        target = cursor.fetchone()
        if not target:
            return jsonify({'error': 'Target user not found.'}), 404

        new_hash = hash_password(new_password)
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, target['id']))
        conn.commit()

        # Log activity
        from utils.admin_helpers import log_admin_activity
        log_admin_activity(
            admin_id=caller['id'],
            admin_name=caller.get('name', 'Admin'),
            action="Password Reset",
            target_user_id=target['id'],
            target_user_email=target['email'],
            details=f"Admin reset password for '{target['name']}' ({target['email']})",
            ip_address=request.remote_addr
        )

        return jsonify({'message': f"Password for '{target['name']}' has been reset successfully."}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
