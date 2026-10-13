from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
from datetime import datetime

history_bp = Blueprint('history', __name__)

@history_bp.route('', methods=['GET'])
@history_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_history():
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connect failed', 'history': []}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, user_id, action, details, created_at FROM history WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        rows = cursor.fetchall()

        # Serialize datetime objects
        history = []
        for row in rows:
            item = dict(row)
            if isinstance(item.get('created_at'), datetime):
                item['created_at'] = item['created_at'].strftime('%Y-%m-%dT%H:%M:%S')
            history.append(item)

        return jsonify({'history': history}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'history': []}), 500
    finally:
        cursor.close()
        conn.close()
