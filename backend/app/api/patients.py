from datetime import date
from flask import Blueprint, request, jsonify
from ..db import get_conn
from ..utils import generate_id, parse_date

bp = Blueprint("patients", __name__)


def _calculate_age(dob):
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - (
        (today.month, today.day) < (dob.month, dob.day)
    )

@bp.get("/")
def list_patients():
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    search = request.args.get("search", "").strip()

    filters = []
    params = []
    if search:
        like = f"%{search}%"
        filters.append(
            "(p.first_name LIKE %s OR p.last_name LIKE %s OR p.patient_id LIKE %s)"
        )
        params.extend([like, like, like])

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    data_sql = f"""
      WITH encounter_stats AS (
        SELECT patient_id,
               COUNT(encounter_id) AS encounter_count,
               MIN(visit_date) AS first_visit,
               MAX(visit_date) AS last_visit
        FROM encounters
        GROUP BY patient_id
      )
      SELECT p.patient_id, p.first_name, p.last_name, p.gender, p.ethnicity,
             p.insurance_type, p.marital_status, p.address, p.city, p.state,
             p.zip, p.phone, p.email, p.dob, p.age, p.registration_date,
             COALESCE(es.encounter_count, 0) AS encounter_count,
             es.first_visit, es.last_visit
      FROM patients p
      LEFT JOIN encounter_stats es ON es.patient_id = p.patient_id
      {where_clause}
      ORDER BY encounter_count DESC
      LIMIT %s OFFSET %s;
    """

    count_sql = f"""
      SELECT COUNT(*) AS total
      FROM patients p
      {where_clause};
    """

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(count_sql, params)
                total = cur.fetchone()["total"]

                cur.execute(data_sql, params + [limit, offset])
                rows = cur.fetchall()
                return jsonify({"data": rows, "total": total})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
def create_patient():
    data = request.get_json(silent=True) or {}
    first_name = data.get("first_name")
    last_name = data.get("last_name")

    if not first_name or not last_name:
        return jsonify({"error": "first_name and last_name are required"}), 400

    patient_id = data.get("patient_id") or generate_id("PAT")
    dob = parse_date(data.get("dob"))
    registration_date = parse_date(data.get("registration_date"))
    age = data.get("age")
    if age is None:
        age = _calculate_age(dob)

    payload = (
        patient_id,
        first_name,
        last_name,
        dob,
        age,
        data.get("gender"),
        data.get("ethnicity"),
        data.get("insurance_type"),
        data.get("marital_status"),
        data.get("address"),
        data.get("city"),
        data.get("state"),
        data.get("zip"),
        data.get("phone"),
        data.get("email"),
        registration_date,
    )

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(
                    """
                    INSERT INTO patients (
                        patient_id, first_name, last_name, dob, age, gender,
                        ethnicity, insurance_type, marital_status, address,
                        city, state, zip, phone, email, registration_date
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s
                    )
                    """,
                    payload,
                )
                conn.commit()
                cur.execute(
                    """
                    SELECT patient_id, first_name, last_name, age, gender,
                           insurance_type, registration_date
                    FROM patients
                    WHERE patient_id = %s
                    """,
                    (patient_id,),
                )
                created = cur.fetchone()
                return jsonify(created), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.delete("/<patient_id>")
def delete_patient(patient_id):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM patients WHERE patient_id = %s", (patient_id,))
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Patient not found"}), 404
                return jsonify({"message": "Patient deleted"}), 200
    except Exception as e:
        return jsonify(
            {
                "error": "Unable to delete patient. Ensure there are no linked encounters or billing records.",
                "details": str(e),
            }
        ), 400


@bp.put("/<patient_id>")
def update_patient(patient_id):
    data = request.get_json(silent=True) or {}
    allowed_fields = {
        "first_name": lambda v: v,
        "last_name": lambda v: v,
        "dob": parse_date,
        "age": lambda v: int(v) if v is not None else None,
        "gender": lambda v: v,
        "ethnicity": lambda v: v,
        "insurance_type": lambda v: v,
        "marital_status": lambda v: v,
        "address": lambda v: v,
        "city": lambda v: v,
        "state": lambda v: v,
        "zip": lambda v: v,
        "phone": lambda v: v,
        "email": lambda v: v,
        "registration_date": parse_date,
    }

    updates = []
    values = []

    for field, parser in allowed_fields.items():
        if field in data:
            updates.append(f"{field} = %s")
            values.append(parser(data[field]))

    if "dob" in data and "age" not in data:
        dob = parse_date(data.get("dob"))
        values[updates.index("dob = %s")] = dob
        calculated_age = _calculate_age(dob)
        if calculated_age is not None:
            updates.append("age = %s")
            values.append(calculated_age)

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                sql = f"UPDATE patients SET {', '.join(updates)} WHERE patient_id = %s"
                cur.execute(sql, values + [patient_id])
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Patient not found"}), 404
                cur.execute(
                    """
                    SELECT patient_id, first_name, last_name, age, gender,
                           insurance_type, registration_date
                    FROM patients
                    WHERE patient_id = %s
                    """,
                    (patient_id,),
                )
                return jsonify(cur.fetchone())
    except Exception as e:
        return jsonify({"error": str(e)}), 400