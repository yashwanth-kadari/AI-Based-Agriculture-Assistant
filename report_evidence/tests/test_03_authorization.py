import sys
import os
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))
from utils.db import get_db_connection
from utils.admin_helpers import set_user_permissions, get_user_permissions

BASE_URL = 'http://localhost:5000/api'


@pytest.fixture(scope="module")
def tokens():
    # Login Farmer
    res_f = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'vikram.singh@agriassist.com',
        'password': 'Password@123',
        'role': 'farmer'
    })
    f_token = res_f.json()['token']

    # Login Secondary Admin
    res_s = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'admin@agriassist.com',
        'password': 'admin123',
        'role': 'admin'
    })
    s_token = res_s.json()['token']
    s_user_id = res_s.json()['user']['id']

    # Login Primary Admin
    res_p = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'admin@agrismart.in',
        'password': 'Admin@123',
        'role': 'admin'
    })
    p_token = res_p.json()['token']

    return {
        'farmer': f_token,
        'secondary_admin': s_token,
        'secondary_admin_id': s_user_id,
        'primary_admin': p_token
    }


def test_authorization_farmer_cannot_access_admin_routes(tokens):
    """Test that a farmer token is rejected with 403 Forbidden on /api/admin endpoints."""
    headers = {'Authorization': f'Bearer {tokens["farmer"]}'}
    res_users = httpx.get(f'{BASE_URL}/admin/users', headers=headers)
    assert res_users.status_code == 403
    assert 'forbidden' in res_users.json().get('error', '').lower()

    res_stats = httpx.get(f'{BASE_URL}/admin/statistics', headers=headers)
    assert res_stats.status_code == 403


def test_authorization_secondary_admin_without_permission_refused(tokens):
    """
    Test that a secondary admin WITHOUT the 'DELETE_USERS' permission is refused with 403.
    """
    sec_id = tokens['secondary_admin_id']
    # Explicitly ensure DELETE_USERS is False
    set_user_permissions(sec_id, {'DELETE_USERS': False})

    # Create a temporary dummy user to attempt deletion on
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (user_id, name, email, password_hash, role, status)
        VALUES ('temp_del_target1', 'Del Target 1', 'del_target1@test.com', 'dummyhash', 'farmer', 'active')
    """)
    conn.commit()
    target_id = cursor.lastrowid
    cursor.close()
    conn.close()

    headers = {'Authorization': f'Bearer {tokens["secondary_admin"]}'}
    res = httpx.delete(f'{BASE_URL}/admin/users/{target_id}', headers=headers)
    assert res.status_code == 403
    assert 'permission' in res.json().get('error', '').lower()

    # Clean up test user
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE id = %s", (target_id,))
    conn.commit()
    c.close()
    conn.close()


def test_authorization_secondary_admin_with_permission_succeeds(tokens):
    """
    Test that a secondary admin WITH the 'DELETE_USERS' permission succeeds with 200.
    """
    sec_id = tokens['secondary_admin_id']
    # Grant DELETE_USERS permission
    set_user_permissions(sec_id, {'DELETE_USERS': True})

    # Create temporary dummy user to delete
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (user_id, name, email, password_hash, role, status)
        VALUES ('temp_del_target2', 'Del Target 2', 'del_target2@test.com', 'dummyhash', 'farmer', 'active')
    """)
    conn.commit()
    target_id = cursor.lastrowid
    cursor.close()
    conn.close()

    headers = {'Authorization': f'Bearer {tokens["secondary_admin"]}'}
    res = httpx.delete(f'{BASE_URL}/admin/users/{target_id}', headers=headers)
    assert res.status_code == 200
    assert 'deleted' in res.json().get('message', '').lower()

    # Reset permission back to False
    set_user_permissions(sec_id, {'DELETE_USERS': False})


def test_unauthenticated_history_endpoints_return_401():
    """Verify that anonymous requests to history endpoints return 401 Unauthorized."""
    res_main = httpx.get(f'{BASE_URL}/history/')
    assert res_main.status_code == 401, f"Expected 401 on /history/, got {res_main.status_code}"

    res_crop = httpx.get(f'{BASE_URL}/predictions/crop/history')
    assert res_crop.status_code == 401, f"Expected 401 on /predictions/crop/history, got {res_crop.status_code}"

    res_pest = httpx.get(f'{BASE_URL}/predictions/pest/history')
    assert res_pest.status_code == 401, f"Expected 401 on /predictions/pest/history, got {res_pest.status_code}"

    res_yield = httpx.get(f'{BASE_URL}/predictions/yield/history')
    assert res_yield.status_code == 401, f"Expected 401 on /predictions/yield/history, got {res_yield.status_code}"


def test_unauthenticated_financial_endpoints_return_401():
    """Verify that anonymous requests to financial endpoints return 401 Unauthorized."""
    res_summary = httpx.get(f'{BASE_URL}/financial/summary')
    assert res_summary.status_code == 401, f"Expected 401 on /financial/summary, got {res_summary.status_code}"

    res_calc = httpx.post(f'{BASE_URL}/financial/calculate', json={
        'crop': 'Wheat',
        'land_area': 5.0,
        'state': 'Punjab',
        'season': 'Rabi'
    })
    assert res_calc.status_code == 401, f"Expected 401 on /financial/calculate, got {res_calc.status_code}"

    res_hist = httpx.get(f'{BASE_URL}/financial/history')
    assert res_hist.status_code == 401, f"Expected 401 on /financial/history, got {res_hist.status_code}"

    res_auto = httpx.get(f'{BASE_URL}/financial/autofill?crop=Wheat')
    assert res_auto.status_code == 401, f"Expected 401 on /financial/autofill, got {res_auto.status_code}"


def test_unauthenticated_marketplace_delete_returns_401():
    """Verify that anonymous requests to DELETE /marketplace/items/<id> return 401 Unauthorized."""
    res_del = httpx.delete(f'{BASE_URL}/marketplace/items/999999')
    assert res_del.status_code == 401, f"Expected 401 on anonymous DELETE /marketplace/items, got {res_del.status_code}"


def test_marketplace_delete_owner_or_admin_only(tokens):
    """
    Verify that on marketplace DELETE, only the item's owner or an admin is allowed,
    and a different non-admin user is rejected with 403 Forbidden.
    """
    farmer_headers = {'Authorization': f'Bearer {tokens["farmer"]}'}
    admin_headers = {'Authorization': f'Bearer {tokens["primary_admin"]}'}

    # 1. Farmer creates listing
    res_create = httpx.post(f'{BASE_URL}/marketplace/items', json={
        'title': 'Test Auth Item Wheat',
        'category': 'Crops',
        'price': 2500,
        'quantity': '10 quintals',
        'contact': '9876543210'
    }, headers=farmer_headers)
    assert res_create.status_code == 201

    conn = get_db_connection()
    c = conn.cursor(dictionary=True)
    c.execute("SELECT id, user_id FROM marketplace_items WHERE title = 'Test Auth Item Wheat' ORDER BY id DESC LIMIT 1")
    item = c.fetchone()
    c.close()
    conn.close()
    assert item is not None
    item_id = item['id']

    # 2. Create another user who is neither owner nor admin
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        INSERT INTO users (user_id, name, email, password_hash, role, status)
        VALUES ('other_user_auth_test', 'Other User', 'other_user@test.com', 'dummyhash', 'farmer', 'active')
    """)
    conn.commit()
    c.close()
    conn.close()

    # Generate a token for other user
    from flask_jwt_extended import create_access_token
    import app
    with app.app.app_context():
        other_token = create_access_token(identity='other_user_auth_test')
    other_headers = {'Authorization': f'Bearer {other_token}'}

    # Other user tries to delete -> 403 Forbidden
    res_other = httpx.delete(f'{BASE_URL}/marketplace/items/{item_id}', headers=other_headers)
    assert res_other.status_code == 403, f"Expected 403 for non-owner, got {res_other.status_code}"

    # 3. Admin deletes -> 200 OK
    res_admin = httpx.delete(f'{BASE_URL}/marketplace/items/{item_id}', headers=admin_headers)
    assert res_admin.status_code == 200, f"Expected 200 for admin delete, got {res_admin.status_code}"

    # Clean up test user
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE user_id = 'other_user_auth_test'")
    conn.commit()
    c.close()
    conn.close()
