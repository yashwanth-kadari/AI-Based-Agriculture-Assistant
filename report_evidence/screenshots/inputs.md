# Test Accounts & Sample Prediction Inputs

## 1. Test Accounts Used

### Farmer Account (Created & Verified)
- **Full Name**: Vikram Singh
- **User ID / Username**: `vikram_singh`
- **Email Address**: `vikram.singh@agriassist.com`
- **Password**: `Password@123`
- **State**: Punjab
- **District**: Ludhiana
- **Role**: `farmer`
- **Database User ID**: 29

### Primary Administrator Account (Pre-seeded System Administrator)
- **Full Name**: Primary Administrator
- **User ID / Username**: `superadmin`
- **Email Address**: `admin@agrismart.in`
- **Password**: `Admin@123`
- **Role**: `primary_admin` (is_super_admin: 1)
- **Database User ID**: 4

---

## 2. Screenshot Manifest & Inputs Summary

| Screenshot File | Page / View | User Session | Inputs & Parameters Used | Output / Result Displayed |
| :--- | :--- | :--- | :--- | :--- |
| `01_home.png` | Public Home Landing Page (`/home`) | Unauthenticated | N/A | Full landing page showing platform features, hero banner, metrics, and call-to-action buttons. |
| `02_signup.png` | User Registration (`/signup`) | Unauthenticated | Clean form view | Registration form with fields for Full Name, User ID, Email, Role dropdown, State, District, and Password. |
| `03_login.png` | User Authentication (`/login`) | Unauthenticated | Clean form view | Authentication interface with role selector (`farmer` / `admin`), email/user ID input, password input, and remember me checkbox. |
| `04_farmer_dashboard.png` | Farmer Dashboard (`/dashboard`) | Vikram Singh (`farmer`) | User ID: 29 | Personalized farmer dashboard displaying welcome banner ("Welcome back, Vikram!"), farm status metrics, soil health summary, and quick action cards. |
| `05_crop_recommendation_result.png` | AI Crop Recommendation (`/crop-recommendation`) | Vikram Singh (`farmer`) | **Nitrogen (N)**: 90 mg/kg<br>**Phosphorus (P)**: 42 mg/kg<br>**Potassium (K)**: 43 mg/kg<br>**Soil pH**: 6.5<br>**Temperature**: 24.5 °C<br>**Humidity**: 62.0%<br>**Rainfall**: 140.0 mm | Recommended Crop: **Rice** (Confidence: 89.4%, High Confidence). Fertilizer and agronomic management tips rendered. |
| `06_pest_prediction_result.png` | Pest Risk Detection (`/pest-prediction`) | Vikram Singh (`farmer`) | **Crop**: Cotton<br>**Soil Fertility**: Average<br>**Fertilizer Use**: Light<br>**Soil Type**: Loamy<br>**Observed Symptoms**: Whiteflies / Aphids Visible | Predicted Pest: **Aphids / Whiteflies Infestation Risk** with detailed preventive measures, biological controls, and chemical pesticide schedule. |
| `07_yield_prediction_result.png` | Crop Yield Forecasting (`/yield-prediction`) | Vikram Singh (`farmer`) | **Crop**: Rice<br>**Farm Area**: 2.0 Acres<br>**Soil Fertility**: Fertile<br>**Irrigation**: Canal / Flood<br>**Fertilizer Strategy**: Standard Balanced NPK | Yield Forecast Category: **High Yield Potential** (~45.2 Quintals total / 22.6 Q/acre) with harvest planning advisories. |
| `08_market_price_forecast.png` | Market Price Forecast (`/market-price`) | Vikram Singh (`farmer`) | **Commodity**: Rice<br>**Mandi**: Ludhiana Mandi (Punjab)<br>**Forecast Period**: 7 Days Ahead | Projected Price: **₹2,240 / Quintal** with confidence intervals, price trend indicator, and Recharts historical-to-forecast price curve. |
| `09_soil_health_result.png` | Soil Health Diagnostic (`/soil-health`) | Vikram Singh (`farmer`) | **Nitrogen (N)**: 85 mg/kg<br>**Phosphorus (P)**: 42 mg/kg<br>**Potassium (K)**: 38 mg/kg<br>**Soil pH**: 6.8 | Overall Soil Health: **Balanced / Optimal** with NPK status meters, pH evaluation, and split-application top-dressing fertilizer plan. |
| `10_financial_planning_result.png` | Farm Budget & Financials (`/financial-planning`) | Vikram Singh (`farmer`) | **Crop**: Rice (Area: 1 Acre)<br>**Seed Cost**: ₹3,200<br>**Fertilizer Cost**: ₹4,800<br>**Labor Cost**: ₹6,500<br>**Other Expenses**: ₹2,000<br>**Selling Price**: ₹26 / kg<br>**Expected Harvest**: 2,200 kg | **Total Production Cost**: ₹16,500<br>**Gross Revenue**: ₹57,200<br>**Estimated Net Profit**: ₹40,700<br>**Profit Margin**: 71.15% |
| `11_risk_monitoring.png` | Farm Risk Monitoring (`/risk-monitoring`) | Vikram Singh (`farmer`) | Live multi-factor risk assessment | Composite 6-card risk engine displaying pest threat level, disease vulnerability, weather volatility, soil degradation risk, and overall farm safety index. |
| `12_sustainability_result.png` | Sustainability Scorecard (`/sustainability`) | Vikram Singh (`farmer`) | **Watering Hours**: 3 hrs/day<br>**Fertilizer Strategy**: Mixed (Organic + Mineral)<br>**Crop Rotation**: Regular Rotation<br>**Tillage**: Reduced Tillage<br>**Solar Energy**: Enabled (Yes)<br>**Primary Crop**: Rice | **Sustainability Score**: 84 / 100<br>**Eco-Grade**: **Grade A** (Excellent regenerative agricultural practice index). |
| `13_analytics.png` | Farm Analytics & Reporting (`/analytics`) | Vikram Singh (`farmer`) | Historical trend telemetry | Cross-module performance charts, interactive yield graphs, input expense distributions, and downloadable CSV report exports. |
| `14_marketplace.png` | Farmer Marketplace (`/marketplace`) | Vikram Singh (`farmer`) | Live marketplace directory | Product listings for seeds, equipment, and crops with seller contacts, prices, category filters, and product status badges. |
| `15_community.png` | Community Forum (`/community`) | Vikram Singh (`farmer`) | Discussion forum | Discussion threads, agronomic questions, community responses, and farmer advisory exchanges. |
| `16_profile.png` | Farmer Profile Management (`/profile`) | Vikram Singh (`farmer`) | Profile view | Vikram Singh profile details (email, state, district, account verification status, and password update card). |
| `17_admin_dashboard.png` | Admin System Overview (`/admin?tab=overview`) | Primary Admin (`superadmin`) | System telemetry | System KPIs (total users, registered farmers, predictions logged, active alerts), system health status, and quick admin action links. |
| `18_admin_user_management.png` | Admin User Suite (`/admin?tab=users`) | Primary Admin (`superadmin`) | User database table | Complete user directory showing farmer and secondary admin accounts, role filter, status toggle switches, and account creation trigger. |
| `19_admin_activity_logs.png` | Admin Audit Logs (`/admin?tab=activity`) | Primary Admin (`superadmin`) | Activity logs table | Immutable administrative action audit trail with timestamp, admin email, action category, target entity, and detailed description. |
| `20_admin_ml_diagnostics.png` | ML Model Diagnostics (`/admin?tab=ml`) | Primary Admin (`superadmin`) | ML evaluation telemetry | Cross-validation accuracy scores, 10-seed stability metrics, model architecture types, and feature importance tables sourced from `results.json`. |
| `21_crop_prediction_estimated_flag.png` | Crop Recommendation with Climate Normal Fallback (`/crop-recommendation`) | Vikram Singh (`farmer`) | **Nitrogen (N)**: 85 mg/kg<br>**Phosphorus (P)**: 40 mg/kg<br>**Potassium (K)**: 35 mg/kg<br>**Soil pH**: 6.5<br>**Temperature**: *[Blank]*<br>**Humidity**: *[Blank]*<br>**Rainfall**: *[Blank]* | Amber badge visible: **"Auto-substituted regional climate normals for Punjab"** (`used_climate_normals: true`, `is_estimated: 1`). Recommended Crop: **Rice**. |
