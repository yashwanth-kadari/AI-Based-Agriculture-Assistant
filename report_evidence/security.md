# Security Audit & Vulnerability Assessment: AgriSmart AI

**Audit Date**: October 2026  
**Target System**: AgriSmart AI (Flask Backend, MySQL 8 Database, React/Vite Frontend)  
**Host Environment**: Windows 10 Home Single Language (Build 26300.0), Python 3.14.7, MySQL 8.0.46  
**Auditor**: Automated Verification Suite & Deep Code Inspection  

---

## 1. Executive Summary

This report documents a comprehensive security audit of the **AgriSmart AI** codebase across 5 specific dimensions:
1. **Endpoint Authentication & Authorization** (`@jwt_required` coverage)
2. **SQL Injection Analysis** (Database queries, parameterization, and dynamic SQL)
3. **Cross-Origin Resource Sharing (CORS)** Configuration
4. **Hard-Coded Secrets & Credential Management**
5. **Container Orchestration Security & Configuration Flaws** (`docker-compose.yml`)

### High-Level Risk Matrix

| Vulnerability Area | Severity | Status | Impact Summary |
|---|---|---|---|
| **Wildcard CORS with Credentials** | **HIGH** | Vulnerable | `origins: "*"` with `supports_credentials=True` violates browser CORS specifications and opens APIs to cross-site credential exploitation. |
| **Unprotected Marketplace & Community Endpoints** | **HIGH** | Vulnerable | Any anonymous user can delete listings (`DELETE /api/marketplace/items/<id>`), post community topics, or add replies without authentication. |
| **Unprotected Prediction & Advisory Endpoints** | **MEDIUM** | Informational | Prediction endpoints (`/crop`, `/pest`, `/yield`, `/soil/analyze`) have no auth requirement; history endpoints allow unauthenticated access. |
| **Hard-Coded Default Secrets in Repository** | **HIGH** | Vulnerable | `SECRET_KEY`, `JWT_SECRET_KEY`, and MySQL `DB_PASSWORD` are committed in `.env`, `config.py`, `app.py`, and `docker-compose.yml`. |
| **Docker Compose Healthcheck Password Mismatch** | **HIGH** | Defect / Operational Failure | Healthcheck uses `-pget_db_connection` instead of `-ppassword`, causing MySQL container to fail healthcheck and blocking backend startup. |
| **SQL Injection** | **LOW** / Secure | Parameterized | 215 `cursor.execute` calls audit cleanly. Query parameters strictly use `%s` with tuple binding. Minor dynamic table interpolation in admin deletion uses a hardcoded whitelist. |

---

## 2. Authentication Coverage: Registered Route Analysis

A comprehensive scan of all **83 registered Flask routes** across the 13 route blueprints was performed.

### Authentication Breakdown

```
Total Registered Routes: 83
├── JWT Required (@jwt_required()):           45 routes (54.2%)
├── JWT Optional (@jwt_required(optional=True)): 7 routes ( 8.4%)
└── Unprotected (No Auth Decorator):          31 routes (37.3%)
```

### Full Route-by-Route Authentication Manifest

| Blueprint | Route URL | Method | Endpoint Handler | Auth Status | Security Assessment |
|---|---|---|---|---|---|
| `admin.py` | `/api/admin/statistics` | GET | `get_admin_statistics` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/users` | GET | `get_all_users` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/users/<target_id>` | GET | `get_user_by_id` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/users` | POST | `admin_create_user` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/users/<target_id>` | PUT | `admin_edit_user` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/promote` | POST | `promote_user` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/demote` | POST | `demote_user` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/suspend` | POST | `set_user_status` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/permissions` | GET | `get_master_permissions_list` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/users/<target_id>/permissions` | GET | `get_user_permissions_endpoint` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/toggle-permission` | POST | `update_user_permissions` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/activity` | GET | `get_admin_activity_logs` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/users/<target_id>` | DELETE | `delete_user` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/logs` | GET | `get_logs` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/ml-status` | GET | `get_ml_status` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/ml/reload` | POST | `reload_ml_models` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/settings/info` | GET | `get_system_settings_info` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/settings/verify-models` | POST | `verify_model_weights` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/settings/export-audit-logs` | GET | `export_audit_logs` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/alerts` | GET | `get_admin_alerts` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/alerts` | POST | `create_admin_alert` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/alerts/<int:alert_id>` | PUT | `update_admin_alert` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/alerts/<int:alert_id>` | DELETE | `delete_admin_alert` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/marketplace/items` | GET | `get_admin_marketplace_items` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/marketplace/items/<int:item_id>` | PUT | `update_admin_marketplace_item` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/marketplace/items/<int:item_id>` | DELETE | `delete_admin_marketplace_item` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/community/posts` | GET | `get_admin_community_posts` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/community/posts/<int:post_id>` | DELETE | `delete_admin_community_post` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/community/comments/<int:comment_id>` | DELETE | `delete_admin_community_comment` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/climate-normals` | GET | `get_admin_climate_normals` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/climate-normals` | POST | `save_admin_climate_normals` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/crops` | GET | `get_admin_crops` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/crops` | POST | `create_admin_crop` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/crops/<int:crop_id>` | PUT | `update_admin_crop` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/crops/<int:crop_id>` | DELETE | `delete_admin_crop` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/reports/data` | GET | `get_admin_reports_data` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/reports/export` | GET | `export_admin_report` | **REQUIRED** | Protected |
| `admin.py` | `/api/admin/analytics/data` | GET | `get_admin_analytics_data` | **REQUIRED** | Protected |
| `auth.py` | `/api/auth/signup` | POST | `signup` | **NONE** | Public registration endpoint |
| `auth.py` | `/api/auth/login` | POST | `login` | **NONE** | Public authentication endpoint |
| `auth.py` | `/api/auth/profile` | PUT | `update_profile` | **OPTIONAL** | Fallback allows unauthenticated update if user_id passed |
| `auth.py` | `/api/auth/reset-password` | POST | `reset_password` | **REQUIRED** | Protected |
| `community.py` | `/api/community/posts` | GET | `get_posts` | **NONE** | Public forum view |
| `community.py` | `/api/community/posts` | POST | `create_post` | **NONE** | **Vulnerable**: Anyone can post anonymously or spoof authors |
| `community.py` | `/api/community/posts/<int:post_id>` | GET | `get_post` | **NONE** | Public discussion thread |
| `community.py` | `/api/community/posts/<int:post_id>/replies` | POST | `add_reply` | **NONE** | **Vulnerable**: Anyone can post comments without auth |
| `contact.py` | `/api/contact/submit` | POST | `submit_contact` | **NONE** | Public feedback form |
| `dashboard.py` | `/api/dashboard/` | GET | `get_dashboard_summary` | **NONE** | Public / Optional summary |
| `financial.py` | `/api/financial/autofill` | GET | `get_autofill_data` | **NONE** | Unprotected financial parameters |
| `financial.py` | `/api/financial/calculate` | POST | `calculate_financials` | **NONE** | Unprotected calculation engine |
| `financial.py` | `/api/financial/summary` | GET | `financial_summary` | **NONE** | Unprotected financial summary |
| `financial.py` | `/api/financial/history` | GET | `get_financial_history` | **NONE** | Unprotected financial history |
| `history.py` | `/api/history/` | GET | `get_user_history` | **NONE** | Reads user_id from query param; no auth verification |
| `market.py` | `/api/market/mandis` | GET | `get_mandis` | **NONE** | Public mandi listings |
| `market.py` | `/api/market/mandis` | POST | `create_mandi` | **REQUIRED** | Admin/Manager protected |
| `market.py` | `/api/market/mandis/<int:mandi_id>` | PUT | `update_mandi` | **REQUIRED** | Admin/Manager protected |
| `market.py` | `/api/market/mandis/<int:mandi_id>` | DELETE | `delete_mandi` | **REQUIRED** | Admin/Manager protected |
| `market.py` | `/api/market/prices` | GET | `get_market_prices` | **NONE** | Public market price ticker |
| `market.py` | `/api/market/prices` | POST | `add_market_price` | **REQUIRED** | Admin/Manager protected |
| `market.py` | `/api/market/prices/<int:price_id>` | PUT | `update_market_price` | **REQUIRED** | Admin/Manager protected |
| `market.py` | `/api/market/prices/<int:price_id>` | DELETE | `delete_market_price` | **REQUIRED** | Admin/Manager protected |
| `market.py` | `/api/market/history` | GET | `get_mandi_price_history` | **NONE** | Public historical trends |
| `market.py` | `/api/market/forecast` | POST | `generate_market_forecast` | **OPTIONAL** | Saves history if auth token provided |
| `market.py` | `/api/market/forecast/history` | GET | `get_market_forecast_history` | **OPTIONAL** | Reads identity if present, otherwise returns empty |
| `marketplace.py` | `/api/marketplace/items` | GET | `get_items` | **NONE** | Public marketplace feed |
| `marketplace.py` | `/api/marketplace/items` | POST | `add_item` | **NONE** | **Vulnerable**: Anyone can list items without identity validation |
| `marketplace.py` | `/api/marketplace/items/<int:item_id>` | DELETE | `delete_item` | **NONE** | **CRITICAL VULNERABILITY**: Anyone can delete ANY marketplace item without authentication or ownership check |
| `predictions.py` | `/api/predictions/crop` | POST | `recommend_crop` | **NONE** | Public ML recommendation engine |
| `predictions.py` | `/api/predictions/pest` | POST | `handle_predict_pest` | **NONE** | Public ML risk diagnostic engine |
| `predictions.py` | `/api/predictions/yield` | POST | `handle_predict_yield` | **NONE** | Public ML yield prediction engine |
| `predictions.py` | `/api/predictions/crop/history` | GET | `get_crop_history` | **NONE** | Reads user_id from query param; no auth token checked |
| `predictions.py` | `/api/predictions/pest/history` | GET | `get_pest_history` | **NONE** | Reads user_id from query param; no auth token checked |
| `predictions.py` | `/api/predictions/yield/history` | GET | `get_yield_history` | **NONE** | Reads user_id from query param; no auth token checked |
| `reports.py` | `/api/reports/analytics` | GET | `get_farmer_analytics` | **OPTIONAL** | Uses `get_jwt_identity()`, falls back to query param |
| `reports.py` | `/api/reports/financials` | POST | `add_financial_record` | **OPTIONAL** | Uses `get_jwt_identity()`, falls back to payload |
| `reports.py` | `/api/reports/yields` | POST | `add_yield_record` | **OPTIONAL** | Uses `get_jwt_identity()`, falls back to payload |
| `reports.py` | `/api/reports/download` | GET | `download_report` | **OPTIONAL** | Generates CSV export with optional JWT |
| `risk.py` | `/api/risk/status` | GET | `get_risk_status` | **NONE** | Public risk status calculator |
| `soil.py` | `/api/soil/analyze` | POST | `analyze_soil` | **NONE** | Public soil NPK analysis |
| `soil.py` | `/api/soil/reports` | GET | `get_soil_reports` | **NONE** | Reads user_id from query param; no auth |
| `sustainability.py` | `/api/sustainability/practices` | GET | `get_practices` | **NONE** | Public best practices catalog |
| `sustainability.py` | `/api/sustainability/audit` | POST | `calculate_audit` | **NONE** | Public sustainability scoring engine |
| `sustainability.py` | `/api/sustainability/history` | GET | `get_sustainability_history` | **NONE** | Unprotected historical audit logs |

### Key Findings & Recommendations on Authentication
1. **Critical Marketplace IDOR/Unprotected Deletion**:
   In `backend/routes/marketplace.py` (lines 80–100):
   ```python
   @marketplace_bp.route('/items/<int:item_id>', methods=['DELETE'])
   def delete_item(item_id):
       ...
       cursor.execute("DELETE FROM marketplace WHERE id = %s", (item_id,))
   ```
   There is **no `@jwt_required()`** decorator, nor is there any check whether the caller owns the listing. Any unauthenticated client can issue `DELETE /api/marketplace/items/1` and purge records from the database.
2. **Community Spam Exposure**:
   Discussion creation and commenting endpoints have no authentication or rate limiting, leaving the forum susceptible to spam attacks.
3. **Insecure Direct Object Reference (IDOR) via `user_id` query parameters**:
   Endpoints like `/api/history/`, `/api/predictions/crop/history`, and `/api/soil/reports` read `user_id = request.args.get('user_id')`. Because authentication is omitted, an unauthenticated user can enumerate and view any other farmer's personal agricultural records by cycling integer IDs.

---

## 3. SQL Injection Analysis

A deep static code analysis was conducted across all Python files in the `backend/` directory.

### Query Audit Statistics
- **Total `cursor.execute(...)` calls inspected**: **215**
- **Queries using parameter placeholders (`%s`) with parameter tuples/lists**: **213**
- **Queries utilizing string interpolation / f-strings**: **2** (Detailed below)

### Detailed Analysis of Non-Standard / Dynamic Queries

#### 1. Dynamic Table Cascade Deletion (`backend/routes/admin.py`, Line 985)
```python
# routes/admin.py:983-987
for tbl in ['predictions', 'history', 'soil_reports', 'alerts', 'user_permissions']:
    try:
        cursor.execute(f"DELETE FROM {tbl} WHERE user_id = %s", (target['id'],))
    except Exception:
        pass
```
- **Vulnerability Status**: **SAFE (Hardcoded Whitelist)**
- **Technical Analysis**: Although Python f-string syntax `f"DELETE FROM {tbl} ..."` is used to specify the table identifier, the variable `tbl` iterates over an immutable internal list of 5 hard-coded table string literals. The dynamic user data (`target['id']`) is strictly bound using parameterized binding `(target['id'],)`.
- **Recommendation**: To eliminate static analysis warnings, use explicit individual static queries or validate against an explicit schema mapping.

#### 2. Dynamic Update Column Builder (`backend/routes/auth.py`, Lines 274–277)
```python
# routes/auth.py:260-277
updates = []
params = []
if name:
    updates.append("name = %s")
    params.append(name)
if state:
    updates.append("state = %s")
    params.append(state)
if district:
    updates.append("district = %s")
    params.append(district)

cursor.execute(
    f"UPDATE users SET {', '.join(updates)} WHERE id = %s",
    tuple(params)
)
```
- **Vulnerability Status**: **SAFE (Controlled Placeholders)**
- **Technical Analysis**: The f-string joins static string clauses (`"name = %s"`). None of the user input is concatenated into the SQL statement itself; all user inputs are appended to the `params` array and passed into MySQL Connector as a bound tuple `tuple(params)`.
- **Recommendation**: The pattern is safe against SQL injection.

#### 3. Static LIKE Wildcard Pattern (`backend/routes/admin.py`, Line 2295)
```python
cursor.execute("SELECT COUNT(*) as count FROM history WHERE action LIKE '%Pest%'")
```
- **Vulnerability Status**: **SAFE**
- **Technical Analysis**: Static query without user input.

### SQL Injection Verdict
The backend **consistently and correctly uses parameterized queries (`%s` placeholders with bound tuples)** for all user inputs. **No exploitable SQL injection vulnerabilities were discovered.**

---

## 4. Cross-Origin Resource Sharing (CORS) Configuration

### Inspected Code (`backend/app.py`, Line 26)
```python
# backend/app.py:25-26
# ── CORS ─────────────────────────────────────────────────────────────────────
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
```

### Vulnerability Analysis
1. **W3C CORS Specification Incompatibility**:
   According to the official W3C Cross-Origin Resource Sharing and WHATWG Fetch standards, **wildcard origins (`"*"`) are explicitly forbidden when `supports_credentials=True` is enabled**.
   - Browsers reject responses containing:
     ```http
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Credentials: true
     ```
   - When requests include cookies or Authorization headers, modern browsers (Chrome, Firefox, Safari, Edge) block the frontend from reading the response.
2. **Security Risk**:
   If the CORS middleware is configured to reflect the calling origin (`Access-Control-Allow-Origin: <Request-Origin>`) to satisfy credentials, any malicious third-party site visited by an authenticated user could make cross-origin requests to `http://localhost:5000/api/*` and read sensitive user data (CSRF / Cross-Origin data leakage).

### Recommended Remediation
Explicitly whitelist trusted origins instead of using the wildcard `*`:
```python
# Recommended Secure Configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)
```

---

## 5. Hard-Coded Secrets & Credential Management

An audit for sensitive secrets, private tokens, and cryptographic keys across repository configuration files yielded multiple committed secrets.

### Discovered Secrets Manifest

| File Location | Line Number | Variable Name | Exposed Secret Value | Classification / Impact |
|---|---|---|---|---|
| `docker-compose.yml` | 9 | `MYSQL_ROOT_PASSWORD` | `password` | **CRITICAL**: Default root password for database container |
| `docker-compose.yml` | 33 | `DB_PASSWORD` | `password` | **CRITICAL**: Backend database connection password |
| `docker-compose.yml` | 35 | `SECRET_KEY` | `production-secret-key` | **HIGH**: Session encryption secret in orchestrator |
| `docker-compose.yml` | 36 | `JWT_SECRET_KEY` | `production-jwt-secret-key` | **CRITICAL**: JWT signing key; allows arbitrary token forgery |
| `backend/.env` | 6 | `DB_PASSWORD` | `password` | **HIGH**: Local database password checked into repository |
| `backend/.env` | 7 | `SECRET_KEY` | `agrismart-secret-key-2026` | **HIGH**: Local Flask session key |
| `backend/.env` | 8 | `JWT_SECRET_KEY` | `agrismart-jwt-key-2026` | **CRITICAL**: Local JWT signing key |
| `backend/app.py` | 29 | `SECRET_KEY` (fallback) | `agrismart-secret-key-2026` | **HIGH**: Default fallback if env var is missing |
| `backend/app.py` | 30 | `JWT_SECRET_KEY` (fallback) | `agrismart-jwt-key-2026` | **CRITICAL**: Default fallback if env var is missing |
| `backend/config.py` | 17 | `DB_PASSWORD` (fallback) | `password` | **HIGH**: Default fallback if env var is missing |

### Security Impact
1. **Arbitrary Administrative Privilege Escalation**:
   Because `JWT_SECRET_KEY` is known (`agrismart-jwt-key-2026` in local dev, `production-jwt-secret-key` in docker-compose), an external attacker can craft and sign an arbitrary JWT token with `"sub": "4"`, `"role": "admin"`, gaining instant Primary Administrator privileges.
2. **Version Control Leakage**:
   The `backend/.env` file is tracked in the repository rather than being listed in `.gitignore`.

---

## 6. Docker Compose Healthcheck Configuration Mismatch

### Configuration Inspected (`docker-compose.yml`)

```yaml
# docker-compose.yml:8-20 & 37-39
services:
  db:
    image: mysql:8.0
    container_name: agri_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: agriculture_db
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-pget_db_connection"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    ...
    depends_on:
      db:
        condition: service_healthy
```

### Detailed Bug & Failure Analysis

1. **Password Mismatch**:
   - The MySQL root password configured for the container is:
     `MYSQL_ROOT_PASSWORD: password`
   - The healthcheck command defined to verify database readiness is:
     `["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-pget_db_connection"]`
   - Notice that the healthcheck passes `-pget_db_connection` (likely a copy-paste error from the Python utility function name `get_db_connection`).
2. **Operational Failure Chain**:
   - When the MySQL container boots, Docker executes the healthcheck every 10 seconds.
   - MySQL evaluates the login attempt: `mysqladmin ping -h localhost -u root -pget_db_connection`.
   - The authentication fails immediately:
     `mysqladmin: connect to server at 'localhost' failed`  
     `error: 'Access denied for user 'root'@'localhost' (using password: YES)'`
   - The healthcheck exits with status code `1` (Unhealthy).
   - After 5 retries (50 seconds), the `db` container transitions permanently to `unhealthy`.
   - Because the `backend` service specifies:
     ```yaml
     depends_on:
       db:
         condition: service_healthy
     ```
     Docker Compose **blocks the backend service indefinitely from starting**. The deployment remains completely stalled.

### Fix
Correct the healthcheck command in `docker-compose.yml` line 17:
```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-ppassword"]
  interval: 10s
  timeout: 5s
  retries: 5
```
Or use the environment variable reference:
```yaml
healthcheck:
  test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -p$$MYSQL_ROOT_PASSWORD"]
```

---

## 7. Security Action Plan & Summary of Findings

| ID | Issue Description | Severity | Remediation Action |
|---|---|---|---|
| **SEC-01** | `DELETE /api/marketplace/items/<id>` has no auth | **CRITICAL** | Add `@jwt_required()` and verify caller is owner or admin |
| **SEC-02** | Hard-coded `JWT_SECRET_KEY` & `SECRET_KEY` in code | **CRITICAL** | Require runtime environment variables; fail fast if missing |
| **SEC-03** | `docker-compose.yml` healthcheck password typo | **HIGH** | Change `-pget_db_connection` to `-ppassword` |
| **SEC-04** | Invalid CORS wildcard origin with credentials | **HIGH** | Replace `origins: "*"` with explicit client origin array |
| **SEC-05** | Public access to prediction histories via query params | **MEDIUM** | Enforce `@jwt_required()` and extract `user_id` from token claims |
| **SEC-06** | Community endpoints unprotected | **MEDIUM** | Enforce `@jwt_required()` for creating posts and comments |
