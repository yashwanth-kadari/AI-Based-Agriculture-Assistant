import sys
import os
import pytest
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))

BASE_URL = 'http://localhost:5000/api'


def test_weather_forecast_endpoint():
    """Verify live weather forecast and agronomic advisories endpoint."""
    res = httpx.get(f'{BASE_URL}/weather/forecast', params={'state': 'Punjab', 'district': 'Ludhiana'})
    assert res.status_code == 200
    data = res.json()
    assert data.get('status') == 'success'
    assert 'current' in data
    assert 'daily' in data
    assert len(data['daily']) == 7
    assert 'advisories' in data
    assert len(data['advisories']) > 0
    assert data.get('location', {}).get('state') == 'Punjab'


def test_weather_forecast_default_fallback():
    """Verify weather endpoint handles invalid/unknown state gracefully without crashing."""
    res = httpx.get(f'{BASE_URL}/weather/forecast', params={'state': 'UnknownRegion999'})
    assert res.status_code == 200
    data = res.json()
    assert data.get('status') == 'success'
    assert 'current' in data
    assert 'daily' in data
    assert len(data['daily']) == 7


def test_expert_consultations_lifecycle():
    """Verify end-to-end expert consultation lifecycle: submit -> review/reply -> verify."""
    # 1. Login Farmer
    login_f = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'farmer@agriassist.com',
        'password': 'farmer123',
        'role': 'farmer'
    })
    assert login_f.status_code == 200
    f_token = login_f.json()['token']

    # 2. Submit Inquiry
    submit_res = httpx.post(
        f'{BASE_URL}/expert/consultations',
        json={
            'crop_name': 'Rice',
            'topic': 'Fungal / Bacterial Disease',
            'question': 'Brown circular spots appearing on lower leaves after recent rainfall.',
            'urgency': 'High'
        },
        headers={'Authorization': f'Bearer {f_token}'}
    )
    assert submit_res.status_code == 201
    inquiry = submit_res.json().get('consultation')
    assert inquiry is not None
    inquiry_id = inquiry['id']
    assert inquiry['status'] == 'Pending'
    assert inquiry['crop_name'] == 'Rice'

    # 3. Farmer views own consultations
    get_res = httpx.get(
        f'{BASE_URL}/expert/consultations',
        headers={'Authorization': f'Bearer {f_token}'}
    )
    assert get_res.status_code == 200
    consultations = get_res.json().get('consultations', [])
    assert any(c['id'] == inquiry_id for c in consultations)

    # 4. Login Admin
    login_a = httpx.post(f'{BASE_URL}/auth/login', json={
        'email': 'admin@agrismart.in',
        'password': 'Admin@123',
        'role': 'primary_admin'
    })
    assert login_a.status_code == 200
    a_token = login_a.json()['token']

    # 5. Admin replies to consultation
    reply_res = httpx.post(
        f'{BASE_URL}/expert/consultations/{inquiry_id}/reply',
        json={
            'expert_reply': 'Symptoms indicate early Brown Spot disease (Helminthosporium oryzae). Apply Tricyclazole 75 WP at 0.6 g/L water.',
            'expert_name': 'Dr. K. Swaminathan (Plant Pathologist)'
        },
        headers={'Authorization': f'Bearer {a_token}'}
    )
    assert reply_res.status_code == 200
    updated_inquiry = reply_res.json().get('consultation')
    assert updated_inquiry['status'] == 'Answered'
    assert 'Tricyclazole' in updated_inquiry['expert_reply']

    # 6. Farmer deletes inquiry
    del_res = httpx.delete(
        f'{BASE_URL}/expert/consultations/{inquiry_id}',
        headers={'Authorization': f'Bearer {f_token}'}
    )
    assert del_res.status_code == 200
