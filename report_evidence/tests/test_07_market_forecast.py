import sys
import os
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))

BASE_URL = 'http://localhost:5000/api'


def test_market_forecast_14_day():
    """Test that a 14-day market price forecast returns 200 and a positive predicted price."""
    res = httpx.post(f'{BASE_URL}/market/forecast', json={
        'crop_name': 'Rice',
        'mandi_id': 3,
        'forecast_days': 14
    })
    assert res.status_code == 200
    data = res.json()
    assert data.get('forecast_days') == 14
    assert float(data.get('predicted_price', 0)) > 0
    assert 'trend' in data


def test_market_forecast_30_day():
    """Test that a 30-day market price forecast returns 200 and a positive predicted price."""
    res = httpx.post(f'{BASE_URL}/market/forecast', json={
        'crop_name': 'Rice',
        'mandi_id': 3,
        'forecast_days': 30
    })
    assert res.status_code == 200
    data = res.json()
    assert data.get('forecast_days') == 30
    assert float(data.get('predicted_price', 0)) > 0
    assert 'trend' in data


def test_market_forecast_7_day_backend_acceptance():
    """
    Check what happens when forecast_days=7 is sent.
    The project booklet mentions the 7-day option was withheld/designed for exclusion,
    but tests verify that the backend API continues to accept forecast_days=7 and responds with 200.
    """
    res = httpx.post(f'{BASE_URL}/market/forecast', json={
        'crop_name': 'Rice',
        'mandi_id': 3,
        'forecast_days': 7
    })
    assert res.status_code == 200
    data = res.json()
    assert data.get('forecast_days') == 7
    assert float(data.get('predicted_price', 0)) > 0
    assert data.get('crop_name') == 'Rice'
