from flask import Blueprint, request, jsonify
from ..db import get_conn

bp = Blueprint("medications", __name__)

@bp.get("/")
def list_medications():
    limit = int(request.args.get("limit", 1000))
    search = request.args.get("search", "")
    
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                if search:
                    sql = """
                        SELECT m.medication_id, m.encounter_id, m.drug_name, m.dosage, 
                               m.route, m.frequency, m.duration, m.prescribed_date, 
                               m.prescriber_id, m.cost, p.first_name, p.last_name,
                               prov.name as prescriber_name
                        FROM medications m
                        LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                        LEFT JOIN patients p ON e.patient_id = p.patient_id
                        LEFT JOIN providers prov ON m.prescriber_id = prov.provider_id
                        WHERE m.drug_name LIKE %s 
                           OR p.first_name LIKE %s
                           OR p.last_name LIKE %s
                        ORDER BY m.prescribed_date DESC
                        LIMIT %s
                    """
                    search_pattern = f"%{search}%"
                    cur.execute(sql, (search_pattern, search_pattern, search_pattern, limit))
                else:
                    sql = """
                        SELECT m.medication_id, m.encounter_id, m.drug_name, m.dosage, 
                               m.route, m.frequency, m.duration, m.prescribed_date, 
                               m.prescriber_id, m.cost, p.first_name, p.last_name,
                               prov.name as prescriber_name
                        FROM medications m
                        LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                        LEFT JOIN patients p ON e.patient_id = p.patient_id
                        LEFT JOIN providers prov ON m.prescriber_id = prov.provider_id
                        ORDER BY m.prescribed_date DESC
                        LIMIT %s
                    """
                    cur.execute(sql, (limit,))
                
                medications = cur.fetchall()
                return jsonify(medications)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

