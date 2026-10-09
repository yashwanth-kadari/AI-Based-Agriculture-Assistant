from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from utils.db import init_db
from routes.auth import auth_bp
from routes.predictions import predictions_bp
from routes.dashboard import dashboard_bp
from routes.history import history_bp
from routes.soil import soil_bp
from routes.financial import financial_bp
from routes.risk import risk_bp
from routes.reports import reports_bp
from routes.contact import contact_bp
from routes.marketplace import marketplace_bp
from routes.community import community_bp
from routes.sustainability import sustainability_bp
from routes.market import market_bp
from routes.weather import weather_bp
from routes.expert import expert_bp

from models import db
import os
import config

app = Flask(__name__)

# ── CORS ─────────────────────────────────────────────────────────────────────
frontend_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
origins = [o.strip() for o in frontend_origin.split(',') if o.strip()]
if "http://localhost:5173" not in origins:
    origins.append("http://localhost:5173")
if "http://127.0.0.1:5173" not in origins:
    origins.append("http://127.0.0.1:5173")
CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

# ── Secrets ───────────────────────────────────────────────────────────────────
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

# ── Database config ───────────────────────────────────────────────────────────
# ── SQLAlchemy DB URI — MySQL ONLY, no SQLite fallback ───────────────────────
db_user = os.getenv('DB_USER', getattr(config, 'DB_USER', 'root'))
db_pass = os.getenv('DB_PASSWORD', getattr(config, 'DB_PASSWORD', ''))
db_host = os.getenv('DB_HOST', getattr(config, 'DB_HOST', 'localhost'))
db_port = os.getenv('DB_PORT', getattr(config, 'DB_PORT', '3306'))
db_name = os.getenv('DB_NAME', getattr(config, 'DB_NAME', 'agriculture_db'))

try:
    import mysql.connector
    _probe = mysql.connector.connect(
        host=db_host, port=int(db_port), user=db_user, password=db_pass,
        database=db_name, connection_timeout=5
    )
    _probe.close()
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql+mysqlconnector://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    )
except Exception as _e:
    import sys
    print(
        f"\n[FATAL] AgriSmart cannot start — MySQL connection failed.\n"
        f"  Host: {db_host}:{db_port}  DB: {db_name}  User: {db_user}\n"
        f"  Error: {_e}\n"
        f"  Fix MySQL and restart. SQLite fallback has been permanently removed.\n",
        flush=True
    )
    sys.exit(1)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ── Initialize extensions ─────────────────────────────────────────────────────
jwt = JWTManager(app)
db.init_app(app)

# ── Initialize DB tables & seed admin ─────────────────────────────────────────
init_db()
from seed_admin import seed_super_admin
seed_super_admin()

# ── Blueprints ─────────────────────────────────────────────────────────────────
from routes.admin import admin_bp

app.register_blueprint(auth_bp,           url_prefix='/api/auth')
app.register_blueprint(admin_bp,          url_prefix='/api/admin')
app.register_blueprint(predictions_bp,   url_prefix='/api/predictions')
app.register_blueprint(dashboard_bp,     url_prefix='/api/dashboard')
app.register_blueprint(history_bp,       url_prefix='/api/history')
app.register_blueprint(soil_bp,          url_prefix='/api/soil')
app.register_blueprint(financial_bp,     url_prefix='/api/financial')
app.register_blueprint(risk_bp,          url_prefix='/api/risk')
app.register_blueprint(reports_bp,       url_prefix='/api/reports')
app.register_blueprint(contact_bp,       url_prefix='/api/contact')
app.register_blueprint(marketplace_bp,   url_prefix='/api/marketplace')
app.register_blueprint(community_bp,     url_prefix='/api/community')
app.register_blueprint(sustainability_bp, url_prefix='/api/sustainability')
app.register_blueprint(market_bp,        url_prefix='/api/market')
app.register_blueprint(weather_bp,       url_prefix='/api/weather')
app.register_blueprint(expert_bp,        url_prefix='/api/expert')


@app.route('/')
def home():
    return jsonify({'message': 'AgriSmart AI API is running', 'version': '2.0', 'status': 'OK'})


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(RuntimeError)
def db_connection_error(e):
    """Loud, clear error when MySQL is unreachable mid-request."""
    import traceback
    traceback.print_exc()
    return jsonify({'error': 'Database unavailable — MySQL connection failed. Contact admin.'}), 503


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
