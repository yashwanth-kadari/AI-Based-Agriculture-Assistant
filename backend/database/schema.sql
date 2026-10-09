-- ============================================================
-- AGRISMART AI — CANONICAL MYSQL DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS agriculture_db;
USE agriculture_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'farmer' NOT NULL,
    can_create_accounts TINYINT(1) DEFAULT 0 NOT NULL,
    is_super_admin TINYINT(1) DEFAULT 0 NOT NULL,
    is_verified TINYINT(1) DEFAULT 1 NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    state VARCHAR(100) DEFAULT 'Andhra Pradesh',
    district VARCHAR(100) DEFAULT 'Guntur',
    phone VARCHAR(50) NULL,
    village VARCHAR(100) NULL,
    farm_size FLOAT NULL,
    main_crop VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    n_content FLOAT NOT NULL,
    p_content FLOAT NOT NULL,
    k_content FLOAT NOT NULL,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    ph FLOAT NOT NULL,
    rainfall FLOAT NOT NULL,
    predicted_crop VARCHAR(255) NOT NULL,
    confidence FLOAT NULL,
    state VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Crop Recommendations Reference Table
CREATE TABLE IF NOT EXISTS crop_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    best_season VARCHAR(100) NULL,
    avg_market_price FLOAT NULL,
    sustainability_score FLOAT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Soil Reports Table
CREATE TABLE IF NOT EXISTS soil_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    n_content FLOAT NOT NULL,
    p_content FLOAT NOT NULL,
    k_content FLOAT NOT NULL,
    ph FLOAT NOT NULL,
    temperature FLOAT NULL,
    humidity FLOAT NULL,
    rainfall FLOAT NULL,
    health_status VARCHAR(50) NULL,
    npk_summary TEXT NULL,
    fertilizer_recommendation TEXT NULL,
    irrigation_suggestion TEXT NULL,
    state VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. User Activity History Table
CREATE TABLE IF NOT EXISTS history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Marketplace Items Table
CREATE TABLE IF NOT EXISTS marketplace_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NULL,
    price FLOAT NOT NULL,
    quantity VARCHAR(100) NULL,
    contact VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    state VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    village VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Community Replies Table
CREATE TABLE IF NOT EXISTS community_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Secondary Admin Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    is_granted TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_perm (user_id, permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Admin System Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_user_id INT NULL,
    target_user_email VARCHAR(255) NULL,
    old_role VARCHAR(50) NULL,
    new_role VARCHAR(50) NULL,
    details TEXT NULL,
    ip_address VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial reference data if tables are empty
INSERT INTO crop_recommendations (crop_name, description, best_season, avg_market_price, sustainability_score)
SELECT 'Rice', 'Requires high water availability', 'Kharif', 25.5, 60 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM crop_recommendations LIMIT 1);
INSERT INTO crop_recommendations (crop_name, description, best_season, avg_market_price, sustainability_score)
SELECT 'Maize', 'Requires moderate temperature and rainfall', 'Kharif', 18.0, 75 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM crop_recommendations WHERE crop_name='Maize');
INSERT INTO crop_recommendations (crop_name, description, best_season, avg_market_price, sustainability_score)
SELECT 'Wheat', 'Suitable for cooler climate', 'Rabi', 22.0, 80 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM crop_recommendations WHERE crop_name='Wheat');
INSERT INTO crop_recommendations (crop_name, description, best_season, avg_market_price, sustainability_score)
SELECT 'Cotton', 'Warm climate crop with moderate water needs', 'Kharif', 55.0, 65 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM crop_recommendations WHERE crop_name='Cotton');
INSERT INTO crop_recommendations (crop_name, description, best_season, avg_market_price, sustainability_score)
SELECT 'Sugarcane', 'Long duration crop needing high rainfall', 'Year-round', 3.2, 70 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM crop_recommendations WHERE crop_name='Sugarcane');

INSERT INTO alerts (alert_type, message, severity)
SELECT 'Weather', 'Heavy rainfall expected in the next 3 days', 'High' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM alerts LIMIT 1);
INSERT INTO alerts (alert_type, message, severity)
SELECT 'Pest', 'Locust swarms reported in neighboring regions', 'Critical' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE alert_type='Pest');
INSERT INTO alerts (alert_type, message, severity)
SELECT 'Disease', 'High humidity may cause fungal infections in wheat', 'Medium' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE alert_type='Disease');

-- 12. Mandis Table
CREATE TABLE IF NOT EXISTS mandis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    location TEXT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Market Prices Table
CREATE TABLE IF NOT EXISTS market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mandi_id INT NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    price FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT 'Quintal',
    min_price FLOAT NULL,
    max_price FLOAT NULL,
    modal_price FLOAT NULL,
    price_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_by INT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mandi_id) REFERENCES mandis(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Financial Records Table
CREATE TABLE IF NOT EXISTS financial_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    season VARCHAR(50) DEFAULT 'Kharif',
    seed_cost FLOAT DEFAULT 0,
    fertilizer_cost FLOAT DEFAULT 0,
    pesticide_cost FLOAT DEFAULT 0,
    labor_cost FLOAT DEFAULT 0,
    irrigation_cost FLOAT DEFAULT 0,
    other_cost FLOAT DEFAULT 0,
    total_expense FLOAT DEFAULT 0,
    revenue FLOAT DEFAULT 0,
    profit FLOAT DEFAULT 0,
    recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Crop Yield Records Table
CREATE TABLE IF NOT EXISTS crop_yield_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    season VARCHAR(50) DEFAULT 'Kharif',
    area_acres FLOAT NOT NULL,
    expected_yield_kg FLOAT DEFAULT 0,
    actual_yield_kg FLOAT DEFAULT 0,
    yield_per_acre FLOAT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Harvested',
    harvest_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Market Forecasts Table
CREATE TABLE IF NOT EXISTS market_forecasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    crop_name VARCHAR(100) NOT NULL,
    mandi_id INT NOT NULL,
    forecast_days INT NOT NULL,
    current_price FLOAT NOT NULL,
    predicted_price FLOAT NOT NULL,
    expected_change_pct FLOAT NOT NULL,
    trend VARCHAR(20) NOT NULL,
    confidence FLOAT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (mandi_id) REFERENCES mandis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Sustainability Assessments Table
CREATE TABLE IF NOT EXISTS sustainability_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    crop VARCHAR(100) NOT NULL,
    water_hours FLOAT DEFAULT 0,
    fertilizer_type VARCHAR(100) NULL,
    crop_rotation VARCHAR(100) NULL,
    tillage_type VARCHAR(100) NULL,
    solar_energy TINYINT(1) DEFAULT 0,
    score INT NOT NULL,
    grade VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


