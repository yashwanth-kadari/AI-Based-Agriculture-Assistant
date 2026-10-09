# Code Facts Verification

## Summary of Findings

| Question | Code Reality / Fact | Primary File Reference | Key Lines |
| :--- | :--- | :--- | :--- |
| **(a) Market forecast model features** | **9 features**: `mandi_id`, `crop_code`, `current_price`, `lag_1`, `lag_7`, `rolling_7`, `day_of_week`, `month`, `forecast_days` | [`backend/ml/train_market_forecast.py`](file:///d:/coder/agriculture/backend/ml/train_market_forecast.py) | Lines 114–117 |
| **(b) 7-day horizon removed from UI?** | **No**. The 7-day option is still present in the dropdown, set as initial default state, and rendered conditionally. | [`frontend/src/pages/MarketPrice.jsx`](file:///d:/coder/agriculture/frontend/src/pages/MarketPrice.jsx) | Lines 75, 749–752, 790–795 |
| **(c) Lines of Python and JavaScript/JSX** | **Python**: 8,309 lines (33 files)<br>**JavaScript / JSX**: 16,498 lines (61 files: 383 JS, 16,115 JSX)<br>**Combined Total**: 24,807 lines | Workspace root scan (excluding `node_modules`, `dist`, `__pycache__`, `.pytest_cache`, `report_evidence`) | Complete workspace |
| **(d) Number of API routes** | **96** total registered Flask URL rules<br>(**80** unique path patterns, **84** unique view endpoints) | [`backend/app.py`](file:///d:/coder/agriculture/backend/app.py) & registered blueprints | Blueprint registers |
| **(e) Number of database tables** | **17 tables** in DDL schema definition<br>**18 tables** in active live MySQL database | [`backend/database/schema.sql`](file:///d:/coder/agriculture/backend/database/schema.sql) vs MySQL `SHOW TABLES` | Lines 5–233 in schema.sql |

---

## Detailed Code Evidence & Citations

### (a) Features Used by the Market-Forecast Model
The time-series regression model (`RandomForestRegressor`, 120 estimators, max depth 12) utilizes **9 engineered features**.
- **Definition Source**: [`backend/ml/train_market_forecast.py`](file:///d:/coder/agriculture/backend/ml/train_market_forecast.py#L114-L117):
  ```python
  feature_cols = [
      'mandi_id',      # Categorical ID of the agricultural produce market yard
      'crop_code',     # Mapped numerical integer code for the crop (Rice:0, Wheat:1, Maize:2, Cotton:3, Tomato:4, Potato:5)
      'current_price', # Most recent active/modal price (₹/Quintal)
      'lag_1',         # 1-day momentum lag price
      'lag_7',         # 7-day historical lag price
      'rolling_7',     # 7-day rolling moving average price
      'day_of_week',   # Calendar day of the week integer (0 = Monday .. 6 = Sunday)
      'month',         # Calendar month integer (1 .. 12)
      'forecast_days'  # Forward projection horizon in days (7, 14, 30)
  ]
  ```
- **Cross-Validation Citation**: Confirmed in [`backend/ml/evaluation/evaluate_all.py`](file:///d:/coder/agriculture/backend/ml/evaluation/evaluate_all.py#L117).
- **Inference Citation**: Confirmed in [`backend/routes/market.py`](file:///d:/coder/agriculture/backend/routes/market.py#L737-L742):
  ```python
  input_features = pd.DataFrame(
      [[mandi_id, crop_code, current_price, lag_1, lag_7, rolling_7, day_of_week, month, forecast_days]],
      columns=['mandi_id', 'crop_code', 'current_price', 'lag_1', 'lag_7', 'rolling_7', 'day_of_week', 'month', 'forecast_days']
  )
  ```

---

### (b) Frontend MarketPrice 7-Day Horizon Status
The project booklet notes suggested that the 7-day horizon option was withheld or removed from the user interface. However, inspection of the actual source code demonstrates that **it is NOT removed**:
1. **Default State**: In [`frontend/src/pages/MarketPrice.jsx`](file:///d:/coder/agriculture/frontend/src/pages/MarketPrice.jsx#L75), the state initializes to 7:
   ```javascript
   const [forecastDays, setForecastDays] = useState(7);
   ```
2. **Form Dropdown**: In [`frontend/src/pages/MarketPrice.jsx`](file:///d:/coder/agriculture/frontend/src/pages/MarketPrice.jsx#L744-L753), the `<select>` element explicitly offers the 7-day option:
   ```jsx
   <select
     value={forecastDays}
     onChange={(e) => setForecastDays(e.target.value)}
     className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
   >
     <option value={7}>7 Days Ahead</option>
     <option value={14}>14 Days Ahead</option>
     <option value={30}>30 Days Ahead</option>
   </select>
   ```
3. **Specialized UI Callout**: In [`frontend/src/pages/MarketPrice.jsx`](file:///d:/coder/agriculture/frontend/src/pages/MarketPrice.jsx#L790-L795), special logic specifically displays a 7-day volatility badge:
   ```jsx
   {Number(forecastResult.forecast_days) === 7 && (
     <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5 font-medium">
       <Sparkles className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
       <span>Short-term 7-day price volatility index: Highly stable trend.</span>
     </div>
   )}
   ```

---

### (c) Line Counts of Code
Excluding external dependencies (`node_modules`), build output (`dist`), cache (`__pycache__`, `.pytest_cache`), version control (`.git`), and evidence artifacts (`report_evidence`):
- **Python (`.py`)**: **8,309 lines** across **33 files**
- **JavaScript (`.js`)**: **383 lines** across **7 files**
- **React JSX (`.jsx`)**: **16,115 lines** across **54 files**
- **Total Frontend (JS + JSX)**: **16,498 lines** across **61 files**
- **Total Project Source Lines**: **24,807 lines of code** across **94 source files**

---

### (d) Number of API Routes
Inspecting Flask's runtime `app.url_map` reveals:
- **Total Registered Non-Static URL Rules**: **96 rules**
- **Unique URL Path Patterns**: **80 paths**
- **Unique Controller View Endpoints**: **84 view functions**
- **Blueprint Distribution**:
  - `admin_bp` (`/api/admin`): 38 endpoints
  - `market_bp` (`/api/market`): 12 endpoints
  - `predictions_bp` (`/api/predictions`): 6 endpoints
  - `auth_bp` (`/api/auth`): 4 endpoints
  - `community_bp` (`/api/community`): 4 endpoints
  - `dashboard_bp` (`/api/dashboard`): 4 endpoints
  - `reports_bp` (`/api/reports`): 4 endpoints
  - `financial_bp` (`/api/financial`): 4 endpoints
  - `sustainability_bp` (`/api/sustainability`): 3 endpoints
  - `soil_bp` (`/api/soil`): 2 endpoints
  - `marketplace_bp` (`/api/marketplace`): 3 endpoints
  - `history_bp` (`/api/history`): 1 endpoint
  - `risk_bp` (`/api/risk`): 1 endpoint
  - `contact_bp` (`/api/contact`): 1 endpoint
  - Root index (`/`): 1 endpoint

---

### (e) Number of Database Tables
- **DDL Schema Specification**: [`backend/database/schema.sql`](file:///d:/coder/agriculture/backend/database/schema.sql#L1-L233) explicitly creates **17 relational tables**:
  1. `users` (Line 5)
  2. `predictions` (Line 30)
  3. `crop_recommendations` (Line 48)
  4. `soil_reports` (Line 61)
  5. `alerts` (Line 81)
  6. `history` (Line 90)
  7. `marketplace_items` (Line 101)
  8. `community_posts` (Line 118)
  9. `community_replies` (Line 132)
  10. `user_permissions` (Line 144)
  11. `admin_activity_logs` (Line 158)
  12. `mandis` (Line 173)
  13. `market_prices` (Line 183)
  14. `financial_records` (Line 196)
  15. `crop_yield_records` (Line 210)
  16. `market_forecasts` (Line 223)
  17. `sustainability_assessments` (Line 233)
- **Active MySQL Database (`agriculture_db`)**: Contains **18 tables**:
  Includes all 17 tables from `schema.sql` plus **`climate_normals`** (table storing regional temperature, humidity, and rainfall baselines for regional fallback calculations).
