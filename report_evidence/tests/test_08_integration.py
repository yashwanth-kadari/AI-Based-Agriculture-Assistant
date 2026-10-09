import sys
import os
import time
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))
from utils.db import get_db_connection

BASE_URL = 'http://localhost:5000/api'


def test_end_to_end_integration_flow():
    """
    End-to-End Integration Flow:
    1. Sign up a new farmer
    2. Log in with the credentials to obtain a JWT token
    3. Submit a soil health report
    4. Request an AI crop recommendation
    5. Query user history and verify that the crop prediction action was recorded
    """
    timestamp = int(time.time())
    user_id_str = f'e2e_farmer_{timestamp}'
    email_str = f'e2e_farmer_{timestamp}@agriassist.com'
    password_str = 'Password@123'

    # 1. Signup
    signup_payload = {
        'user_id': user_id_str,
        'name': f'E2E Test Farmer {timestamp}',
        'email': email_str,
        'password': password_str,
        'role': 'farmer',
        'state': 'Punjab',
        'district': 'Ludhiana'
    }
    res_signup = httpx.post(f'{BASE_URL}/auth/signup', json=signup_payload)
    assert res_signup.status_code == 201, f"Signup failed: {res_signup.text}"

    # 2. Login
    login_payload = {
        'email': email_str,
        'password': password_str,
        'role': 'farmer'
    }
    res_login = httpx.post(f'{BASE_URL}/auth/login', json=login_payload)
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    login_data = res_login.json()
    token = login_data['token']
    db_user_id = login_data['user']['id']
    assert token is not None
    assert db_user_id is not None

    headers = {'Authorization': f'Bearer {token}'}

    # 3. Submit Soil Report
    soil_payload = {
        'user_id': db_user_id,
        'N': 88.0,
        'P': 42.0,
        'K': 38.0,
        'ph': 6.8,
        'temperature': 25.0,
        'humidity': 62.0,
        'rainfall': 140.0
    }
    res_soil = httpx.post(f'{BASE_URL}/soil/analyze', json=soil_payload, headers=headers)
    assert res_soil.status_code == 200, f"Soil report failed: {res_soil.text}"
    soil_data = res_soil.json()
    assert soil_data.get('health_status') is not None

    # 4. Request AI Crop Recommendation
    crop_payload = {
        'user_id': db_user_id,
        'state': 'Punjab',
        'N': 88.0,
        'P': 42.0,
        'K': 38.0,
        'ph': 6.8,
        'temperature': 25.0,
        'humidity': 62.0,
        'rainfall': 140.0
    }
    res_crop = httpx.post(f'{BASE_URL}/predictions/crop', json=crop_payload, headers=headers)
    assert res_crop.status_code == 200, f"Crop prediction failed: {res_crop.text}"
    crop_data = res_crop.json()
    assert 'crop' in crop_data
    assert crop_data['crop'] in ['Rice', 'Wheat', 'Maize', 'Cotton']

    # 5. Query user history and verify entry
    res_history = httpx.get(f'{BASE_URL}/history/?user_id={db_user_id}', headers=headers)
    assert res_history.status_code == 200, f"History fetch failed: {res_history.text}"
    hist_entries = res_history.json().get('history', [])
    assert len(hist_entries) > 0, "No history records found for user"

    actions = [h['action'] for h in hist_entries]
    assert 'Crop Recommendation' in actions, f"Expected 'Crop Recommendation' in {actions}"

    # Verify the details string contains the recommended crop
    crop_hist = next(h for h in hist_entries if h['action'] == 'Crop Recommendation')
    assert crop_data['crop'] in crop_hist['details']
