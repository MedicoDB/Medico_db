"""
Dashboard API - Models and Routes
Location: backend/app/api/dashboard.py
"""
from flask import Blueprint, request, jsonify
from ..db import get_db_connection, get_db_cursor
from mysql.connector import Error

dashboard_bp = Blueprint('dashboard', __name__)

def _value_or_none(value):
    return value.strip() if value and value.strip() else None

class DashboardModel:
    """Handles complex queries for the dashboard."""
    
    @staticmethod
    def get_stats():
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT 
                    COUNT(DISTINCT e.encounter_id) as total_encounters,
                    COUNT(DISTINCT p.patient_id) as total_patients,
                    COUNT(DISTINCT pr.provider_id) as total_providers,
                    SUM(cb.billed_amount) as total_billed
                FROM encounters e
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                LEFT JOIN claims_and_billing cb ON e.encounter_id = cb.encounter_id
            """
            cursor.execute(query)
            return cursor.fetchone()
        except Error as e:
            print(f"Error fetching stats: {e}")
            return {}
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_activity(limit=50, search=None, filters=None, sort_by="visit_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT e.encounter_id, e.visit_date, e.visit_type, e.department, e.status as encounter_status,
                    p.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
                    pr.provider_id, pr.name as provider_name,
                    d.diagnosis_code, d.diagnosis_description,
                    i.name as insurance_name, cb.billed_amount, cb.claim_status
                FROM encounters e
                INNER JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                LEFT JOIN diagnoses d ON e.encounter_id = d.encounter_id AND d.primary_flag = 1
                LEFT JOIN insurers i ON p.insurance_type = i.code
                LEFT JOIN claims_and_billing cb ON e.encounter_id = cb.encounter_id
                WHERE 1 = 1
            """
            params = []
            if search:
                like_term = f"%{search}%"
                query += " AND (e.encounter_id LIKE %s OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR pr.name LIKE %s OR d.diagnosis_code LIKE %s OR i.name LIKE %s OR e.department LIKE %s)"
                params.extend([like_term] * 6)

            filters = filters or {}
            if filters.get('encounter_id'): query += " AND e.encounter_id LIKE %s"; params.append(f"%{filters['encounter_id']}%")
            if filters.get('patient_name'): query += " AND CONCAT(p.first_name, ' ', p.last_name) LIKE %s"; params.append(f"%{filters['patient_name']}%")
            if filters.get('provider_name'): query += " AND pr.name LIKE %s"; params.append(f"%{filters['provider_name']}%")
            if filters.get('department'): query += " AND e.department LIKE %s"; params.append(f"%{filters['department']}%")
            if filters.get('visit_date'): query += " AND e.visit_date = %s"; params.append(filters['visit_date'])
            if filters.get('status'): query += " AND e.status = %s"; params.append(filters['status'])

            sort_map = {
                "encounter_id": "e.encounter_id", 
                "visit_date": "e.visit_date", 
                "patient_name": "p.first_name", 
                "provider_name": "pr.name", 
                "department": "e.department", 
                "diagnosis": "d.diagnosis_code", 
                "insurance": "i.name", 
                "billed_amount": "cb.billed_amount", 
                "status": "e.status"
            }
            
            sort_col = sort_map.get(sort_by, "e.visit_date")
            sort_d = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            query += f" ORDER BY {sort_col} {sort_d} LIMIT %s"
            params.append(limit)

            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching dashboard activity: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

# --- ROUTES ---

@dashboard_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    """
    API Endpoint for React Dashboard.
    Returns JSON with { stats: {...}, activity: [...] }
    """
    search_query = request.args.get('q', '').strip()
    sort_by = request.args.get('sort', 'visit_date')
    direction = request.args.get('direction', 'desc').lower()
    
    filters = {
        'encounter_id': _value_or_none(request.args.get('encounter_id')),
        'patient_name': _value_or_none(request.args.get('patient_name')),
        'provider_name': _value_or_none(request.args.get('provider_name')),
        'department': _value_or_none(request.args.get('department')),
        'visit_date': _value_or_none(request.args.get('visit_date')),
        'status': _value_or_none(request.args.get('status'))
    }

    try:
        stats = DashboardModel.get_stats()
        recent_activity = DashboardModel.get_activity(
            limit=50, 
            search=search_query or None, 
            filters=filters, 
            sort_by=sort_by, 
            sort_dir=direction
        )
        
        return jsonify({
            "success": True,
            "data": {
                "stats": stats,
                "recent_activity": recent_activity
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500