from flask import Blueprint, request, jsonify
from ..db import get_conn
from ..utils import generate_id, parse_date

bp = Blueprint("procedures", __name__)

@bp.get("/")
def list_procedures():
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    search = request.args.get("search", "").strip()
    
    filters = ""
    params = []
    if search:
        like = f"%{search}%"
        filters = """
            WHERE pr.procedure_code LIKE %s
               OR pr.procedure_description LIKE %s
               OR p.first_name LIKE %s
               OR p.last_name LIKE %s
        """
        params.extend([like, like, like, like])
    
    data_sql = f"""
        SELECT pr.procedure_id, pr.encounter_id, pr.procedure_code, 
               pr.procedure_description, pr.procedure_date, pr.provider_id,
               pr.procedure_cost, p.first_name, p.last_name, 
               prov.name as provider_name
        FROM procedures pr
        LEFT JOIN encounters e ON pr.encounter_id = e.encounter_id
        LEFT JOIN patients p ON e.patient_id = p.patient_id
        LEFT JOIN providers prov ON pr.provider_id = prov.provider_id
        {filters}
        ORDER BY pr.procedure_date DESC
        LIMIT %s OFFSET %s
    """

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM procedures pr
        LEFT JOIN encounters e ON pr.encounter_id = e.encounter_id
        LEFT JOIN patients p ON e.patient_id = p.patient_id
        {filters}
    """
    
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(count_sql, params)
                total = cur.fetchone()["total"]

                cur.execute(data_sql, params + [limit, offset])
                procedures = cur.fetchall()
                return jsonify({"data": procedures, "total": total})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
def create_procedure():
    data = request.get_json(silent=True) or {}
    encounter_id = data.get("encounter_id")
    if not encounter_id:
        return jsonify({"error": "encounter_id is required"}), 400

    procedure_id = data.get("procedure_id") or generate_id("PROC")
    procedure_date = parse_date(data.get("procedure_date"))

    payload = (
        procedure_id,
        encounter_id,
        data.get("procedure_code"),
        data.get("procedure_description"),
        procedure_date,
        data.get("provider_id"),
        data.get("procedure_cost", 0),
    )

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(
                    """
                    INSERT INTO procedures (
                        procedure_id, encounter_id, procedure_code,
                        procedure_description, procedure_date, provider_id,
                        procedure_cost
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    payload,
                )
                conn.commit()
                cur.execute(
                    """
                    SELECT pr.*, p.first_name, p.last_name
                    FROM procedures pr
                    LEFT JOIN encounters e ON pr.encounter_id = e.encounter_id
                    LEFT JOIN patients p ON e.patient_id = p.patient_id
                    WHERE pr.procedure_id = %s
                    """,
                    (procedure_id,),
                )
                created = cur.fetchone()
                return jsonify(created), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.delete("/<procedure_id>")
def delete_procedure(procedure_id):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM procedures WHERE procedure_id = %s", (procedure_id,))
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Procedure not found"}), 404
                return jsonify({"message": "Procedure deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.put("/<procedure_id>")
def update_procedure(procedure_id):
    data = request.get_json(silent=True) or {}
    allowed_fields = {
        "encounter_id": lambda v: v,
        "procedure_code": lambda v: v,
        "procedure_description": lambda v: v,
        "procedure_date": parse_date,
        "provider_id": lambda v: v,
        "procedure_cost": lambda v: float(v) if v is not None else None,
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
                sql = f"UPDATE procedures SET {', '.join(updates)} WHERE procedure_id = %s"
                cur.execute(sql, values + [procedure_id])
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Procedure not found"}), 404
                cur.execute(
                    """
                    SELECT pr.procedure_id, pr.encounter_id, pr.procedure_code, 
                           pr.procedure_description, pr.procedure_date, pr.provider_id,
                           pr.procedure_cost, p.first_name, p.last_name, 
                           prov.name as provider_name
                    FROM procedures pr
                    LEFT JOIN encounters e ON pr.encounter_id = e.encounter_id
                    LEFT JOIN patients p ON e.patient_id = p.patient_id
                    LEFT JOIN providers prov ON pr.provider_id = prov.provider_id
                    WHERE pr.procedure_id = %s
                    """,
                    (procedure_id,),
                )
                return jsonify(cur.fetchone())
    except Exception as e:
        return jsonify({"error": str(e)}), 400