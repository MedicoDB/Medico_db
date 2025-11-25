from flask import Blueprint, request, jsonify
from ..db import get_conn

bp = Blueprint("encounters", __name__)

@bp.get("/")
def list_encounters():
    limit = int(request.args.get("limit", 1000))
    search = request.args.get("search", "")
    
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                if search:
                    sql = """
                        SELECT e.encounter_id, e.patient_id, e.provider_id, e.visit_date, 
                               e.visit_type, e.department, e.reason_for_visit, e.diagnosis_code,
                               e.admission_type, e.discharge_date, e.length_of_stay, e.status,
                               p.first_name, p.last_name, pr.name as provider_name
                        FROM encounters e
                        LEFT JOIN patients p ON e.patient_id = p.patient_id
                        LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                        WHERE e.encounter_id LIKE %s 
                           OR p.first_name LIKE %s 
                           OR p.last_name LIKE %s
                           OR e.diagnosis_code LIKE %s
                        ORDER BY e.visit_date DESC
                        LIMIT %s
                    """
                    search_pattern = f"%{search}%"
                    cur.execute(sql, (search_pattern, search_pattern, search_pattern, search_pattern, limit))
                else:
                    sql = """
                        SELECT e.encounter_id, e.patient_id, e.provider_id, e.visit_date, 
                               e.visit_type, e.department, e.reason_for_visit, e.diagnosis_code,
                               e.admission_type, e.discharge_date, e.length_of_stay, e.status,
                               p.first_name, p.last_name, pr.name as provider_name
                        FROM encounters e
                        LEFT JOIN patients p ON e.patient_id = p.patient_id
                        LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                        ORDER BY e.visit_date DESC
                        LIMIT %s
                    """
                    cur.execute(sql, (limit,))
                
                encounters = cur.fetchall()
                return jsonify(encounters)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

