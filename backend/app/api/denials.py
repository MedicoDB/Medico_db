from flask import Blueprint, request, jsonify
from ..db import get_conn
from ..utils import generate_id, parse_date

denials_bp = Blueprint('denials_api', __name__, url_prefix='/api/denials')

@denials_bp.route('/', methods=['GET'])
def get_all_denials():
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    search = request.args.get("search", "").strip()

    filters = ""
    params = []
    if search:
        like = f"%{search}%"
        filters = """
            WHERE denial_id LIKE %s
               OR claim_id LIKE %s
               OR denial_reason_code LIKE %s
               OR final_outcome LIKE %s
        """
        params.extend([like, like, like, like])

    data_sql = f"""
        SELECT * FROM denials
        {filters}
        ORDER BY denial_date DESC
        LIMIT %s OFFSET %s
    """

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM denials
        {filters}
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


@denials_bp.route('/', methods=['POST'])
def create_denial():
    data = request.get_json(silent=True) or {}
    claim_id = data.get("claim_id")
    if not claim_id:
        return jsonify({"error": "claim_id is required"}), 400

    denial_id = data.get("denial_id") or generate_id("DEN")
    denial_date = parse_date(data.get("denial_date"))
    appeal_resolution_date = parse_date(data.get("appeal_resolution_date"))

    payload = (
        claim_id,
        denial_id,
        data.get("denial_reason_code"),
        data.get("denial_reason_description"),
        data.get("denied_amount", 0),
        denial_date,
        data.get("appeal_filed"),
        data.get("appeal_status"),
        appeal_resolution_date,
        data.get("final_outcome"),
    )

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(
                    """
                    INSERT INTO denials (
                        claim_id, denial_id, denial_reason_code, denial_reason_description,
                        denied_amount, denial_date, appeal_filed, appeal_status,
                        appeal_resolution_date, final_outcome
                    ) VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s
                    )
                    """,
                    payload,
                )
                conn.commit()
                cur.execute("SELECT * FROM denials WHERE denial_id = %s", (denial_id,))
                created = cur.fetchone()
                return jsonify(created), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@denials_bp.route('/<denial_id>', methods=['DELETE'])
def delete_denial(denial_id):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM denials WHERE denial_id = %s", (denial_id,))
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Denial not found"}), 404
                return jsonify({"message": "Denial deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@denials_bp.route('/<denial_id>', methods=['PUT'])
def update_denial(denial_id):
    data = request.get_json(silent=True) or {}
    allowed_fields = {
        "claim_id": lambda v: v,
        "denial_reason_code": lambda v: v,
        "denial_reason_description": lambda v: v,
        "denied_amount": lambda v: float(v) if v is not None else None,
        "denial_date": parse_date,
        "appeal_filed": lambda v: v,
        "appeal_status": lambda v: v,
        "appeal_resolution_date": parse_date,
        "final_outcome": lambda v: v,
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
                sql = f"UPDATE denials SET {', '.join(updates)} WHERE denial_id = %s"
                cur.execute(sql, values + [denial_id])
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Denial not found"}), 404
                cur.execute("SELECT * FROM denials WHERE denial_id = %s", (denial_id,))
                return jsonify(cur.fetchone())
    except Exception as e:
        return jsonify({"error": str(e)}), 400