from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

from .user import User, ALLOWED_ROLES



class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    n_content = db.Column(db.Float, nullable=False)
    p_content = db.Column(db.Float, nullable=False)
    k_content = db.Column(db.Float, nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    humidity = db.Column(db.Float, nullable=False)
    ph = db.Column(db.Float, nullable=False)
    rainfall = db.Column(db.Float, nullable=False)
    predicted_crop = db.Column(db.String(255), nullable=False)
    confidence = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CropRecommendation(db.Model):
    __tablename__ = 'crop_recommendations'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    best_season = db.Column(db.String(100))
    avg_market_price = db.Column(db.Float)
    sustainability_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SoilReport(db.Model):
    __tablename__ = 'soil_reports'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    n_content = db.Column(db.Float, nullable=False)
    p_content = db.Column(db.Float, nullable=False)
    k_content = db.Column(db.Float, nullable=False)
    ph = db.Column(db.Float, nullable=False)
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    rainfall = db.Column(db.Float)
    health_status = db.Column(db.String(50))
    npk_summary = db.Column(db.Text)
    fertilizer_recommendation = db.Column(db.Text)
    irrigation_suggestion = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Alert(db.Model):
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    alert_type = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class History(db.Model):
    __tablename__ = 'history'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MarketplaceItem(db.Model):
    __tablename__ = 'marketplace_items'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.String(100))
    contact = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CommunityPost(db.Model):
    __tablename__ = 'community_posts'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    author_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    replies = db.relationship('CommunityReply', backref='post', cascade='all, delete-orphan', lazy=True)


class CommunityReply(db.Model):
    __tablename__ = 'community_replies'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    post_id = db.Column(db.Integer, db.ForeignKey('community_posts.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    author_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class FinancialRecord(db.Model):
    __tablename__ = 'financial_records'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    crop_type = db.Column(db.String(100), nullable=False)
    season = db.Column(db.String(50), default='Kharif')
    seed_cost = db.Column(db.Float, default=0)
    fertilizer_cost = db.Column(db.Float, default=0)
    pesticide_cost = db.Column(db.Float, default=0)
    labor_cost = db.Column(db.Float, default=0)
    irrigation_cost = db.Column(db.Float, default=0)
    other_cost = db.Column(db.Float, default=0)
    total_expense = db.Column(db.Float, default=0)
    revenue = db.Column(db.Float, default=0)
    profit = db.Column(db.Float, default=0)
    recorded_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CropYieldRecord(db.Model):
    __tablename__ = 'crop_yield_records'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    crop_type = db.Column(db.String(100), nullable=False)
    season = db.Column(db.String(50), default='Kharif')
    area_acres = db.Column(db.Float, nullable=False)
    expected_yield_kg = db.Column(db.Float, default=0)
    actual_yield_kg = db.Column(db.Float, default=0)
    yield_per_acre = db.Column(db.Float, default=0)
    status = db.Column(db.String(50), default='Harvested')
    harvest_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Mandi(db.Model):
    __tablename__ = 'mandis'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    location = db.Column(db.Text)
    status = db.Column(db.String(50), default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarketPrice(db.Model):
    __tablename__ = 'market_prices'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mandi_id = db.Column(db.Integer, db.ForeignKey('mandis.id', ondelete='CASCADE'), nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), default='Quintal')
    min_price = db.Column(db.Float)
    max_price = db.Column(db.Float)
    modal_price = db.Column(db.Float)
    price_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), default='Active')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserPermission(db.Model):
    __tablename__ = 'user_permissions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    permission_key = db.Column(db.String(100), nullable=False)
    is_granted = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class AdminActivityLog(db.Model):
    __tablename__ = 'admin_activity_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    admin_id = db.Column(db.Integer, nullable=False)
    admin_name = db.Column(db.String(255), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    target_user_id = db.Column(db.Integer)
    target_user_email = db.Column(db.String(255))
    old_role = db.Column(db.String(50))
    new_role = db.Column(db.String(50))
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MarketForecast(db.Model):
    __tablename__ = 'market_forecasts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    crop_name = db.Column(db.String(100), nullable=False)
    mandi_id = db.Column(db.Integer, db.ForeignKey('mandis.id', ondelete='CASCADE'), nullable=False)
    forecast_days = db.Column(db.Integer, nullable=False)
    current_price = db.Column(db.Float, nullable=False)
    predicted_price = db.Column(db.Float, nullable=False)
    expected_change_pct = db.Column(db.Float, nullable=False)
    trend = db.Column(db.String(20), nullable=False)
    confidence = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SustainabilityAssessment(db.Model):
    __tablename__ = 'sustainability_assessments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    crop = db.Column(db.String(100), nullable=False)
    water_hours = db.Column(db.Float, default=0)
    fertilizer_type = db.Column(db.String(100))
    crop_rotation = db.Column(db.String(100))
    tillage_type = db.Column(db.String(100))
    solar_energy = db.Column(db.Boolean, default=False)
    score = db.Column(db.Integer, nullable=False)
    grade = db.Column(db.String(10), nullable=False)
    label = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)




