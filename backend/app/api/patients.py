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