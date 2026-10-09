from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

expert_bp = Blueprint('expert', __name__)


def _get_current_user_info(cursor, jwt_user_id):
    """Retrieve database user record for the authenticated JWT caller."""
    cursor.execute(
        "SELECT id, user_id, name, email, role, is_super_admin, state, district FROM users WHERE id = %s OR user_id = %s",
        (jwt_user_id, str(jwt_user_id))
    )
    return cursor.fetchone()


@expert_bp.route('/consultations', methods=['GET'])
@jwt_required()
def get_consultations():
    """
    List agricultural advisory inquiries.
    Farmers see their own inquiries; Administrators see all platform inquiries.
    """
    jwt_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = conn.cursor(dictionary=True)
        user = _get_current_user_info(cursor, jwt_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        is_admin = (user.get('is_super_admin') == 1 or user.get('role') in ('primary_admin', 'secondary_admin'))
        status_filter = request.args.get('status')
        crop_filter = request.args.get('crop')

        query_parts = ["""
            SELECT ea.id, ea.user_id, ea.crop_name, ea.topic, ea.question,
                   ea.urgency, ea.status, ea.expert_reply, ea.expert_name,
                   ea.replied_at, ea.created_at,
                   u.name AS farmer_name, u.email AS farmer_email,
                   u.district AS farmer_district, u.state AS farmer_state
            FROM expert_advisories ea
            JOIN users u ON ea.user_id = u.id
        """]
        params = []
        where_clauses = []

        if not is_admin:
            where_clauses.append("ea.user_id = %s")
            params.append(user['id'])

        if status_filter:
            where_clauses.append("ea.status = %s")
            params.append(status_filter)

        if crop_filter:
            where_clauses.append("LOWER(ea.crop_name) = LOWER(%s)")
            params.append(crop_filter)

        if where_clauses:
            query_parts.append("WHERE " + " AND ".join(where_clauses))

        query_parts.append("ORDER BY ea.created_at DESC")
        full_query = " ".join(query_parts)

        cursor.execute(full_query, tuple(params))
        consultations = cursor.fetchall()

        # Format datetimes to ISO strings for frontend
        for c in consultations:
            if c.get('created_at'):
                c['created_at'] = c['created_at'].isoformat()
            if c.get('replied_at'):
                c['replied_at'] = c['replied_at'].isoformat()

        return jsonify({
            'status': 'success',
            'is_admin': is_admin,
            'consultations': consultations
        }), 200

    except Exception as e:
        return jsonify({'error': str(e), 'consultations': []}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@expert_bp.route('/consultations', methods=['POST'])
@jwt_required()
def create_consultation():
    """Submit a new agricultural inquiry to verified agronomists."""
    jwt_user_id = get_jwt_identity()
    data = request.json or {}

    crop_name = (data.get('crop_name') or '').strip()
    topic = (data.get('topic') or '').strip()
    question = (data.get('question') or '').strip()
    urgency = (data.get('urgency') or 'Normal').strip()

    if not crop_name or not topic or not question:
        return jsonify({'error': 'Crop name, advisory topic, and question details are required.'}), 400

    if urgency not in ('Low', 'Normal', 'High', 'Urgent'):
        urgency = 'Normal'

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = conn.cursor(dictionary=True)
        user = _get_current_user_info(cursor, jwt_user_id)
        if not user:
            return jsonify({'error': 'User profile not found.'}), 404

        cursor.execute(
            """INSERT INTO expert_advisories (user_id, crop_name, topic, question, urgency, status)
               VALUES (%s, %s, %s, %s, %s, 'Pending')""",
            (user['id'], crop_name, topic, question, urgency)
        )
        conn.commit()
        new_id = cursor.lastrowid

        cursor.execute("""
            SELECT ea.id, ea.user_id, ea.crop_name, ea.topic, ea.question,
                   ea.urgency, ea.status, ea.expert_reply, ea.expert_name,
                   ea.replied_at, ea.created_at,
                   u.name AS farmer_name
            FROM expert_advisories ea
            JOIN users u ON ea.user_id = u.id
            WHERE ea.id = %s
        """, (new_id,))
        created = cursor.fetchone()

        if created and created.get('created_at'):
            created['created_at'] = created['created_at'].isoformat()

        return jsonify({
            'status': 'success',
            'message': 'Consultation request submitted to agricultural specialists.',
            'consultation': created
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@expert_bp.route('/consultations/<int:consultation_id>/reply', methods=['POST'])
@jwt_required()
def reply_consultation(consultation_id):
    """Agronomist/Admin responds to an existing farmer consultation."""
    jwt_user_id = get_jwt_identity()
    data = request.json or {}

    expert_reply = (data.get('expert_reply') or '').strip()
    if not expert_reply:
        return jsonify({'error': 'Expert reply message cannot be empty.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = conn.cursor(dictionary=True)
        user = _get_current_user_info(cursor, jwt_user_id)
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        is_admin = (user.get('is_super_admin') == 1 or user.get('role') in ('primary_admin', 'secondary_admin', 'expert'))
        if not is_admin:
            return jsonify({'error': 'Unauthorized: Only agronomy experts and administrators can post advisory replies.'}), 403

        expert_name = (data.get('expert_name') or user.get('name') or 'Senior Agronomist').strip()

        cursor.execute("SELECT id, status FROM expert_advisories WHERE id = %s", (consultation_id,))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({'error': 'Consultation inquiry not found.'}), 404

        cursor.execute(
            """UPDATE expert_advisories
               SET expert_reply = %s, expert_name = %s, status = 'Answered', replied_at = NOW()
               WHERE id = %s""",
            (expert_reply, expert_name, consultation_id)
        )
        conn.commit()

        cursor.execute("""
            SELECT ea.id, ea.user_id, ea.crop_name, ea.topic, ea.question,
                   ea.urgency, ea.status, ea.expert_reply, ea.expert_name,
                   ea.replied_at, ea.created_at,
                   u.name AS farmer_name
            FROM expert_advisories ea
            JOIN users u ON ea.user_id = u.id
            WHERE ea.id = %s
        """, (consultation_id,))
        updated = cursor.fetchone()

        if updated:
            if updated.get('created_at'):
                updated['created_at'] = updated['created_at'].isoformat()
            if updated.get('replied_at'):
                updated['replied_at'] = updated['replied_at'].isoformat()

        return jsonify({
            'status': 'success',
            'message': 'Expert advisory guidance posted successfully.',
            'consultation': updated
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@expert_bp.route('/consultations/<int:consultation_id>', methods=['DELETE'])
@jwt_required()
def delete_consultation(consultation_id):
    """Delete a consultation inquiry (allowed for the author if pending, or admin)."""
    jwt_user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = conn.cursor(dictionary=True)
        user = _get_current_user_info(cursor, jwt_user_id)
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        cursor.execute("SELECT id, user_id, status FROM expert_advisories WHERE id = %s", (consultation_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Consultation inquiry not found.'}), 404

        is_admin = (user.get('is_super_admin') == 1 or user.get('role') in ('primary_admin', 'secondary_admin'))
        is_owner = (row['user_id'] == user['id'])

        if not (is_admin or is_owner):
            return jsonify({'error': 'Unauthorized to delete this consultation.'}), 403

        cursor.execute("DELETE FROM expert_advisories WHERE id = %s", (consultation_id,))
        conn.commit()

        return jsonify({'status': 'success', 'message': 'Consultation deleted successfully.'}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
