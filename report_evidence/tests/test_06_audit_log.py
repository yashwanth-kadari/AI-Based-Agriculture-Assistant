import sys
import os
import time
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))
from utils.db import get_db_connection

BASE_URL = 'http://localhost:5000/api'


@pytest.fixture(scope="module")
def admin_token():
    res = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'admin@agrismart.in',
        'password': 'Admin@123',
        'role': 'admin'
    })
    return res.json()['token']


def test_admin_audit_logging_create_update_delete(admin_token):
    """
    Test that administrative create, update, and delete actions each
    write an immutable audit entry to admin_activity_logs.
    """
    headers = {'Authorization': f'Bearer {admin_token}'}
    unique_ts = int(time.time())

    # 1. CREATE ACTION: Create a test user via POST /api/admin/users
    create_payload = {
        'user_id': f'audit_usr_{unique_ts}',
        'name': f'Audit Test {unique_ts}',
        'email': f'audit_{unique_ts}@test.com',
        'password': 'Password@123',
        'role': 'farmer',
        'state': 'Punjab',
        'district': 'Ludhiana'
    }
    res_create = httpx.post(f'{BASE_URL}/admin/users', json=create_payload, headers=headers)
    assert res_create.status_code in [200, 201], f"Create user failed: {res_create.text}"
    created_id = res_create.json()['user']['id']

    # Verify audit log entry for CREATE (using fresh connection to avoid snapshot isolation)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM admin_activity_logs
        WHERE target_user_id = %s AND (action LIKE '%Created%' OR action LIKE '%CREATE%')
        ORDER BY id DESC LIMIT 1
    """, (created_id,))
    create_log = cursor.fetchone()
    cursor.close()
    conn.close()

    assert create_log is not None, f"Audit log did not record CREATE action for user {created_id}"
    assert create_log['target_user_id'] == created_id

    # 2. UPDATE ACTION: Update the test user's status or details
    res_update = httpx.put(
        f'{BASE_URL}/admin/users/{created_id}',
        json={'name': f'Audit Test Updated {unique_ts}'},
        headers=headers
    )
    assert res_update.status_code == 200, f"Update user failed: {res_update.text}"

    # Verify audit log entry for UPDATE
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM admin_activity_logs
        WHERE target_user_id = %s AND (action LIKE '%Update%' OR action LIKE '%UPDATE%')
        ORDER BY id DESC LIMIT 1
    """, (created_id,))
    update_log = cursor.fetchone()
    cursor.close()
    conn.close()

    assert update_log is not None, f"Audit log did not record UPDATE action for user {created_id}"
    assert update_log['target_user_id'] == created_id

    # 3. DELETE ACTION: Delete the test user
    res_delete = httpx.delete(f'{BASE_URL}/admin/users/{created_id}', headers=headers)
    assert res_delete.status_code == 200, f"Delete user failed: {res_delete.text}"

    # Verify audit log entry for DELETE
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM admin_activity_logs
        WHERE target_user_id = %s AND (action LIKE '%Delete%' OR action LIKE '%DELETE%')
        ORDER BY id DESC LIMIT 1
    """, (created_id,))
    delete_log = cursor.fetchone()
    cursor.close()
    conn.close()

    assert delete_log is not None, f"Audit log did not record DELETE action for user {created_id}"
    assert delete_log['target_user_id'] == created_id
