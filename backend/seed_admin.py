import os
import sys

# Ensure backend path is in sys.path when script is executed standalone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import hashlib
from werkzeug.security import generate_password_hash
from utils.db import get_db_connection
from utils.admin_helpers import set_user_permissions, ALL_PERMISSIONS


def hash_password(password):
    """Use Werkzeug for new accounts. Old SHA-256 hashes are still accepted at login."""
    return generate_password_hash(password, method='pbkdf2:sha256')


def _upsert_user(cursor, conn, user_id, name, email, password, role, is_super_admin=0, is_verified=1, status='active', state='Andhra Pradesh', district='Guntur'):
    """Insert or update a seed user idempotently without resetting existing passwords."""
    cursor.execute("SELECT id FROM users WHERE user_id = %s OR email = %s", (user_id, email))
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            "UPDATE users SET user_id = %s, name = %s, role = %s, is_super_admin = %s, is_verified = %s, status = %s WHERE id = %s",
            (user_id, name, role, is_super_admin, is_verified, status, existing['id'])
        )
        conn.commit()
        uid = existing['id']
    else:
        hashed_pw = hash_password(password)
        cursor.execute(
            """INSERT INTO users (user_id, name, email, password_hash, role, is_super_admin, is_verified, status, state, district)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (user_id, name, email, hashed_pw, role, is_super_admin, is_verified, status, state, district)
        )
        conn.commit()
        uid = cursor.lastrowid
    return uid


def seed_super_admin():
    conn = get_db_connection()
    if not conn:
        print("[-] Database connection failed during seeding.")
        return False

    try:
        cursor = conn.cursor(dictionary=True)

        # ── 1. Primary Admin ──────────────────────────────────────────────────
        admin_default_pass = os.getenv('ADMIN_PASSWORD', 'Admin@123')
        primary_id = _upsert_user(
            cursor, conn,
            user_id='superadmin',
            name='Primary Administrator',
            email='admin@agrismart.in',
            password=admin_default_pass,
            role='primary_admin',
            is_super_admin=1,
            is_verified=1,
            status='active',
        )
        print("[+] Primary Admin ready: superadmin / admin@agrismart.in")

        # ── 2. Secondary Admin ────────────────────────────────────────────────
        secondary_id = _upsert_user(
            cursor, conn,
            user_id='admin',
            name='Secondary Administrator',
            email='admin@agriassist.com',
            password='admin123',
            role='secondary_admin',
            is_super_admin=0,
            is_verified=1,
            status='active',
        )
        # Give initial permissions to Secondary Admin
        set_user_permissions(secondary_id, {
            'VIEW_USERS': True,
            'CREATE_USERS': True,
            'EDIT_USERS': True,
            'DISABLE_USERS': False,
            'DELETE_USERS': False,
            'VIEW_FARMERS': True,
            'MANAGE_FARMERS': True,
            'PROMOTE_FARMER': False,
            'DEMOTE_ADMIN': False,
            'VIEW_PREDICTIONS': True,
            'VIEW_REPORTS': True,
            'MANAGE_MARKETPLACE': True,
            'MANAGE_ALERTS': True,
            'MANAGE_SUPPORT': True,
            'VIEW_ANALYTICS': True,
            'CAN_CREATE_ACCOUNTS': True
        }, conn=conn)
        print("[+] Secondary Admin ready: admin / admin@agriassist.com")

        # ── 3. Farmer ────────────────────────────────────────────────────────
        _upsert_user(
            cursor, conn,
            user_id='farmer',
            name='Ramesh Kumar',
            email='farmer@agriassist.com',
            password='farmer123',
            role='farmer',
            is_super_admin=0,
            is_verified=1,
            status='active',
        )
        print("[+] Farmer ready: farmer / farmer@agriassist.com")

        # ── 4. Standard User ──────────────────────────────────────────────────
        _upsert_user(
            cursor, conn,
            user_id='user',
            name='Priya Sharma',
            email='user@agriassist.com',
            password='user123',
            role='user',
            is_super_admin=0,
            is_verified=1,
            status='active',
        )
        print("[+] Standard User ready: user / user@agriassist.com")

        return True

    except Exception as e:
        print(f"[-] Error seeding database: {e}")
        return False
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


if __name__ == '__main__':
    seed_super_admin()
