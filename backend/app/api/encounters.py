from datetime import date
from flask import Blueprint, request, jsonify
from ..db import get_conn
from ..utils import generate_id, parse_date

bp = Blueprint("encounters", __name__)

@bp.get("/")
def list_encounters():
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    search = request.args.get("search", "").strip()

    search_clause = ""
    params = []
    if search:
        like = f"%{search}%"
        search_clause = """
            WHERE e.encounter_id LIKE %s
               OR p.first_name LIKE %s
               OR p.last_name LIKE %s
               OR e.diagnosis_code LIKE %s
        """
        params.extend([like, like, like, like])

    data_sql = f"""
        SELECT e.encounter_id, e.patient_id, e.provider_id, e.visit_date, 
               e.visit_type, e.department, e.reason_for_visit, e.diagnosis_code,
               e.admission_type, e.discharge_date, e.length_of_stay, e.status,
               p.first_name, p.last_name, pr.name as provider_name
        FROM encounters e
        LEFT JOIN patients p ON e.patient_id = p.patient_id
        LEFT JOIN providers pr ON e.provider_id = pr.provider_id
        {search_clause}
        ORDER BY e.visit_date DESC
        LIMIT %s OFFSET %s
    """

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM encounters e
        LEFT JOIN patients p ON e.patient_id = p.patient_id
        {search_clause}
    """
    
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(count_sql, params)
                total = cur.fetchone()["total"]

                cur.execute(data_sql, params + [limit, offset])
                encounters = cur.fetchall()
                return jsonify({"data": encounters, "total": total})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
def create_encounter():
    data = request.get_json(silent=True) or {}
    patient_id = data.get("patient_id")
    provider_id = data.get("provider_id")

    if not patient_id or not provider_id:
        return jsonify({"error": "patient_id and provider_id are required"}), 400

    encounter_id = data.get("encounter_id") or generate_id("ENC")
    visit_date = parse_date(data.get("visit_date")) or date.today()
    discharge_date = parse_date(data.get("discharge_date"))

    payload = (
        encounter_id,
        patient_id,
        provider_id,
        visit_date,
        data.get("visit_type"),
        data.get("department"),
        data.get("reason_for_visit"),
        data.get("diagnosis_code"),
        data.get("admission_type"),
        discharge_date,
        data.get("length_of_stay", 0),
        data.get("status", "Completed"),
        bool(data.get("readmitted_flag", False)),
    )

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(
                    """
                    INSERT INTO encounters (
                        encounter_id, patient_id, provider_id, visit_date,
                        visit_type, department, reason_for_visit, diagnosis_code,
                        admission_type, discharge_date, length_of_stay, status,
                        readmitted_flag
                    ) VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s
                    )
                    """,
                    payload,
                )
                conn.commit()
                cur.execute(
                    """
                    SELECT e.*, p.first_name, p.last_name
                    FROM encounters e
                    LEFT JOIN patients p ON e.patient_id = p.patient_id
                    WHERE e.encounter_id = %s
                    """,
                    (encounter_id,),
                )
                created = cur.fetchone()
                return jsonify(created), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.delete("/<encounter_id>")
def delete_encounter(encounter_id):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM encounters WHERE encounter_id = %s", (encounter_id,))
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Encounter not found"}), 404
                return jsonify({"message": "Encounter deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.put("/<encounter_id>")
def update_encounter(encounter_id):
    data = request.get_json(silent=True) or {}
    allowed_fields = {
        "patient_id": lambda v: v,
        "provider_id": lambda v: v,
        "visit_date": parse_date,
        "visit_type": lambda v: v,
        "department": lambda v: v,
        "reason_for_visit": lambda v: v,
        "diagnosis_code": lambda v: v,
        "admission_type": lambda v: v,
        "discharge_date": parse_date,
        "length_of_stay": lambda v: int(v) if v is not None else None,
        "status": lambda v: v,
        "readmitted_flag": lambda v: bool(v),
    }

    updates = []
    values = []
    for field, parser in allowed_fields.items():
        if field in data:
            updates.append(f"{field} = %s")
            values.append(parser(data[field]))

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                sql = f"UPDATE encounters SET {', '.join(updates)} WHERE encounter_id = %s"
                cur.execute(sql, values + [encounter_id])
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Encounter not found"}), 404
                cur.execute(
                    """
                    SELECT e.encounter_id, e.patient_id, e.provider_id, e.visit_date, 
                           e.visit_type, e.department, e.reason_for_visit, e.diagnosis_code,
                           e.admission_type, e.discharge_date, e.length_of_stay, e.status,
                           p.first_name, p.last_name, pr.name as provider_name
                    FROM encounters e
                    LEFT JOIN patients p ON e.patient_id = p.patient_id
                    LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                    WHERE e.encounter_id = %s
                    """,
                    (encounter_id,),
                )
                return jsonify(cur.fetchone())
    except Exception as e:
        return jsonify({"error": str(e)}), 400