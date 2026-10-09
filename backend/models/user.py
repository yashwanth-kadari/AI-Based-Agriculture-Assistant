from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.orm import validates
from .models import db

ALLOWED_ROLES = ['primary_admin', 'secondary_admin', 'farmer', 'user', 'admin', 'superadmin']
ALLOWED_STATUSES = ['active', 'disabled', 'pending', 'approved', 'suspended', 'rejected']

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(255), unique=True, nullable=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='farmer', nullable=False)
    can_create_accounts = db.Column(db.Boolean, default=False, nullable=False)
    is_super_admin = db.Column(db.Boolean, default=False, nullable=False)
    is_verified = db.Column(db.Boolean, default=True, nullable=False)
    status = db.Column(db.String(50), default='active', nullable=False)
    state = db.Column(db.String(100), default='Andhra Pradesh')
    district = db.Column(db.String(100), default='Guntur')
    phone = db.Column(db.String(50), nullable=True)
    village = db.Column(db.String(100), nullable=True)
    farm_size = db.Column(db.Float, nullable=True)
    main_crop = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    predictions = db.relationship('Prediction', backref='user', cascade='all, delete-orphan', lazy=True)
    soil_reports = db.relationship('SoilReport', backref='user', cascade='all, delete-orphan', lazy=True)
    history_entries = db.relationship('History', backref='user', cascade='all, delete-orphan', lazy=True)
    marketplace_items = db.relationship('MarketplaceItem', backref='user', cascade='all, delete-orphan', lazy=True)
    community_posts = db.relationship('CommunityPost', backref='user', cascade='all, delete-orphan', lazy=True)
    community_replies = db.relationship('CommunityReply', backref='user', cascade='all, delete-orphan', lazy=True)

    @validates('role')
    def validate_role(self, key, role):
        if role is not None and role.lower() not in ALLOWED_ROLES:
            raise ValueError(f"Invalid role '{role}'. Allowed roles are: {ALLOWED_ROLES}")
        return role.lower() if role else 'farmer'

    @validates('status')
    def validate_status(self, key, status):
        if status is not None and status.lower() not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid status '{status}'. Allowed statuses are: {ALLOWED_STATUSES}")
        return status.lower() if status else 'active'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'can_create_accounts': bool(self.can_create_accounts),
            'is_super_admin': bool(self.is_super_admin),
            'is_verified': bool(self.is_verified),
            'status': self.status,
            'state': self.state,
            'district': self.district,
            'phone': self.phone,
            'village': self.village,
            'farm_size': self.farm_size,
            'main_crop': self.main_crop,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
