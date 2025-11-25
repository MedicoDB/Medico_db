from flask import Blueprint, request, jsonify
from ..db import get_conn

bp = Blueprint("procedures", __name__)

@bp.get("/")
def list_procedures():
    limit = int(request.args.get("limit", 1000))
    search = request.args.get("search", "")
    
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                if search:
                    sql = """
                        SELECT pr.procedure_id, pr.encounter_id, pr.procedure_code, 
                               pr.procedure_description, pr.procedure_date, pr.provider_id,
                               pr.procedure_cost, p.first_name, p.last_name, 
                               prov.name as provider_name
                        FROM procedures pr
                        LEFT JOIN encounters e ON pr.encounter_id = e.encounter_id
                        LEFT JOIN patients p ON e.patient_id = p.patient_id
                        LEFT JOIN providers prov ON pr.provider_id = prov.provider_id
                        WHERE pr.procedure_code LIKE %s 
                           OR pr.procedure_description LIKE %s
                           OR p.first_name LIKE %s
                           OR p.last_name LIKE %s
                        ORDER BY pr.procedure_date DESC
                        LIMIT %s
                    """
                    search_pattern = f"%{search}%"
                    cur.execute(sql, (search_pattern, search_pattern, search_pattern, search_pattern, limit))
                else:
                    sql = """
                        SELECT pr.procedure_id, pr.encounter_id, pr.procedure_code, 
                               pr.procedure_description, pr.procedure_date, pr.provider_id,
                               pr.procedure_cost, p.first_name, p.last_name, 
                               prov.name as provider_name
                        FROM procedures pr
                        LEFT JOIN encounters e ON pr.encounter_id = e.encounter_id
                        LEFT JOIN patients p ON e.patient_id = p.patient_id
                        LEFT JOIN providers prov ON pr.provider_id = prov.provider_id
                        ORDER BY pr.procedure_date DESC
                        LIMIT %s
                    """
                    cur.execute(sql, (limit,))
                
                procedures = cur.fetchall()
                return jsonify(procedures)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

