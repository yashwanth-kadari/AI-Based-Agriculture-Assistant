from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

community_bp = Blueprint('community', __name__)


@community_bp.route('/posts', methods=['GET'])
def get_posts():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed', 'posts': []}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        # Fetch discussion posts with reply counts
        cursor.execute("""
            SELECT p.*, COUNT(r.id) AS reply_count 
            FROM community_posts p
            LEFT JOIN community_replies r ON p.id = r.post_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)
        posts = cursor.fetchall()
        return jsonify({'posts': posts}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'posts': []}), 500
    finally:
        cursor.close()
        conn.close()


@community_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    data = request.json or {}
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass
    title = (data.get('title') or '').strip()
    content = (data.get('content') or '').strip()
    author_name = (data.get('author_name') or '').strip()

    if not all([user_id, title, content]):
        return jsonify({'error': 'Missing title or content'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        if not author_name or author_name == 'Anonymous Farmer':
            cursor.execute("SELECT name FROM users WHERE id = %s OR user_id = %s", (user_id, str(user_id)))
            u = cursor.fetchone()
            if u and u.get('name'):
                author_name = u['name']
            else:
                author_name = author_name or 'Anonymous Farmer'

        cursor.execute("""
            INSERT INTO community_posts (title, content, user_id, author_name)
            VALUES (%s, %s, %s, %s)
        """, (title, content, user_id, author_name))
        
        # log in history
        cursor.execute("""
            INSERT INTO history (user_id, action, details)
            VALUES (%s, %s, %s)
        """, (user_id, 'Community Post', f'Created discussion post: "{title}"'))
        
        conn.commit()
        return jsonify({'message': 'Discussion topic created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@community_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        # Fetch the thread topic post
        cursor.execute('SELECT * FROM community_posts WHERE id = %s', (post_id,))
        post = cursor.fetchone()

        if not post:
            return jsonify({'error': 'Discussion topic not found'}), 404

        # Fetch replies to this thread topic
        cursor.execute("""
            SELECT * FROM community_replies 
            WHERE post_id = %s 
            ORDER BY created_at ASC
        """, (post_id,))
        replies = cursor.fetchall()

        return jsonify({'post': post, 'replies': replies}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@community_bp.route('/posts/<int:post_id>/replies', methods=['POST'])
@jwt_required()
def add_reply(post_id):
    data = request.json or {}
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass
    content = (data.get('content') or '').strip()
    author_name = (data.get('author_name') or '').strip()

    if not all([user_id, content]):
        return jsonify({'error': 'Comment content cannot be empty'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        if not author_name or author_name == 'Anonymous Farmer':
            cursor.execute("SELECT name FROM users WHERE id = %s OR user_id = %s", (user_id, str(user_id)))
            u = cursor.fetchone()
            if u and u.get('name'):
                author_name = u['name']
            else:
                author_name = author_name or 'Anonymous Farmer'
        
        # check if topic post exists
        cursor.execute('SELECT id, title FROM community_posts WHERE id = %s', (post_id,))
        post = cursor.fetchone()
        if not post:
            return jsonify({'error': 'Discussion topic not found'}), 404
            
        cursor.execute("""
            INSERT INTO community_replies (post_id, content, user_id, author_name)
            VALUES (%s, %s, %s, %s)
        """, (post_id, content, user_id, author_name))
        
        # log in history
        cursor.execute("""
            INSERT INTO history (user_id, action, details)
            VALUES (%s, %s, %s)
        """, (user_id, 'Community Reply', f'Replied to thread: "{post["title"]}"'))
        
        conn.commit()
        return jsonify({'message': 'Reply added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
