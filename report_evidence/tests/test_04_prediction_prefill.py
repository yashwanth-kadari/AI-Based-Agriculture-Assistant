import sys
import os
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))
from utils.db import get_db_connection

BASE_URL = 'http://localhost:5000/api'


@pytest.fixture(scope="module")
def farmer_token():
    res = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'vikram.singh@agriassist.com',
        'password': 'Password@123',
        'role': 'farmer'
    })
    assert res.status_code == 200, f"Farmer login failed: {res.text}"
    return res.json()['token']


def test_prediction_prefill_soil_values_from_latest_report(farmer_token):
    """
    Test that user's latest soil report is retrieved with accurate N, P, K, pH
    for frontend auto-fill synchronization.
    """
    headers = {'Authorization': f'Bearer {farmer_token}'}
    # 1. Post a known soil test report
    res_soil = httpx.post(f'{BASE_URL}/soil/analyze', json={
        'N': 92.0,
        'P': 44.0,
        'K': 36.0,
        'ph': 6.6,
        'temperature': 25.0,
        'humidity': 60.0,
        'rainfall': 130.0
    }, headers=headers)
    assert res_soil.status_code == 200

    # 2. Fetch soil reports
    res_get = httpx.get(f'{BASE_URL}/soil/reports', headers=headers)
    assert res_get.status_code == 200
    reports = res_get.json().get('reports', [])
    assert len(reports) > 0

    latest = reports[0]
    assert float(latest['n_content']) == 92.0
    assert float(latest['p_content']) == 44.0
    assert float(latest['k_content']) == 36.0
    assert float(latest['ph']) == 6.6


def test_prediction_fallback_climate_normals_response_flag(farmer_token):
    """
    Test that blank temperature, humidity, rainfall use regional climate normals
    and return used_climate_normals=True in the API response.
    """
    headers = {'Authorization': f'Bearer {farmer_token}'}
    res = httpx.post(f'{BASE_URL}/predictions/crop', json={
        'state': 'Punjab',
        'N': 90.0,
        'P': 42.0,
        'K': 43.0,
        'ph': 6.5,
        'temperature': '',  # Blank
        'humidity': '',     # Blank
        'rainfall': ''      # Blank
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data.get('used_climate_normals') is True
    # Values substituted from Punjab climate normal
    parsed = data.get('parsed_parameters', {})
    assert 20.0 <= parsed.get('temperature', 0) <= 30.0


def test_prediction_fallback_is_estimated_flag_stored_in_db(farmer_token):
    """
    TEST-04C: Verify what the codebase really stores for the estimated flag.
    When qualitative estimation is requested (is_estimated=True), the backend persists
    the status as 'Estimated (Qualitative)' in `crop_yield_records` and records
    '(Qualitative Estimation)' in the user's history log.
    """
    headers = {'Authorization': f'Bearer {farmer_token}'}
    res_yield = httpx.post(f'{BASE_URL}/predictions/yield', json={
        'crop_type': 'Wheat',
        'is_estimated': True,
        'state': 'Punjab',
        'N': 80.0,
        'P': 40.0,
        'K': 35.0,
        'ph': 6.5,
        'temperature': '',
        'humidity': '',
        'rainfall': ''
    }, headers=headers)
    assert res_yield.status_code == 200
    assert res_yield.json().get('is_estimated') is True
    assert res_yield.json().get('used_climate_normals') is True

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT status
        FROM crop_yield_records
        WHERE user_id = 29
        ORDER BY id DESC LIMIT 1
    """)
    yield_row = cursor.fetchone()

    cursor.execute("""
        SELECT details
        FROM history
        WHERE user_id = 29 AND action = 'Yield Classification'
        ORDER BY id DESC LIMIT 1
    """)
    hist_row = cursor.fetchone()
    cursor.close()
    conn.close()

    assert yield_row is not None
    assert yield_row['status'] == 'Estimated (Qualitative)'
    assert hist_row is not None
    assert '(Qualitative Estimation)' in hist_row['details']


def test_prediction_non_blank_climate_not_overridden(farmer_token):
    """
    Test that when non-blank environmental parameters are supplied,
    they are preserved exactly and used_climate_normals is False.
    """
    headers = {'Authorization': f'Bearer {farmer_token}'}
    res = httpx.post(f'{BASE_URL}/predictions/crop', json={
        'state': 'Punjab',
        'N': 80.0,
        'P': 40.0,
        'K': 35.0,
        'ph': 6.5,
        'temperature': 33.7,  # Custom specific value
        'humidity': 51.2,     # Custom specific value
        'rainfall': 88.5      # Custom specific value
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data.get('used_climate_normals') is False

    # Verify database saved the exact specified values
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT temperature, humidity, rainfall
        FROM predictions
        WHERE user_id = 29
        ORDER BY id DESC LIMIT 1
    """)
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    assert row is not None
    assert round(float(row['temperature']), 1) == 33.7
    assert round(float(row['humidity']), 1) == 51.2
    assert round(float(row['rainfall']), 1) == 88.5
