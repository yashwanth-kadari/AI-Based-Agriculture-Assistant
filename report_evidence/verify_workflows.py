import sys
import os

# Ensure backend in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app import app
import httpx

client = httpx.Client(transport=httpx.WSGITransport(app=app), base_url='http://localhost:5000')

print("=" * 60)
print("1. FARMER WORKFLOW RUNTIME VERIFICATION")
print("=" * 60)

# 1. Login Farmer
r_login = client.post('/api/auth/login', json={
    'email': 'farmer@agriassist.com',
    'password': 'farmer123',
    'role': 'farmer'
})
assert r_login.status_code == 200, f"Farmer login failed: {r_login.text}"
f_token = r_login.json()['token']
f_headers = {'Authorization': f'Bearer {f_token}'}
print(f"[+] 1. Farmer Login: SUCCESS (User: {r_login.json()['user']['name']})")

# 2. Farmer Dashboard Stats
r_dash = client.get('/api/dashboard', headers=f_headers)
assert r_dash.status_code == 200
print(f"[+] 2. Dashboard Stats: HTTP 200 (Risk: {r_dash.json().get('risk_level')}, Soil: {r_dash.json().get('soil_health')})")

# 3. Soil Reports
r_soil = client.get('/api/soil/reports', headers=f_headers)
assert r_soil.status_code == 200
soil_count = len(r_soil.json().get('reports', []))
print(f"[+] 3. Soil Reports: HTTP 200 (Found {soil_count} reports)")

# 4. Crop Recommendation (Gaussian Naive Bayes)
r_crop = client.post('/api/predictions/crop', json={
    'N': 85.0,
    'P': 42.0,
    'K': 38.0,
    'temperature': 26.5,
    'humidity': 68.0,
    'ph': 6.5,
    'rainfall': 140.0
}, headers=f_headers)
assert r_crop.status_code == 200
crop_res = r_crop.json()
print(f"[+] 4. Crop Recommendation (GaussianNB): HTTP 200 -> Crop: {crop_res.get('crop')} (Confidence: {crop_res.get('confidence')}%)")

# 5. Pest Outbreak Prediction
r_pest = client.post('/api/predictions/pest', json={
    'N': 80.0,
    'P': 40.0,
    'K': 35.0,
    'temperature': 28.0,
    'humidity': 75.0,
    'ph': 6.5,
    'rainfall': 110.0
}, headers=f_headers)
assert r_pest.status_code == 200
print(f"[+] 5. Pest Risk Prediction (GaussianNB): HTTP 200 -> Pest: {r_pest.json().get('pest')}")

# 6. Yield Prediction
r_yield = client.post('/api/predictions/yield', json={
    'area_acres': 5.0,
    'crop_name': 'Rice',
    'N': 85.0,
    'P': 42.0,
    'K': 38.0,
    'ph': 6.5,
    'temperature': 26.5,
    'humidity': 68.0,
    'rainfall': 140.0,
    'is_estimated': False
}, headers=f_headers)
assert r_yield.status_code == 200
print(f"[+] 6. Yield Prediction (GaussianNB): HTTP 200 -> Level: {r_yield.json().get('yield_level')}, Expected: {r_yield.json().get('expected_yield_per_acre')} kg/acre")

# 7. Real-Time Weather Forecast & Advisories
r_wx = client.get('/api/weather/forecast?state=Punjab&district=Ludhiana')
assert r_wx.status_code == 200
wx_data = r_wx.json()
print(f"[+] 7. Weather Forecast: HTTP 200 -> Source: {wx_data.get('source')}, {len(wx_data.get('daily', []))} Days Outlook, Advisories: {len(wx_data.get('advisories', []))}")

# 8. Submit Expert Advice Consultation
r_exp = client.post('/api/expert/consultations', json={
    'crop_name': 'Wheat',
    'topic': 'Irrigation & Water Stress',
    'question': 'What is optimal irrigation schedule during flowering stage?',
    'urgency': 'Normal'
}, headers=f_headers)
assert r_exp.status_code == 201
exp_consult = r_exp.json()['consultation']
exp_id = exp_consult['id']
print(f"[+] 8. Expert Consultation Submitted: HTTP 201 -> Inquiry ID: {exp_id}, Status: {exp_consult['status']}")

# 9. Marketplace Items
r_mkt = client.get('/api/marketplace/items')
assert r_mkt.status_code == 200
print(f"[+] 9. Marketplace Listings: HTTP 200 -> {len(r_mkt.json().get('items', []))} Active Items")

# 10. Community Forum Posts
r_comm = client.get('/api/community/posts')
assert r_comm.status_code == 200
print(f"[+] 10. Community Forum: HTTP 200 -> {len(r_comm.json().get('posts', []))} Posts")

# 11. Financial Autofill & Calculations
r_fin = client.get('/api/financial/autofill?crop=Rice', headers=f_headers)
assert r_fin.status_code == 200
print(f"[+] 11. Financial Autofill: HTTP 200 -> Mandi Price: Rs.{r_fin.json().get('mandi_price_per_kg')}/kg")

# 12. Smart Risk Monitoring
r_risk = client.get('/api/risk/status', headers=f_headers)
assert r_risk.status_code == 200
print(f"[+] 12. Smart Risk Monitoring: HTTP 200 -> Overall Level: {r_risk.json().get('overall_level')}")

print("\n" + "=" * 60)
print("2. ADMINISTRATOR WORKFLOW RUNTIME VERIFICATION")
print("=" * 60)

# 1. Admin Login
r_alogin = client.post('/api/auth/login', json={
    'email': 'admin@agrismart.in',
    'password': 'Admin@123',
    'role': 'primary_admin'
})
assert r_alogin.status_code == 200
a_token = r_alogin.json()['token']
a_headers = {'Authorization': f'Bearer {a_token}'}
print(f"[+] 1. Primary Admin Login: SUCCESS (Role: {r_alogin.json()['user']['role']})")

# 2. System Overview & Statistics
r_astats = client.get('/api/admin/statistics', headers=a_headers)
assert r_astats.status_code == 200
print(f"[+] 2. Admin Statistics: HTTP 200 -> Total Users: {r_astats.json().get('total_users')}, Total Predictions: {r_astats.json().get('total_predictions')}")

# 3. User Management Directory
r_ausers = client.get('/api/admin/users', headers=a_headers)
assert r_ausers.status_code == 200
print(f"[+] 3. Admin User Directory: HTTP 200 -> {len(r_ausers.json().get('users', []))} Registered Users")

# 4. ML Model Status & Diagnostics
r_aml = client.get('/api/admin/ml-status', headers=a_headers)
assert r_aml.status_code == 200
print(f"[+] 4. ML Status & Integrity: HTTP 200 -> Crop Model Exists: {r_aml.json().get('models', {}).get('crop_model', {}).get('exists')}")

# 5. Climate Normals Admin Directory
r_acn = client.get('/api/admin/climate-normals', headers=a_headers)
assert r_acn.status_code == 200
print(f"[+] 5. Climate Normals Admin: HTTP 200 -> {len(r_acn.json().get('climate_normals', []))} States Configured")

# 6. Admin Reply to Farmer Consultation
r_areply = client.post(f'/api/expert/consultations/{exp_id}/reply', json={
    'expert_reply': 'Apply light irrigation at crown root initiation and flowering; avoid standing water.',
    'expert_name': 'Dr. Raman (Senior Agronomist)'
}, headers=a_headers)
assert r_areply.status_code == 200
print(f"[+] 6. Admin Expert Guidance Reply: HTTP 200 -> Status: {r_areply.json()['consultation']['status']}")

# 7. Verify Farmer Sees Answered Status
r_fconsult = client.get('/api/expert/consultations', headers=f_headers)
assert r_fconsult.status_code == 200
my_inquiries = r_fconsult.json().get('consultations', [])
matching = [c for c in my_inquiries if c['id'] == exp_id]
assert len(matching) == 1 and matching[0]['status'] == 'Answered'
print(f"[+] 7. Farmer Consultation Sync: SUCCESS (Farmer sees Answered status with Dr. Raman's reply)")

# 8. Clean up test inquiry
r_adel = client.delete(f'/api/expert/consultations/{exp_id}', headers=a_headers)
assert r_adel.status_code == 200
print(f"[+] 8. Cleaned up verification inquiry ID {exp_id}: HTTP 200")

print("\n" + "=" * 60)
print("ALL RUNTIME FARMER & ADMIN WORKFLOWS VERIFIED (100% SUCCESS)")
print("=" * 60)
