import sys
import os
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))
from utils.db import get_db_connection

BASE_URL = 'http://localhost:5000/api'


def test_auth_valid_login():
    """Test that valid login returns 200, JWT token, and user profile."""
    res = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'vikram.singh@agriassist.com',
        'password': 'Password@123',
        'role': 'farmer'
    })
    assert res.status_code == 200
    data = res.json()
    assert 'token' in data
    assert len(data['token']) > 20
    assert data.get('user', {}).get('email') == 'vikram.singh@agriassist.com'


def test_auth_wrong_password_rejected():
    """Test that wrong password returns 401 and rejection error message."""
    res = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'vikram.singh@agriassist.com',
        'password': 'WrongPassword999!',
        'role': 'farmer'
    })
    assert res.status_code in [400, 401]
    data = res.json()
    assert 'error' in data or 'message' in data


def test_auth_duplicate_email_rejected():
    """Test that duplicate email signup returns 400 and is rejected."""
    res = httpx.post(f'{BASE_URL}/auth/signup', json={
        'user_id': 'vikram_unique_dup_id',
        'name': 'Duplicate Test User',
        'email': 'vikram.singh@agriassist.com',  # Already exists
        'password': 'Password@123',
        'role': 'farmer',
        'state': 'Punjab',
        'district': 'Ludhiana'
    })
    assert res.status_code == 400
    data = res.json()
    assert 'already' in data.get('error', '').lower()


def test_auth_password_stored_as_hash():
    """Test that user passwords in the MySQL database are stored as secure hashes, not plaintext."""
    conn = get_db_connection()
    assert conn is not None
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT password_hash FROM users WHERE email = %s", ('vikram.singh@agriassist.com',))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    assert row is not None
    stored_hash = row['password_hash']
    # Plain text password is never stored
    assert stored_hash != 'Password@123'
    # Must use Werkzeug pbkdf2 or sha256 hashing scheme
    assert stored_hash.startswith('pbkdf2:sha256:') or stored_hash.startswith('scrypt:')
