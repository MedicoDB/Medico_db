from flask import Blueprint, request, jsonify
from ..db import get_conn
from ..utils import generate_id, parse_date

bp = Blueprint("medications", __name__)

@bp.get("/")
def list_medications():
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    search = request.args.get("search", "").strip()
    
    filters = ""
    params = []
    if search:
        like = f"%{search}%"
        filters = """
            WHERE m.drug_name LIKE %s
               OR p.first_name LIKE %s
               OR p.last_name LIKE %s
               OR m.medication_id LIKE %s
        """
        params.extend([like, like, like, like])
    
    data_sql = f"""
        SELECT m.medication_id, m.encounter_id, m.drug_name, m.dosage, 
               m.route, m.frequency, m.duration, m.prescribed_date, 
               m.prescriber_id, m.cost, p.first_name, p.last_name,
               prov.name as prescriber_name
        FROM medications m
        LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
        LEFT JOIN patients p ON e.patient_id = p.patient_id
        LEFT JOIN providers prov ON m.prescriber_id = prov.provider_id
        {filters}
        ORDER BY m.prescribed_date DESC
        LIMIT %s OFFSET %s
    """

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM medications m
        LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
        LEFT JOIN patients p ON e.patient_id = p.patient_id
        {filters}
    """
    
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(count_sql, params)
                total = cur.fetchone()["total"]

                cur.execute(data_sql, params + [limit, offset])
                medications = cur.fetchall()
                return jsonify({"data": medications, "total": total})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
def create_medication():
    data = request.get_json(silent=True) or {}
    encounter_id = data.get("encounter_id")
    if not encounter_id:
        return jsonify({"error": "encounter_id is required"}), 400

    medication_id = data.get("medication_id") or generate_id("MED")
    prescribed_date = parse_date(data.get("prescribed_date"))

    payload = (
        medication_id,
        encounter_id,
        data.get("drug_name"),
        data.get("dosage"),
        data.get("route"),
        data.get("frequency"),
        data.get("duration"),
        prescribed_date,
        data.get("prescriber_id"),
        data.get("cost", 0),
    )

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(
                    """
                    INSERT INTO medications (
                        medication_id, encounter_id, drug_name, dosage, route,
                        frequency, duration, prescribed_date, prescriber_id, cost
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                    """,
                    payload,
                )
                conn.commit()
                cur.execute(
                    """
                    SELECT m.*, p.first_name, p.last_name
                    FROM medications m
                    LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                    LEFT JOIN patients p ON e.patient_id = p.patient_id
                    WHERE m.medication_id = %s
                    """,
                    (medication_id,),
                )
                created = cur.fetchone()
                return jsonify(created), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.delete("/<medication_id>")
def delete_medication(medication_id):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM medications WHERE medication_id = %s", (medication_id,))
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Medication not found"}), 404
                return jsonify({"message": "Medication deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.put("/<medication_id>")
def update_medication(medication_id):
    data = request.get_json(silent=True) or {}
    allowed_fields = {
        "encounter_id": lambda v: v,
        "drug_name": lambda v: v,
        "dosage": lambda v: v,
        "route": lambda v: v,
        "frequency": lambda v: v,
        "duration": lambda v: v,
        "prescribed_date": parse_date,
        "prescriber_id": lambda v: v,
        "cost": lambda v: float(v) if v is not None else None,
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
                sql = f"UPDATE medications SET {', '.join(updates)} WHERE medication_id = %s"
                cur.execute(sql, values + [medication_id])
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Medication not found"}), 404
                cur.execute(
                    """
                    SELECT m.medication_id, m.encounter_id, m.drug_name, m.dosage, 
                           m.route, m.frequency, m.duration, m.prescribed_date, 
                           m.prescriber_id, m.cost, p.first_name, p.last_name,
                           prov.name as prescriber_name
                    FROM medications m
                    LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                    LEFT JOIN patients p ON e.patient_id = p.patient_id
                    LEFT JOIN providers prov ON m.prescriber_id = prov.provider_id
                    WHERE m.medication_id = %s
                    """,
                    (medication_id,),
                )
                return jsonify(cur.fetchone())
    except Exception as e:
        return jsonify({"error": str(e)}), 400