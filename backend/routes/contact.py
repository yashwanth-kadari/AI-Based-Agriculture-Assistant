from flask import Blueprint, request, jsonify
from utils.db import get_db_connection

contact_bp = Blueprint('contact', __name__)


@contact_bp.route('/submit', methods=['POST'])
def submit_contact():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    message = (data.get('message') or '').strip()

    if not name or not email or not message:
        return jsonify({'error': 'Name, email, and message are required'}), 400
    if '@' not in email or len(email) < 5:
        return jsonify({'error': 'Please provide a valid email address'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute(
            'INSERT INTO contact_messages (name, email, message) VALUES (%s, %s, %s)',
            (name, email, message),
        )
        conn.commit()
        return jsonify({
            'message': 'Thank you! Your message has been received. We will respond within 24 hours.',
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
