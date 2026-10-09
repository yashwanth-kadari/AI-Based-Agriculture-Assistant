import sys
import os
import pytest
import httpx
from datetime import date, timedelta

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


def test_risk_alert_expiry_behavior(farmer_token):
    """
    Test that:
    1. An alert with a past expiry_date does NOT affect /api/risk/status
    2. An alert with a future (active) expiry_date DOES affect /api/risk/status and escalates risk
    """
    headers = {'Authorization': f'Bearer {farmer_token}'}
    conn = get_db_connection()
    assert conn is not None
    cursor = conn.cursor(dictionary=True)

    past_date = (date.today() - timedelta(days=2)).strftime('%Y-%m-%d')
    future_date = (date.today() + timedelta(days=5)).strftime('%Y-%m-%d')

    # Insert an expired critical alert using the schema's exact columns:
    # (alert_type, message, severity, status, expiry_date)
    cursor.execute("""
        INSERT INTO alerts (alert_type, message, severity, status, expiry_date)
        VALUES ('Pest', 'Expired Locust Outbreak Alert', 'Critical', 'Active', %s)
    """, (past_date,))
    conn.commit()
    expired_alert_id = cursor.lastrowid

    try:
        # Check /api/risk/status (without active alert)
        res_expired = httpx.get(f'{BASE_URL}/risk/status', headers=headers)
        assert res_expired.status_code == 200
        data_expired = res_expired.json()

        # The expired alert must NOT be present in active_alerts
        active_ids = [a['id'] for a in data_expired.get('active_alerts', [])]
        assert expired_alert_id not in active_ids

        # Now insert an active critical alert
        cursor.execute("""
            INSERT INTO alerts (alert_type, message, severity, status, expiry_date)
            VALUES ('Pest', 'Active Emergency Locust Swarm Alert', 'Critical', 'Active', %s)
        """, (future_date,))
        conn.commit()
        active_alert_id = cursor.lastrowid

        try:
            # Check /api/risk/status with active critical alert
            res_active = httpx.get(f'{BASE_URL}/risk/status', headers=headers)
            assert res_active.status_code == 200
            data_active = res_active.json()

            # Active alert must be present in active_alerts list
            new_active_ids = [a['id'] for a in data_active.get('active_alerts', [])]
            assert active_alert_id in new_active_ids

            # Overall risk must now be elevated to 'Critical'
            assert data_active['overall_risk'] == 'Critical'

        finally:
            cursor.execute("DELETE FROM alerts WHERE id = %s", (active_alert_id,))
            conn.commit()

    finally:
        cursor.execute("DELETE FROM alerts WHERE id = %s", (expired_alert_id,))
        conn.commit()
        cursor.close()
        conn.close()
