# 🌾 AgriSmart AI — Intelligent Agriculture Decision Support Platform

A full-stack, enterprise-grade AI decision support platform for precision agriculture, built with **React 19**, **Python Flask**, **Scikit-learn** (Gaussian Naïve Bayes & Random Forest Regression), and **MySQL 8**.

---

## 🏗 Architecture

```
React 19 (Vite) ──[Axios / REST]──> Flask 3 API ──[Scikit-learn ML Engines]──> MySQL 8 Database
                                         │
                                         └──> RBAC & Audit Engine (User Permissions & Activity Logs)
```

> **Note**: AgriSmart AI operates strictly on a standalone **MySQL 8** database via `mysql-connector-python` and SQLAlchemy. SQLite fallback support has been permanently removed to enforce transactional relational integrity.

---

## ✨ System Features & Modules

### 🚜 Core AI Decision Engines
- **🌱 Crop Recommendation**: Recommends optimal crops based on soil NPK ratios, temperature, humidity, pH, and rainfall using a trained Gaussian Naïve Bayes classifier.
- **🐛 Pest Risk Detector**: Predicts pest infestation risks (NoPest, Aphids, Locust, Bollworm, Fungal) with action steps and treatment advisories.
- **🌾 Yield Forecasting**: Features a dual-mode qualitative (Estimated) and quantitative (Lab-tested) input engine predicting crop yield levels (High, Medium, Low) and per-acre harvests.
- **📈 Market Price Predictive AI**: Time-series price regression model (`RandomForestRegressor` with 3-day momentum lag features) forecasting target mandi prices, 7-day volatility trends, and price variance.
- **🧪 Soil Health Analysis**: Automated NPK ratio evaluation, pH balance diagnostic, split-dosage fertilizer top-dressing guidance, and irrigation schedules.
- **💰 Financial Planning & Budgeting**: Direct mandi price sync, production expense tracking (seeds, fertilizers, pesticides, labor, irrigation), revenue projections, and net profit analysis.
- **⚠️ Risk Monitoring**: Live 6-card composite risk engine calculating composite risk indices across pest, disease, climate, soil, and market price volatility.
- **🌱 Sustainability Scorecard**: Regenerative agriculture audit assessing irrigation hours, fertilizer choices, crop rotation, tillage practices, and renewable energy adoption.
- **📊 Analytics & Reports**: Cross-feature performance summaries, interactive yield and expense charts, rule-based AI recommendations, and formatted CSV report downloads.

### 👥 Community & Commerce
- **🛒 Farmer Marketplace**: Peer-to-peer buying and selling listings for crops, seeds, fertilizers, and agricultural equipment.
- **💬 Community Forum**: Threaded discussion board with Q&A capabilities, post moderation, and author tags.

### 🛡️ Administrative Control Panel (RBAC Enabled)
- **Granular Permission Matrix**: Primary Admin controls per-admin capabilities (`VIEW_USERS`, `MANAGE_CROPS`, `MANAGE_ALERTS`, `CAN_CREATE_ACCOUNTS`, etc.).
- **User Management & Creation Suite**: Comprehensive search, role filtering (Farmers, Secondary Admins, Primary Admins), status toggling, and new account provisioning.
- **Market Prices & Mandis Admin**: Real-time mandi management and daily commodity rate maintenance.
- **Risk Alerts & Advisories**: Regional broadcast system for emergency weather alerts, pest outbreak warnings, and crop disease advisories.
- **Moderation Suite**: Content moderation for marketplace listings and community forum threads.
- **Climate Normals & Crop Master Directory**: Administrative management of regional climate baselines and crop characteristics.
- **ML Diagnostics & Audit Logs**: Real-time model evaluation telemetry (sourced from `ml/evaluation/results.json`) and system activity audit trail logging.

---

## 🤖 ML Models & Evaluation Accuracy

All machine learning models are located in `backend/ml/` and evaluate model performance using cross-validation. Real performance figures are recorded in `backend/ml/evaluation/results.json`:

| Model | Architecture | Target / Task | Accuracy / Metric |
|-------|--------------|---------------|-------------------|
| **Crop Recommendation** | `GaussianNB` | Recommended Crop | **92.20%** (5-Fold CV Mean) |
| **Pest Risk Detector** | `GaussianNB` | Pest Infestation Type | **92.99%** (5-Fold CV Mean) |
| **Yield Classification** | `GaussianNB` | Yield Level (High/Med/Low) | **90.21%** (5-Fold CV Mean) |
| **Market Price Forecast** | `RandomForestRegressor` | 7-Day Mandi Price (₹/Quintal) | **MAE ₹57.62 / R² 0.997** |

### Retraining & Evaluating Models
To retrain and evaluate all machine learning models:
```bash
cd backend
python ml/train_model.py
python ml/train_pest.py
python ml/train_yield.py
python ml/train_market_forecast.py
python ml/evaluation/evaluate_all.py
```

---

## 🗄 Database Schema

The system uses 17 relational tables defined in `backend/database/schema.sql`:

1. `users`: User profile accounts, authentication hashes, contact info, and roles (`farmer`, `secondary_admin`, `primary_admin`).
2. `predictions`: Recorded crop recommendation inputs and AI predictions.
3. `crop_recommendations`: Reference crop catalog with NPK baselines and market values.
4. `soil_reports`: Soil test history, NPK levels, pH, and fertilizer recommendations.
5. `alerts`: Broadcast weather, pest, and disease alert notices.
6. `history`: Unified user activity history across all prediction tools.
7. `marketplace_items`: Buyer/seller product listings for agricultural goods.
8. `community_posts`: Discussion threads created by platform users.
9. `community_replies`: Threaded responses to forum posts.
10. `user_permissions`: Granular RBAC permission keys assigned to admin accounts.
11. `admin_activity_logs`: Immutable audit logging for administrative actions.
12. `mandis`: Master directory of agricultural produce market yards.
13. `market_prices`: Commodity price records linked to specific mandis.
14. `financial_records`: Expense breakdowns, revenues, and net profits per crop cycle.
15. `crop_yield_records`: Harvest logs tracking actual vs expected yield quantities.
16. `market_forecasts`: Saved ML market price projections and trend metrics.
17. `sustainability_assessments`: Eco-audit entries, sustainability scores, and grades.

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/signup` — User registration
- `POST /api/auth/login` — Account login & JWT issuance
- `GET /api/auth/profile` — Fetch current user details
- `PUT /api/auth/profile` — Update user profile details
- `POST /api/auth/change-password` — Password change endpoint

### 🚜 Predictions & Intelligence (`/api/predictions`)
- `POST /api/predictions/crop` — AI crop recommendation engine
- `POST /api/predictions/pest` — Pest risk prediction engine
- `POST /api/predictions/yield` — Yield level classification engine
- `POST /api/predictions/market-forecast` — Mandi price forecasting engine

### 🧪 Soil, Finance & Sustainability
- `POST /api/soil/analyze` — Run soil health analysis
- `GET /api/soil/reports` — Fetch user soil test history
- `POST /api/financial/calculate` — Calculate financial estimates & ROI
- `GET /api/financial/autofill` — Auto-sync mandi prices & yield expectations
- `GET /api/financial/records` — Fetch financial log records
- `POST /api/sustainability/assess` — Run farm sustainability audit
- `GET /api/sustainability/reports` — Fetch past sustainability assessments

### 📊 Analytics, Reports & History
- `GET /api/reports/analytics` — Cross-feature farmer analytics & AI insights
- `GET /api/reports/download` — Download formatted CSV reports (`type=yield|financial|soil|sustainability`)
- `GET /api/history/` — Fetch combined user activity history
- `GET /api/history/type/<feature>` — Filter activity history by feature type
- `GET /api/risk/status` — Composite 6-card risk status engine

### 🛒 Marketplace, Forum & Mandis
- `GET/POST /api/marketplace/items` — Marketplace listings management
- `GET/POST /api/community/posts` — Forum discussion threads
- `GET/POST /api/community/posts/<id>/replies` — Threaded forum replies
- `GET /api/market/prices` — Real-time mandi rates
- `GET /api/market/mandis` — Mandi market yard listings

### 🛡 Administrative Control (`/api/admin`)
- `GET /api/admin/users` — Search and manage platform accounts
- `GET/POST /api/admin/permissions` — Manage secondary admin permission matrix
- `POST /api/admin/create-account` — Provision admin/farmer accounts
- `GET /api/admin/analytics/data` — System-wide analytics & telemetry
- `GET /api/admin/ml-diagnostics` — View ML evaluation metrics
- `GET /api/admin/activity` — Administrative activity audit logs
- `POST /api/admin/system-settings/verify-ml-integrity` — Verify ML model files integrity

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js** ≥ 18.0
- **Python** ≥ 3.10
- **MySQL** ≥ 8.0

### 1. Database Setup
Ensure MySQL service is running and create the database:
```sql
CREATE DATABASE agriculture_db;
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env to set your local MySQL connection parameters (DB_USER, DB_PASSWORD, DB_HOST, DB_NAME)

# Seed Primary Admin account (Interactive prompt)
python seed_admin.py

# Start Flask backend server
python app.py
```
> Backend runs on: **`http://localhost:5000`**

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> Frontend runs on: **`http://localhost:5173`**

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 3, Recharts, Lucide React, Axios
- **Backend**: Python 3.10+, Flask 3, Flask-JWT-Extended, Flask-CORS, SQLAlchemy, mysql-connector-python
- **Machine Learning**: Scikit-learn, Pandas, NumPy, Joblib
- **Database**: MySQL 8.0
