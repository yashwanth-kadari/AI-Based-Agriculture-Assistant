# AgriSmart AI — Automated Test Execution Results

**Execution Command**: `python -m pytest report_evidence/tests -v`  
**Test Framework**: pytest 9.1.1 (Python 3.14.7)  
**Execution Timestamp**: 2026-10-09  
**Full Raw Terminal Log**: [`pytest_output.txt`](file:///d:/coder/agriculture/report_evidence/tests/pytest_output.txt)  
**Summary**: **29 PASSED**, **0 FAILED** out of 29 total test cases (100% Pass Rate).

---

## Results Summary Table

| Test ID | Category | Description | Input / Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-01A** | Unit | Soil NPK threshold boundaries (`analyze_npk`) | N=40..100, P=20..60, K=20..50 (Optimal); boundary values 39, 19, 19 (Low); 101, 61, 51 (High) | Correct status string ('Optimal', 'Low', 'High') returned for all boundaries | Matches expected threshold categorizations | **PASS** |
| **TEST-01B** | Unit | Soil health status scoring (`get_health_status`) | Various NPK and pH combinations (4/4, 3/4, 2/4, 1/4 matching parameters) | Score >=3 -> 'Good'; ==2 -> 'Fair'; <=1 -> 'Needs Improvement' | Exact health ratings match thresholds | **PASS** |
| **TEST-01C** | Unit | Farm budget arithmetic calculations | Seed: 3000, Fert: 4500, Labor: 6000, Other: 2000, Yield: 2000 kg, Price: ₹25/kg | Total Cost: ₹15,500; Income: ₹50,000; Net Profit: ₹34,500; Margin: 69.00% | Exact arithmetic and profit margin match formula | **PASS** |
| **TEST-01D** | Unit | Sustainability score & A/B/C grade boundaries | Water hours (30%), fertilizer (25%), rotation (15%), tillage (15%), solar (15%); boundaries 80 and 60 | Score >=80 -> 'A'; 60..79 -> 'B'; <60 -> 'C' | Formula and grade boundaries evaluated accurately | **PASS** |
| **TEST-01E** | Unit | Composite risk overall escalation logic | Severities list with various combinations of Critical, High, Medium, Low | Critical if any critical; High if any high; Medium if any medium; else Low | Overall severity escalated per rule | **PASS** |
| **TEST-02A** | Authentication | Valid user authentication | `POST /api/auth/login` with email `vikram.singh@agriassist.com`, valid password, role `farmer` | HTTP 200, valid JWT token string returned, user profile object returned | HTTP 200 with JWT access token | **PASS** |
| **TEST-02B** | Authentication | Invalid password rejection | `POST /api/auth/login` with incorrect password `WrongPassword999!` | HTTP 401 / 400 rejection with authentication error | HTTP 401 Unauthorized (`Invalid password`) | **PASS** |
| **TEST-02C** | Authentication | Duplicate email registration rejection | `POST /api/auth/signup` with existing email `vikram.singh@agriassist.com` | HTTP 400 rejection with duplicate message | HTTP 400 (`Email already registered`) | **PASS** |
| **TEST-02D** | Authentication | Password hash verification in database | Query `users.password_hash` column for newly registered farmer | Passwords stored strictly as PBKDF2/SHA256 hashes; plaintext never stored | Value begins with `pbkdf2:sha256:`, plaintext not present | **PASS** |
| **TEST-03A** | Authorization | Farmer denied access to administrative routes | Farmer token passed in `Authorization` header to `GET /api/admin/users` and `/statistics` | HTTP 403 Forbidden | HTTP 403 (`Forbidden. Admin access required.`) | **PASS** |
| **TEST-03B** | Authorization | Secondary admin without permission denied | Secondary admin with `DELETE_USERS=False` attempts `DELETE /api/admin/users/<id>` | HTTP 403 Forbidden with permission error | HTTP 403 (`Forbidden. You do not have permission to delete users.`) | **PASS** |
| **TEST-03C** | Authorization | Secondary admin with permission granted | Secondary admin with `DELETE_USERS=True` attempts `DELETE /api/admin/users/<id>` | HTTP 200 OK, target user deleted | HTTP 200 (`User account deleted permanently.`) | **PASS** |
| **TEST-03D** | Authorization | Unauthenticated history requests return 401 | Anonymous `GET /api/history/` and sub-history endpoints | HTTP 401 Unauthorized | HTTP 401 Unauthorized across all history endpoints | **PASS** |
| **TEST-03E** | Authorization | Unauthenticated financial requests return 401 | Anonymous `GET /api/financial/summary`, `POST /calculate`, `GET /history`, `GET /autofill` | HTTP 401 Unauthorized | HTTP 401 Unauthorized across all financial routes | **PASS** |
| **TEST-03F** | Authorization | Unauthenticated marketplace delete returns 401 | Anonymous `DELETE /api/marketplace/items/<id>` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **TEST-03G** | Authorization | Marketplace delete owner or admin enforcement | Non-owner non-admin user attempts deletion vs Item owner vs Administrator | Non-owner: HTTP 403 Forbidden; Owner: HTTP 200 OK; Admin: HTTP 200 OK | HTTP 403 on unauthorized user; HTTP 200 for owner & admin | **PASS** |
| **TEST-04A** | Prediction | Soil parameters pre-fill from latest soil report | Authenticated query `GET /api/soil/reports` after submitting known soil test | Latest soil report parameters (N: 92, P: 44, K: 36, pH: 6.6) returned for UI auto-fill | N=92.0, P=44.0, K=36.0, pH=6.6 retrieved | **PASS** |
| **TEST-04B** | Prediction | Climate normals substitution on blank inputs | `POST /api/predictions/crop` with state='Punjab' and blank temperature, humidity, rainfall | HTTP 200, `used_climate_normals=True`, normal values substituted (Temp ~24.5°C, Hum ~62%, Rain ~140mm) | HTTP 200, `used_climate_normals: True`, Punjab normals substituted | **PASS** |
| **TEST-04C** | Prediction | Persistence of estimated status in database | `POST /api/predictions/yield` with `is_estimated=True` | Record persisted in `crop_yield_records` with `status='Estimated (Qualitative)'` and history entry | `crop_yield_records.status == 'Estimated (Qualitative)'` and `(Qualitative Estimation)` logged in history | **PASS** |
| **TEST-04D** | Prediction | Non-blank climate inputs preserved | `POST /api/predictions/crop` with explicit temperature=33.7, humidity=51.2, rainfall=88.5 | HTTP 200, `used_climate_normals=False`, exact custom values stored in DB table | Exact values preserved in response and DB; `used_climate_normals: False` | **PASS** |
| **TEST-05A** | Risk | Risk alert expiry date filtering | 1. Insert alert with past `expiry_date`<br>2. Insert alert with future `expiry_date` | 1. Expired alert excluded from active alerts<br>2. Active alert included and escalates overall risk to 'Critical' | Expired alert omitted; active critical alert escalates overall risk to 'Critical' | **PASS** |
| **TEST-06A** | Audit Log | Administrative action logging (Create, Update, Delete) | Admin performs user creation (`POST /api/admin/users`), update (`PUT /api/admin/users/<id>`), and delete (`DELETE /api/admin/users/<id>`) | Each of the 3 actions creates an immutable record in `admin_activity_logs` with matching `target_user_id` | All 3 operations successfully logged with respective actions (`Created new FARMER account`, `Updated User Profile`, `Deleted User Account`) | **PASS** |
| **TEST-07A** | Market Forecast | 14-day price forecasting | `POST /api/market/forecast` with `mandi_id=3`, `crop_name='Rice'`, `forecast_days=14` | HTTP 200, predicted price > 0, trend indicator returned | HTTP 200, `predicted_price`: ₹2423.05, `forecast_days`: 14 | **PASS** |
| **TEST-07B** | Market Forecast | 30-day price forecasting | `POST /api/market/forecast` with `mandi_id=3`, `crop_name='Rice'`, `forecast_days=30` | HTTP 200, predicted price > 0, trend indicator returned | HTTP 200, `predicted_price`: ₹2420.21, `forecast_days`: 30 | **PASS** |
| **TEST-07C** | Market Forecast | 7-day price forecasting backend acceptance | `POST /api/market/forecast` with `forecast_days=7` | Verify whether backend accepts the 7-day horizon | Backend accepts `forecast_days=7` and returns HTTP 200 with `predicted_price`: ₹2414.55 | **PASS** |
| **TEST-08A** | Integration | End-to-end user lifecycle & history audit | Full pipeline: Register farmer -> Login -> Post soil analysis -> Run crop prediction -> Query `/api/history/` | HTTP 200 on all stages; `/api/history/` contains 'Crop Recommendation' action | Complete pipeline executed cleanly; history contains 'Crop Recommendation' entry | **PASS** |
| **TEST-09A** | Weather | Live 7-day weather forecast & field advisories | `GET /api/weather/forecast?state=Punjab&district=Ludhiana` | HTTP 200, current weather, 7-day daily forecast, spray & irrigation advisories | HTTP 200, 7 days forecast returned, field advisories generated | **PASS** |
| **TEST-09B** | Weather | Weather endpoint regional baseline fallback | `GET /api/weather/forecast?state=UnknownRegion999` | HTTP 200, graceful fallback handling without crashing | HTTP 200, status success, 7 daily predictions returned | **PASS** |
| **TEST-09C** | Expert Advice | Full consultation lifecycle (Create, List, Reply, Delete) | Farmer posts question (`POST /api/expert/consultations`), lists consultations (`GET`), admin replies (`POST /reply`), farmer deletes (`DELETE`) | Status 201 created with 'Pending', 200 on fetch, 200 on reply with 'Answered', 200 on delete | Complete lifecycle executed cleanly; 'Answered' status and expert advice preserved | **PASS** |

---

## Updates & Resolutions

### TEST-04C: `test_prediction_fallback_is_estimated_flag_stored_in_db`
- **Root Cause of Prior Failure**: The MySQL schema `predictions` table does not have an `is_estimated` column; rather, qualitative estimation is recorded in `crop_yield_records` under column `status` (`'Estimated (Qualitative)'` vs `'Lab-Based'`) and within the user's action audit entries in `history` with tag `'(Qualitative Estimation)'`.
- **Resolution**: Updated TEST-04C to assert against what the backend architecture actually stores: verifying that when `is_estimated=True` is provided, `crop_yield_records.status` is saved as `'Estimated (Qualitative)'` and `history.details` contains `'(Qualitative Estimation)'`. Test now reliably executes and **PASSES**.

### Security & Authorization Additions
- **Endpoints Hardened**: All history routes, soil reports, financial calculations and summaries, sustainability audits, risk statuses, dashboard endpoints, marketplace item creation and deletion, and community post creation have been wrapped with `@jwt_required()`.
- **Owner & Admin Authorization**: `DELETE /api/marketplace/items/<id>` verifies caller identity from JWT; non-owners/non-admins are rejected with `HTTP 403 Forbidden`. Only the item owner or an administrator can successfully delete the listing.
- **Anonymous Access Rejection**: Comprehensive tests confirm unauthenticated callers receive `HTTP 401 Unauthorized` across history, financial, and marketplace deletion endpoints.
