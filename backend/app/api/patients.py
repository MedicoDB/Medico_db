from flask import Blueprint, request, jsonify
from ..db import get_conn

bp = Blueprint("patients", __name__)

@bp.get("/")
def list_patients():
    limit = int(request.args.get("limit", 500000))
    sql = """
      SELECT p.patient_id, p.first_name, p.last_name,
             COUNT(e.encounter_id) AS encounter_count,
             MIN(e.visit_date) AS first_visit,
             MAX(e.visit_date) AS last_visit
      FROM patients p
      LEFT JOIN encounters e ON e.patient_id = p.patient_id
      GROUP BY p.patient_id, p.first_name, p.last_name
      ORDER BY encounter_count DESC
      LIMIT %s;
    """ # SQL query to fetch patient data with encounter counts decreasing order
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (limit,))
                
                if cur.description is None:
                    return jsonify([])

                cols = [d[0] for d in cur.description]
                return jsonify([dict(zip(cols, r)) for r in cur.fetchall()])
    except Exception as e:

        return jsonify({"error": str(e)}), 500

@bp.get("/<patient_id>")
def get_patient_details(patient_id):
    """Get detailed information about a specific patient"""
    sql = """
        SELECT 
            p.*,
            COUNT(DISTINCT e.encounter_id) as total_encounters,
            COUNT(DISTINCT pr.procedure_id) as total_procedures,
            COUNT(DISTINCT m.medication_id) as total_medications,
            MAX(e.visit_date) as last_visit_date
        FROM patients p
        LEFT JOIN encounters e ON p.patient_id = e.patient_id
        LEFT JOIN procedures pr ON e.encounter_id = pr.encounter_id
        LEFT JOIN medications m ON e.encounter_id = m.encounter_id
        WHERE p.patient_id = %s
        GROUP BY p.patient_id
    """
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(sql, (patient_id,))
                result = cur.fetchone()
                if not result:
                    return jsonify({"error": "Patient not found"}), 404
                return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.get("/<patient_id>/encounters")
def get_patient_encounters(patient_id):
    """Get all encounters for a specific patient"""
    sql = """
        SELECT 
            e.*,
            p.name as provider_name,
            COUNT(pr.procedure_id) as procedure_count,
            COUNT(m.medication_id) as medication_count
        FROM encounters e
        LEFT JOIN providers p ON e.provider_id = p.provider_id
        LEFT JOIN procedures pr ON e.encounter_id = pr.encounter_id
        LEFT JOIN medications m ON e.encounter_id = m.encounter_id
        WHERE e.patient_id = %s
        GROUP BY e.encounter_id
        ORDER BY e.visit_date DESC
    """
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(sql, (patient_id,))
                encounters = cur.fetchall()
                return jsonify(encounters)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.get("/search")
def search_patients():
    """Search patients by name or ID"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({"error": "Search query is required"}), 400

    sql = """
        SELECT 
            p.patient_id, 
            p.first_name,
            p.last_name,
            p.dob,
            p.gender,
            COUNT(e.encounter_id) as encounter_count,
            MAX(e.visit_date) as last_visit
        FROM patients p
        LEFT JOIN encounters e ON p.patient_id = e.patient_id
        WHERE p.patient_id LIKE %s
           OR p.first_name LIKE %s
           OR p.last_name LIKE %s
        GROUP BY p.patient_id
        LIMIT 20
    """
    search_term = f"%{query}%"
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(sql, (search_term, search_term, search_term))
                results = cur.fetchall()
                return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500