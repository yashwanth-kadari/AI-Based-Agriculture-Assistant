from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
from datetime import datetime, timedelta
import csv
import io

reports_bp = Blueprint('reports', __name__)

MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

def parse_datetime(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    try:
        return datetime.strptime(str(val).split('.')[0], '%Y-%m-%d %H:%M:%S')
    except Exception:
        try:
            return datetime.strptime(str(val), '%Y-%m-%d')
        except Exception:
            return None

def get_period_delta(period):
    if period == '7d':
        return timedelta(days=7)
    elif period == '30d':
        return timedelta(days=30)
    elif period == '3m':
        return timedelta(days=90)
    elif period == '6m':
        return timedelta(days=180)
    elif period == '1y':
        return timedelta(days=365)
    return None

def _is_caller_admin(user_id):
    if not user_id:
        return False
    conn = get_db_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT role, is_super_admin FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if row:
            role = (row.get('role') or '').lower()
            return bool(row.get('is_super_admin')) or role in ['primary_admin', 'superadmin', 'secondary_admin', 'admin']
    except Exception:
        pass
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
    return False

def get_effective_user_id():
    """Extract authenticated user ID from JWT. Only admins may supply a different user_id."""
    jwt_id = get_jwt_identity()
    if not jwt_id:
        return None
    try:
        caller_id = int(jwt_id)
    except (ValueError, TypeError):
        return None

    target_id = request.args.get('user_id')
    if not target_id:
        body = request.get_json(silent=True) or {}
        target_id = body.get('user_id')

    if target_id and _is_caller_admin(caller_id):
        try:
            return int(target_id)
        except (ValueError, TypeError):
            pass

    # Non-admins ALWAYS use caller's authenticated ID from token
    return caller_id

@reports_bp.route('/analytics', methods=['GET'])
@jwt_required(optional=True)
def get_farmer_analytics():
    user_id = get_effective_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required. User ID missing.'}), 401

    period = request.args.get('period', 'all')
    crop_filter = (request.args.get('crop') or 'all').lower()

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Verify user details
        cursor.execute("SELECT id, name, role, state, district, farm_size, main_crop FROM users WHERE id = %s", (user_id,))
        user_info = cursor.fetchone()
        if not user_info:
            return jsonify({'error': 'User not found'}), 404

        delta = get_period_delta(period)
        min_date = datetime.utcnow() - delta if delta else None

        # ── 1. Financial Records ──────────────────────────────────────────────
        fin_query = "SELECT * FROM financial_records WHERE user_id = %s"
        fin_params = [user_id]
        if crop_filter != 'all':
            fin_query += " AND LOWER(crop_type) = %s"
            fin_params.append(crop_filter)
        fin_query += " ORDER BY recorded_date ASC"

        cursor.execute(fin_query, tuple(fin_params))
        all_fin_rows = cursor.fetchall()

        # Apply date filtering
        fin_rows = []
        for r in all_fin_rows:
            r_dt = parse_datetime(r.get('recorded_date') or r.get('created_at'))
            if min_date and r_dt and r_dt < min_date:
                continue
            fin_rows.append(r)

        total_seed = sum(r.get('seed_cost', 0) or 0 for r in fin_rows)
        total_fertilizer = sum(r.get('fertilizer_cost', 0) or 0 for r in fin_rows)
        total_pesticide = sum(r.get('pesticide_cost', 0) or 0 for r in fin_rows)
        total_labor = sum(r.get('labor_cost', 0) or 0 for r in fin_rows)
        total_irrigation = sum(r.get('irrigation_cost', 0) or 0 for r in fin_rows)
        total_other = sum(r.get('other_cost', 0) or 0 for r in fin_rows)
        total_expenses = sum(r.get('total_expense', 0) or 0 for r in fin_rows)
        total_revenue = sum(r.get('revenue', 0) or 0 for r in fin_rows)
        net_profit = total_revenue - total_expenses
        profit_margin = round((net_profit / total_revenue * 100), 1) if total_revenue > 0 else 0

        expense_breakdown = [
            {'category': 'Seeds', 'amount': round(total_seed, 2)},
            {'category': 'Fertilizers', 'amount': round(total_fertilizer, 2)},
            {'category': 'Pesticides', 'amount': round(total_pesticide, 2)},
            {'category': 'Labour', 'amount': round(total_labor, 2)},
            {'category': 'Irrigation', 'amount': round(total_irrigation, 2)},
            {'category': 'Other', 'amount': round(total_other, 2)},
        ]

        # Monthly financial trajectory
        fin_by_month = {}
        for r in fin_rows:
            r_dt = parse_datetime(r.get('recorded_date') or r.get('created_at'))
            m_key = r_dt.strftime('%b %Y') if r_dt else 'Unknown'
            if m_key not in fin_by_month:
                fin_by_month[m_key] = {'expenses': 0, 'revenue': 0, 'profit': 0}
            fin_by_month[m_key]['expenses'] += r.get('total_expense', 0) or 0
            fin_by_month[m_key]['revenue'] += r.get('revenue', 0) or 0
            fin_by_month[m_key]['profit'] += r.get('profit', 0) or 0

        cost_vs_revenue = [
            {
                'month': m,
                'expenses': round(vals['expenses'], 2),
                'revenue': round(vals['revenue'], 2),
                'profit': round(vals['profit'], 2),
            }
            for m, vals in fin_by_month.items()
        ]

        # ── 2. Crop Yield Records ──────────────────────────────────────────────
        yield_query = "SELECT * FROM crop_yield_records WHERE user_id = %s"
        yield_params = [user_id]
        if crop_filter != 'all':
            yield_query += " AND LOWER(crop_type) = %s"
            yield_params.append(crop_filter)
        yield_query += " ORDER BY harvest_date ASC"

        cursor.execute(yield_query, tuple(yield_params))
        all_yield_rows = cursor.fetchall()

        yield_rows = []
        for r in all_yield_rows:
            r_dt = parse_datetime(r.get('harvest_date') or r.get('created_at'))
            if min_date and r_dt and r_dt < min_date:
                continue
            yield_rows.append(r)

        total_yield_kg = sum(r.get('actual_yield_kg', 0) or r.get('expected_yield_kg', 0) or 0 for r in yield_rows)
        crop_cycles_count = len(yield_rows)

        distinct_areas = [r.get('area_acres', 0) for r in yield_rows if r.get('area_acres')]
        total_cultivated_area = max(distinct_areas) if distinct_areas else (user_info.get('farm_size') or 2.5)
        avg_yield_per_acre = round(total_yield_kg / total_cultivated_area, 1) if total_cultivated_area > 0 and total_yield_kg > 0 else 0

        crop_agg = {}
        for r in yield_rows:
            c_type = (r.get('crop_type') or 'General').title()
            y_val = r.get('actual_yield_kg', 0) or r.get('expected_yield_kg', 0) or 0
            acres = r.get('area_acres', 1) or 1
            if c_type not in crop_agg:
                crop_agg[c_type] = {'total_yield': 0, 'total_acres': 0, 'count': 0}
            crop_agg[c_type]['total_yield'] += y_val
            crop_agg[c_type]['total_acres'] += acres
            crop_agg[c_type]['count'] += 1

        crop_wise_yield = [
            {
                'crop': c,
                'total_yield': round(vals['total_yield'], 1),
                'yield_per_acre': round(vals['total_yield'] / vals['total_acres'], 1) if vals['total_acres'] > 0 else 0,
                'cycles': vals['count']
            }
            for c, vals in crop_agg.items()
        ]

        yield_over_time = []
        for r in yield_rows:
            r_dt = parse_datetime(r.get('harvest_date') or r.get('created_at'))
            yield_over_time.append({
                'date': r_dt.strftime('%b %Y') if r_dt else 'Unknown',
                'crop': (r.get('crop_type') or '').title(),
                'actual_yield': r.get('actual_yield_kg', 0) or 0,
                'expected_yield': r.get('expected_yield_kg', 0) or 0,
                'yield_per_acre': r.get('yield_per_acre', 0) or 0,
            })

        # ── 3. Soil Reports & Climate Trends ──────────────────────────────────
        soil_query = "SELECT * FROM soil_reports WHERE user_id = %s ORDER BY created_at ASC"
        cursor.execute(soil_query, (user_id,))
        all_soil_rows = cursor.fetchall()

        soil_rows = []
        for r in all_soil_rows:
            r_dt = parse_datetime(r.get('created_at'))
            if min_date and r_dt and r_dt < min_date:
                continue
            soil_rows.append(r)

        latest_soil = soil_rows[-1] if soil_rows else (all_soil_rows[-1] if all_soil_rows else None)
        soil_health_status = latest_soil.get('health_status', 'Optimal') if latest_soil else 'Not Tested'

        soil_trends = []
        for r in soil_rows:
            r_dt = parse_datetime(r.get('created_at'))
            soil_trends.append({
                'date': r_dt.strftime('%d %b %Y') if r_dt else 'Unknown',
                'N': r.get('n_content', 0),
                'P': r.get('p_content', 0),
                'K': r.get('k_content', 0),
                'ph': r.get('ph', 7.0),
                'temperature': r.get('temperature') or 24.0,
                'humidity': r.get('humidity') or 60.0,
                'rainfall': r.get('rainfall') or 100.0,
            })

        # ── 4. Sustainability Assessments ─────────────────────────────────────
        sust_query = "SELECT * FROM sustainability_assessments WHERE user_id = %s"
        sust_params = [user_id]
        if crop_filter != 'all':
            sust_query += " AND LOWER(crop) = %s"
            sust_params.append(crop_filter)
        sust_query += " ORDER BY created_at ASC"

        cursor.execute(sust_query, tuple(sust_params))
        all_sust_rows = cursor.fetchall()

        sust_rows = []
        for r in all_sust_rows:
            r_dt = parse_datetime(r.get('created_at'))
            if min_date and r_dt and r_dt < min_date:
                continue
            sust_rows.append(r)

        avg_sust_score = round(sum(r.get('score', 0) for r in sust_rows) / len(sust_rows), 1) if sust_rows else 0
        latest_sust_grade = sust_rows[-1].get('grade') if sust_rows else (all_sust_rows[-1].get('grade') if all_sust_rows else 'N/A')

        # ── 5. Pest Risk History ──────────────────────────────────────────────
        pest_query = "SELECT * FROM history WHERE user_id = %s AND action = 'Pest Risk Analysis' ORDER BY created_at DESC"
        cursor.execute(pest_query, (user_id,))
        all_pest_rows = cursor.fetchall()
        pest_rows = []
        for r in all_pest_rows:
            r_dt = parse_datetime(r.get('created_at'))
            if min_date and r_dt and r_dt < min_date:
                continue
            pest_rows.append(r)

        latest_pest_desc = pest_rows[0].get('details') if pest_rows else (all_pest_rows[0].get('details') if all_pest_rows else 'No Pest Checks')

        # ── 6. AI Recommendation & Activity History (All 6 Features) ───────────
        pred_query = "SELECT * FROM predictions WHERE user_id = %s"
        pred_params = [user_id]
        if crop_filter != 'all':
            pred_query += " AND LOWER(predicted_crop) = %s"
            pred_params.append(crop_filter)
        pred_query += " ORDER BY created_at DESC"

        cursor.execute(pred_query, tuple(pred_params))
        all_pred_rows = cursor.fetchall()
        pred_rows = []
        for p in all_pred_rows:
            p_dt = parse_datetime(p.get('created_at'))
            if min_date and p_dt and p_dt < min_date:
                continue
            pred_rows.append(p)

        ai_history = []
        # Add Crop Predictions
        for p in pred_rows:
            p_dt = parse_datetime(p.get('created_at'))
            ai_history.append({
                'id': f"crop_{p['id']}",
                'raw_date': p_dt,
                'type': 'Crop Recommendation',
                'date': p_dt.strftime('%d %b %Y, %I:%M %p') if p_dt else 'Unknown',
                'recommendation': (p.get('predicted_crop') or '').title(),
                'confidence': round(p.get('confidence', 95.0), 1) if p.get('confidence') else 95.0,
                'inputs': f"N:{p.get('n_content')} P:{p.get('p_content')} K:{p.get('k_content')} | pH:{p.get('ph')} | Temp:{p.get('temperature')}°C Rain:{p.get('rainfall')}mm",
                'location': f"{p.get('district') or user_info.get('district') or 'Guntur'}, {p.get('state') or user_info.get('state') or 'Andhra Pradesh'}",
            })

        # Add Pest Analyses
        for p in pest_rows:
            p_dt = parse_datetime(p.get('created_at'))
            ai_history.append({
                'id': f"pest_{p['id']}",
                'raw_date': p_dt,
                'type': 'Pest Risk Analysis',
                'date': p_dt.strftime('%d %b %Y, %I:%M %p') if p_dt else 'Unknown',
                'recommendation': p.get('details', 'Pest Risk Evaluated'),
                'confidence': 92.0,
                'inputs': f"Pest Scan: {p.get('details')}",
                'location': f"{user_info.get('district') or 'Guntur'}, {user_info.get('state') or 'Andhra Pradesh'}",
            })

        # Add Soil health reports
        for s in soil_rows:
            s_dt = parse_datetime(s.get('created_at'))
            ai_history.append({
                'id': f"soil_{s['id']}",
                'raw_date': s_dt,
                'type': 'Soil Nutrient Analysis',
                'date': s_dt.strftime('%d %b %Y, %I:%M %p') if s_dt else 'Unknown',
                'recommendation': f"Health: {s.get('health_status', 'Optimal')}",
                'confidence': 98.0,
                'inputs': f"N:{s.get('n_content')} P:{s.get('p_content')} K:{s.get('k_content')} pH:{s.get('ph')}",
                'location': f"{s.get('district') or user_info.get('district') or 'Guntur'}, {s.get('state') or user_info.get('state') or 'Andhra Pradesh'}",
            })

        # Add Sustainability Audits
        for st in sust_rows:
            st_dt = parse_datetime(st.get('created_at'))
            ai_history.append({
                'id': f"sust_{st['id']}",
                'raw_date': st_dt,
                'type': 'Sustainability Audit',
                'date': st_dt.strftime('%d %b %Y, %I:%M %p') if st_dt else 'Unknown',
                'recommendation': f"Score: {st.get('score')}/100 ({st.get('grade')}) — {st.get('label')}",
                'confidence': 100.0,
                'inputs': f"Crop: {st.get('crop')} | Water: {st.get('water_hours')}h | Tillage: {st.get('tillage_type')}",
                'location': f"{user_info.get('district') or 'Guntur'}, {user_info.get('state') or 'Andhra Pradesh'}",
            })

        # Sort AI history by datetime descending
        ai_history.sort(key=lambda x: x['raw_date'] or datetime.min, reverse=True)
        for item in ai_history:
            item.pop('raw_date', None)

        # ── 7. Cross-Feature Summary Metrics ──────────────────────────────────
        total_activities = (
            len(pred_rows) + len(pest_rows) + len(yield_rows) +
            len(soil_rows) + len(fin_rows) + len(sust_rows)
        )

        last_soil_date = parse_datetime(soil_rows[-1].get('created_at')) if soil_rows else None
        days_since_soil = (datetime.utcnow() - last_soil_date).days if last_soil_date else None

        cross_feature_summary = {
            'total_activities': total_activities,
            'crop_predictions': len(pred_rows),
            'pest_checks': len(pest_rows),
            'yield_records': len(yield_rows),
            'soil_tests': len(soil_rows),
            'financial_logs': len(fin_rows),
            'sustainability_audits': len(sust_rows),
            'avg_sustainability_score': avg_sust_score,
            'sustainability_grade': latest_sust_grade,
            'days_since_soil_test': days_since_soil,
            'soil_health_status': soil_health_status,
            'latest_pest_risk': latest_pest_desc,
            'total_yield_kg': round(total_yield_kg, 1),
            'net_profit': round(net_profit, 2),
            'profit_margin': profit_margin,
        }

        # ── 8. Farmer Insights Generation ──────────────────────────────────────
        insights = []
        if len(yield_rows) >= 2:
            last_y = yield_rows[-1].get('actual_yield_kg') or yield_rows[-1].get('expected_yield_kg') or 0
            prev_y = yield_rows[-2].get('actual_yield_kg') or yield_rows[-2].get('expected_yield_kg') or 0
            c_name = (yield_rows[-1].get('crop_type') or 'crop').title()
            if prev_y > 0:
                pct = round(((last_y - prev_y) / prev_y) * 100, 1)
                if pct >= 0:
                    insights.append({
                        'title': f'{c_name} Yield Improvement',
                        'type': 'positive',
                        'message': f"Your recent {c_name} harvest reached {last_y:,.0f} kg ({pct}% increase over previous cycle). Yield efficiency is currently {avg_yield_per_acre:,.0f} kg/acre.",
                    })
                else:
                    insights.append({
                        'title': f'{c_name} Yield Variance',
                        'type': 'warning',
                        'message': f"Recent {c_name} yield decreased by {abs(pct)}% compared to last cycle ({last_y:,.0f} kg vs {prev_y:,.0f} kg). Inspect irrigation and soil NPK levels.",
                    })
        elif len(yield_rows) == 1:
            r = yield_rows[0]
            c_name = (r.get('crop_type') or 'crop').title()
            y_val = r.get('actual_yield_kg') or r.get('expected_yield_kg') or 0
            insights.append({
                'title': f'Initial {c_name} Harvest Baseline',
                'type': 'positive',
                'message': f"First crop cycle recorded {y_val:,.0f} kg total yield ({round(y_val / (r.get('area_acres') or 1), 1)} kg/acre). Run additional predictions to track trends.",
            })

        if total_expenses > 0:
            if total_fertilizer / total_expenses > 0.30:
                insights.append({
                    'title': 'Fertilizer Cost Optimization',
                    'type': 'info',
                    'message': f"Fertilizers account for {round((total_fertilizer / total_expenses) * 100)}% of total farming expenses (₹{total_fertilizer:,.0f}). Incorporating organic bio-fertilizers could reduce cost by 15-20%.",
                })
            if net_profit > 0:
                insights.append({
                    'title': 'Profitable Return on Investment',
                    'type': 'positive',
                    'message': f"Your farm generated ₹{net_profit:,.0f} in net profit with a profit margin of {profit_margin}%. Revenue reached ₹{total_revenue:,.0f} against expenses of ₹{total_expenses:,.0f}.",
                })

        if soil_rows:
            latest = soil_rows[-1]
            n_val = latest.get('n_content', 0)
            ph_val = latest.get('ph', 7.0)

            if n_val < 50:
                insights.append({
                    'title': 'Nitrogen Supplement Needed',
                    'type': 'warning',
                    'message': f"Soil Nitrogen level is low ({n_val} mg/kg). Consider applying split Urea or leguminous cover crops before next sowing cycle.",
                })
            elif n_val > 95:
                insights.append({
                    'title': 'Nitrogen Level High',
                    'type': 'info',
                    'message': f"Soil Nitrogen is high ({n_val} mg/kg). Avoid excessive Nitrogen top-dressing to prevent lodging and pest susceptibility.",
                })

            if ph_val < 6.0:
                insights.append({
                    'title': 'Soil Acidity Alert',
                    'type': 'warning',
                    'message': f"Soil pH is acidic ({ph_val}). Apply agricultural lime (calcium carbonate) to balance soil acidity for optimal nutrient intake.",
                })
            elif ph_val > 7.5:
                insights.append({
                    'title': 'Alkaline Soil Balance',
                    'type': 'info',
                    'message': f"Soil pH is slightly alkaline ({ph_val}). Gypsum application is recommended to improve micronutrient availability.",
                })

        if sust_rows:
            latest_s = sust_rows[-1]
            insights.append({
                'title': f"Regenerative Sustainability ({latest_s.get('grade')})",
                'type': 'positive' if latest_s.get('score', 0) >= 70 else 'info',
                'message': f"Farm sustainability index rated {latest_s.get('score')}/100 ({latest_s.get('label')}). Maintain crop rotation to preserve organic soil health.",
            })

        if not insights:
            insights.append({
                'title': 'More Data Needed for AI Insights',
                'type': 'neutral',
                'message': 'More farming records are needed to generate custom AI insights. Run soil health testing or log farm expenses to unlock tailored recommendations.',
            })

        current_crop_name = (user_info.get('main_crop') or (yield_rows[-1].get('crop_type') if yield_rows else 'Wheat')).title()

        return jsonify({
            'overview': {
                'farmer_name': user_info.get('name'),
                'location': f"{user_info.get('district') or 'Guntur'}, {user_info.get('state') or 'Andhra Pradesh'}",
                'total_cultivated_area': round(total_cultivated_area, 1),
                'crop_cycles_count': crop_cycles_count,
                'current_crop': current_crop_name,
                'total_yield_kg': round(total_yield_kg, 1),
                'avg_yield_per_acre': avg_yield_per_acre,
                'total_expenses': round(total_expenses, 2),
                'total_revenue': round(total_revenue, 2),
                'net_profit': round(net_profit, 2),
                'profit_margin': profit_margin,
                'soil_health_status': soil_health_status,
                'total_ai_predictions': len(pred_rows),
            },
            'cross_feature_summary': cross_feature_summary,
            'crop_analytics': {
                'crop_wise_yield': crop_wise_yield,
                'yield_over_time': yield_over_time,
                'crop_records': [
                    {
                        'id': r['id'],
                        'crop_type': (r.get('crop_type') or '').title(),
                        'season': r.get('season', 'Kharif'),
                        'area_acres': r.get('area_acres', 0),
                        'expected_yield_kg': r.get('expected_yield_kg', 0),
                        'actual_yield_kg': r.get('actual_yield_kg', 0),
                        'yield_per_acre': r.get('yield_per_acre', 0),
                        'status': r.get('status', 'Harvested'),
                        'harvest_date': parse_datetime(r.get('harvest_date') or r.get('created_at')).strftime('%d %b %Y') if parse_datetime(r.get('harvest_date') or r.get('created_at')) else 'Unknown'
                    }
                    for r in reversed(yield_rows)
                ]
            },
            'financial_analytics': {
                'expense_breakdown': expense_breakdown,
                'cost_vs_revenue': cost_vs_revenue,
                'records': [
                    {
                        'id': r['id'],
                        'crop_type': (r.get('crop_type') or '').title(),
                        'season': r.get('season', 'Kharif'),
                        'seed_cost': r.get('seed_cost', 0),
                        'fertilizer_cost': r.get('fertilizer_cost', 0),
                        'pesticide_cost': r.get('pesticide_cost', 0),
                        'labor_cost': r.get('labor_cost', 0),
                        'irrigation_cost': r.get('irrigation_cost', 0),
                        'other_cost': r.get('other_cost', 0),
                        'total_expense': r.get('total_expense', 0),
                        'revenue': r.get('revenue', 0),
                        'profit': r.get('profit', 0),
                        'recorded_date': parse_datetime(r.get('recorded_date') or r.get('created_at')).strftime('%d %b %Y') if parse_datetime(r.get('recorded_date') or r.get('created_at')) else 'Unknown'
                    }
                    for r in reversed(fin_rows)
                ]
            },
            'soil_analytics': {
                'latest_status': soil_health_status,
                'soil_trends': soil_trends,
            },
            'sustainability_analytics': {
                'total_audits': len(sust_rows),
                'avg_score': avg_sust_score,
                'latest_grade': latest_sust_grade,
                'records': [
                    {
                        'id': r['id'],
                        'crop': r['crop'],
                        'score': r['score'],
                        'grade': r['grade'],
                        'label': r['label'],
                        'water_hours': r['water_hours'],
                        'fertilizer_type': r['fertilizer_type'],
                        'crop_rotation': r['crop_rotation'],
                        'tillage_type': r['tillage_type'],
                        'solar_energy': bool(r['solar_energy']),
                        'date': parse_datetime(r.get('created_at')).strftime('%d %b %Y') if parse_datetime(r.get('created_at')) else 'Unknown'
                    }
                    for r in reversed(sust_rows)
                ]
            },
            'ai_history': ai_history,
            'insights': insights,
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@reports_bp.route('/financials', methods=['POST'])
@jwt_required(optional=True)
def add_financial_record():
    user_id = get_effective_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required.'}), 401

    data = request.json or {}
    crop_type = (data.get('crop_type') or 'Wheat').strip().title()
    season = (data.get('season') or 'Kharif').strip().title()
    seed = float(data.get('seed_cost') or 0)
    fertilizer = float(data.get('fertilizer_cost') or 0)
    pesticide = float(data.get('pesticide_cost') or 0)
    labor = float(data.get('labor_cost') or 0)
    irrigation = float(data.get('irrigation_cost') or 0)
    other = float(data.get('other_cost') or 0)
    revenue = float(data.get('revenue') or 0)

    total_expense = seed + fertilizer + pesticide + labor + irrigation + other
    profit = revenue - total_expense

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO financial_records 
            (user_id, crop_type, season, seed_cost, fertilizer_cost, pesticide_cost, labor_cost, irrigation_cost, other_cost, total_expense, revenue, profit, recorded_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, crop_type, season, seed, fertilizer, pesticide, labor, irrigation, other,
            total_expense, revenue, profit, datetime.utcnow()
        ))

        cursor.execute("""
            INSERT INTO history (user_id, action, details)
            VALUES (%s, %s, %s)
        """, (
            user_id, 'Financial Record Added',
            f"{crop_type} ({season}): Expense ₹{total_expense:,.0f}, Revenue ₹{revenue:,.0f}, Profit ₹{profit:,.0f}"
        ))

        conn.commit()
        return jsonify({'message': 'Financial record logged successfully.', 'total_expense': total_expense, 'profit': profit}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@reports_bp.route('/yields', methods=['POST'])
@jwt_required(optional=True)
def add_yield_record():
    user_id = get_effective_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required.'}), 401

    data = request.json or {}
    crop_type = (data.get('crop_type') or 'Wheat').strip().title()
    season = (data.get('season') or 'Kharif').strip().title()
    area_acres = float(data.get('area_acres') or 1.0)
    actual_yield_kg = float(data.get('actual_yield_kg') or 0)
    expected_yield_kg = float(data.get('expected_yield_kg') or actual_yield_kg)
    status = (data.get('status') or 'Harvested').strip().title()

    yield_per_acre = round(actual_yield_kg / area_acres, 1) if area_acres > 0 else 0

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO crop_yield_records 
            (user_id, crop_type, season, area_acres, expected_yield_kg, actual_yield_kg, yield_per_acre, status, harvest_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, crop_type, season, area_acres, expected_yield_kg, actual_yield_kg,
            yield_per_acre, status, datetime.utcnow()
        ))

        cursor.execute("""
            INSERT INTO history (user_id, action, details)
            VALUES (%s, %s, %s)
        """, (
            user_id, 'Crop Yield Record Added',
            f"{crop_type} ({season}) on {area_acres} acre(s): Harvested {actual_yield_kg:,.0f} kg ({yield_per_acre:,.0f} kg/acre)"
        ))

        conn.commit()
        return jsonify({'message': 'Crop yield record logged successfully.', 'yield_per_acre': yield_per_acre}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@reports_bp.route('/download', methods=['GET'])
@jwt_required(optional=True)
def download_report():
    user_id = get_effective_user_id()
    report_type = request.args.get('type', 'yield')
    period = request.args.get('period', 'all')
    crop_filter = (request.args.get('crop') or 'all').lower()

    if not user_id:
        return jsonify({'error': 'User ID required'}), 400

    delta = get_period_delta(period)
    min_date = datetime.utcnow() - delta if delta else None

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == 'financial':
            writer.writerow(['Date', 'Crop', 'Season', 'Seeds (INR)', 'Fertilizers (INR)', 'Pesticides (INR)', 'Labour (INR)', 'Irrigation (INR)', 'Other (INR)', 'Total Expenses (INR)', 'Revenue (INR)', 'Profit (INR)'])
            query = "SELECT recorded_date, crop_type, season, seed_cost, fertilizer_cost, pesticide_cost, labor_cost, irrigation_cost, other_cost, total_expense, revenue, profit FROM financial_records WHERE user_id = %s"
            params = [user_id]
            if crop_filter != 'all':
                query += " AND LOWER(crop_type) = %s"
                params.append(crop_filter)
            query += " ORDER BY recorded_date DESC"
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            for r in rows:
                dt = parse_datetime(r.get('recorded_date'))
                if min_date and dt and dt < min_date:
                    continue
                dt_str = dt.strftime('%Y-%m-%d') if dt else ''
                writer.writerow([dt_str, r['crop_type'], r['season'], r['seed_cost'], r['fertilizer_cost'], r['pesticide_cost'], r['labor_cost'], r['irrigation_cost'], r['other_cost'], r['total_expense'], r['revenue'], r['profit']])
            filename = f'financial_report_user_{user_id}.csv'

        elif report_type == 'soil':
            writer.writerow(['Date', 'N (mg/kg)', 'P (mg/kg)', 'K (mg/kg)', 'pH Level', 'Temp (°C)', 'Humidity (%)', 'Rainfall (mm)', 'Health Status', 'Fertilizer Advice'])
            query = "SELECT created_at, n_content, p_content, k_content, ph, temperature, humidity, rainfall, health_status, fertilizer_recommendation FROM soil_reports WHERE user_id = %s ORDER BY created_at DESC"
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            for r in rows:
                dt = parse_datetime(r.get('created_at'))
                if min_date and dt and dt < min_date:
                    continue
                dt_str = dt.strftime('%Y-%m-%d') if dt else ''
                writer.writerow([dt_str, r['n_content'], r['p_content'], r['k_content'], r['ph'], r['temperature'], r['humidity'], r['rainfall'], r['health_status'], r['fertilizer_recommendation']])
            filename = f'soil_report_user_{user_id}.csv'

        elif report_type == 'sustainability':
            writer.writerow(['Date', 'Crop', 'Water Hours/Day', 'Fertilizer Type', 'Crop Rotation', 'Tillage Type', 'Solar Energy', 'Score', 'Grade', 'Label'])
            query = "SELECT created_at, crop, water_hours, fertilizer_type, crop_rotation, tillage_type, solar_energy, score, grade, label FROM sustainability_assessments WHERE user_id = %s"
            params = [user_id]
            if crop_filter != 'all':
                query += " AND LOWER(crop) = %s"
                params.append(crop_filter)
            query += " ORDER BY created_at DESC"
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            for r in rows:
                dt = parse_datetime(r.get('created_at'))
                if min_date and dt and dt < min_date:
                    continue
                dt_str = dt.strftime('%Y-%m-%d') if dt else ''
                writer.writerow([dt_str, r['crop'], r['water_hours'], r['fertilizer_type'], r['crop_rotation'], r['tillage_type'], 'Yes' if r['solar_energy'] else 'No', r['score'], r['grade'], r['label']])
            filename = f'sustainability_report_user_{user_id}.csv'

        else:  # yield
            writer.writerow(['Harvest Date', 'Crop', 'Season', 'Area (Acres)', 'Expected Yield (kg)', 'Actual Yield (kg)', 'Yield per Acre (kg/acre)', 'Status'])
            query = "SELECT harvest_date, crop_type, season, area_acres, expected_yield_kg, actual_yield_kg, yield_per_acre, status FROM crop_yield_records WHERE user_id = %s"
            params = [user_id]
            if crop_filter != 'all':
                query += " AND LOWER(crop_type) = %s"
                params.append(crop_filter)
            query += " ORDER BY harvest_date DESC"
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            for r in rows:
                dt = parse_datetime(r.get('harvest_date'))
                if min_date and dt and dt < min_date:
                    continue
                dt_str = dt.strftime('%Y-%m-%d') if dt else ''
                writer.writerow([dt_str, r['crop_type'], r['season'], r['area_acres'], r['expected_yield_kg'], r['actual_yield_kg'], r['yield_per_acre'], r['status']])
            filename = f'crop_yield_report_user_{user_id}.csv'

        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
