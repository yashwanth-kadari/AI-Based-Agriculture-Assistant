import os
import sqlite3
from datetime import datetime
from utils.db import get_db_connection

# Master permission definitions
ALL_PERMISSIONS = [
    {"key": "VIEW_USERS", "label": "View Users", "category": "User Management", "description": "Can view all registered users and user lists"},
    {"key": "CREATE_USERS", "label": "Create Users", "category": "User Management", "description": "Can access Create Account interface and register new users"},
    {"key": "EDIT_USERS", "label": "Edit Users", "category": "User Management", "description": "Can edit user profiles and details"},
    {"key": "DISABLE_USERS", "label": "Disable Users", "category": "User Management", "description": "Can disable or enable user accounts"},
    {"key": "DELETE_USERS", "label": "Delete Users", "category": "User Management", "description": "Can safely remove user accounts"},
    {"key": "VIEW_FARMERS", "label": "View Farmers", "category": "Farmer Management", "description": "Can view farmer records and details"},
    {"key": "MANAGE_FARMERS", "label": "Manage Farmers", "category": "Farmer Management", "description": "Can edit farmer specific profile details"},
    {"key": "PROMOTE_FARMER", "label": "Promote Farmer to Admin", "category": "Role Management", "description": "Can promote farmers to secondary admins"},
    {"key": "DEMOTE_ADMIN", "label": "Demote Secondary Admin", "category": "Role Management", "description": "Can demote secondary admins back to farmers"},
    {"key": "VIEW_PREDICTIONS", "label": "View Predictions", "category": "System Access", "description": "Can view AI prediction stats and logs"},
    {"key": "VIEW_REPORTS", "label": "View Reports", "category": "System Access", "description": "Can view system reports and statistics"},
    {"key": "MANAGE_MARKETPLACE", "label": "Manage Marketplace", "category": "Content Management", "description": "Can moderate marketplace items"},
    {"key": "MANAGE_MARKET_PRICES", "label": "Manage Market Prices & Mandis", "category": "Marketplace & Prices", "description": "Can add, edit, and manage Mandis and crop prices"},
    {"key": "MANAGE_ALERTS", "label": "Manage System Alerts", "category": "System Access", "description": "Can manage and broadcast weather/pest alerts"},
    {"key": "MANAGE_SUPPORT", "label": "Manage Support", "category": "Content Management", "description": "Can handle support requests and community posts"},
    {"key": "MANAGE_CLIMATE_NORMALS", "label": "Manage Climate Normals", "category": "System Access", "description": "Can edit regional state climate weather averages for auto-fill"},
    {"key": "MANAGE_CROPS", "label": "Manage Recommended Crops", "category": "Content Management", "description": "Can edit crop metadata, ideal seasons, market prices, and sustainability ratings"},
    {"key": "VIEW_ANALYTICS", "label": "View Analytics", "category": "System Access", "description": "Can view platform analytics dashboard"},
    {"key": "CAN_CREATE_ACCOUNTS", "label": "Allow Secondary Admin Account Creation", "category": "Account Creation", "description": "Explicit switch for Secondary Admin to create accounts"}
]


def is_primary_admin(user):
    if not user:
        return False
    r = (user.get('role') or '').lower()
    return bool(user.get('is_super_admin')) or r in ['primary_admin', 'superadmin']


def is_secondary_admin(user):
    if not user:
        return False
    r = (user.get('role') or '').lower()
    return r in ['secondary_admin', 'admin'] and not is_primary_admin(user)


def get_user_permissions(user_id, conn=None):
    """Returns a dictionary { 'VIEW_USERS': True/False, ... } for the user."""
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    if not conn:
        return {p['key']: False for p in ALL_PERMISSIONS}

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT is_super_admin, role, can_create_accounts FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return {p['key']: False for p in ALL_PERMISSIONS}

        # Primary admin gets ALL permissions automatically
        if is_primary_admin(user):
            perm_dict = {p['key']: True for p in ALL_PERMISSIONS}
            return perm_dict

        # Farmer / User gets NO admin permissions
        r = (user.get('role') or '').lower()
        if r in ['farmer', 'user']:
            return {p['key']: False for p in ALL_PERMISSIONS}

        # Secondary Admin: query user_permissions table
        cursor.execute("SELECT permission_key, is_granted FROM user_permissions WHERE user_id = %s", (user_id,))
        rows = cursor.fetchall()
        granted_set = {r['permission_key'] for r in rows if bool(r.get('is_granted', 1))}

        # Sync legacy column `can_create_accounts`
        if bool(user.get('can_create_accounts')):
            granted_set.add('CAN_CREATE_ACCOUNTS')
            granted_set.add('CREATE_USERS')

        result = {}
        for p in ALL_PERMISSIONS:
            result[p['key']] = p['key'] in granted_set

        return result
    except Exception as e:
        print(f"Error fetching permissions for user {user_id}: {e}")
        return {p['key']: False for p in ALL_PERMISSIONS}
    finally:
        if should_close:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass


def set_user_permissions(user_id, permissions_map, conn=None):
    """
    Sets permissions for user_id.
    permissions_map can be dict { 'VIEW_USERS': True, ... } or list ['VIEW_USERS', ...]
    """
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    if not conn:
        return False

    if isinstance(permissions_map, list):
        granted_set = set(permissions_map)
        permissions_map = {p['key']: (p['key'] in granted_set) for p in ALL_PERMISSIONS}

    try:
        cursor = conn.cursor(dictionary=True)

        for p in ALL_PERMISSIONS:
            key = p['key']
            val = 1 if bool(permissions_map.get(key)) else 0
            
            # Upsert into user_permissions
            cursor.execute("SELECT id FROM user_permissions WHERE user_id = %s AND permission_key = %s", (user_id, key))
            existing = cursor.fetchone()
            if existing:
                cursor.execute("UPDATE user_permissions SET is_granted = %s WHERE id = %s", (val, existing['id']))
            else:
                cursor.execute(
                    "INSERT INTO user_permissions (user_id, permission_key, is_granted) VALUES (%s, %s, %s)",
                    (user_id, key, val)
                )

        # Update legacy can_create_accounts column
        can_create = 1 if (permissions_map.get('CAN_CREATE_ACCOUNTS') or permissions_map.get('CREATE_USERS')) else 0
        cursor.execute("UPDATE users SET can_create_accounts = %s WHERE id = %s", (can_create, user_id))

        conn.commit()
        return True
    except Exception as e:
        print(f"Error setting permissions for user {user_id}: {e}")
        if should_close:
            conn.rollback()
        return False
    finally:
        if should_close:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass


def log_admin_activity(admin_id, admin_name, action, target_user_id=None, target_user_email=None, old_role=None, new_role=None, details=None, ip_address=None, conn=None):
    """Records an entry into admin_activity_logs."""
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    if not conn:
        return False

    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO admin_activity_logs
               (admin_id, admin_name, action, target_user_id, target_user_email, old_role, new_role, details, ip_address)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (admin_id, admin_name, action, target_user_id, target_user_email, old_role, new_role, details, ip_address)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error logging admin activity: {e}")
        return False
    finally:
        if should_close:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass

