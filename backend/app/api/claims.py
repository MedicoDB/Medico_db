# app/api/claims.py

from flask import Blueprint, jsonify, request
from ..db import get_conn
from ..utils import generate_id, parse_datetime

# 'claims_api' adında yeni bir blueprint oluşturuyoruz
claims_bp = Blueprint('claims_api', __name__, url_prefix='/api/claims')

# /api/claims/ adresine GET isteği
@claims_bp.route('/', methods=['GET'])
def get_all_claims():
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    search = request.args.get("search", "").strip()

    filters = ""
    params = []
    if search:
        like = f"%{search}%"
        filters = """
            WHERE billing_id LIKE %s
               OR patient_id LIKE %s
               OR encounter_id LIKE %s
               OR claim_status LIKE %s
        """
        params.extend([like, like, like, like])

    data_sql = f"""
        SELECT * FROM claims_and_billing
        {filters}
        ORDER BY claim_billing_date DESC
        LIMIT %s OFFSET %s
    """

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM claims_and_billing
        {filters}
    """

    summary_sql = """
        SELECT 
            SUM(CASE WHEN claim_status = 'Paid' THEN 1 ELSE 0 END) AS paid_count,
            SUM(CASE WHEN claim_status != 'Paid' THEN 1 ELSE 0 END) AS unpaid_count,
            COALESCE(SUM(billed_amount), 0) AS total_billed,
            COALESCE(SUM(CASE WHEN claim_status = 'Paid' THEN billed_amount ELSE 0 END), 0) AS paid_billed,
            COALESCE(SUM(CASE WHEN claim_status != 'Paid' THEN billed_amount ELSE 0 END), 0) AS unpaid_billed
        FROM claims_and_billing
    """

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(count_sql, params)
                total = cur.fetchone()["total"]

                cur.execute(data_sql, params + [limit, offset])
                claims = cur.fetchall()

                cur.execute(summary_sql)
                summary = cur.fetchone()

                return jsonify({"data": claims, "total": total, "summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@claims_bp.route('/', methods=['POST'])
def create_claim():
    data = request.get_json(silent=True) or {}
    patient_id = data.get("patient_id")
    encounter_id = data.get("encounter_id")

    if not patient_id or not encounter_id:
        return jsonify({"error": "patient_id and encounter_id are required"}), 400

    billing_id = data.get("billing_id") or generate_id("BILL")
    claim_id = data.get("claim_id") or generate_id("CLM")
    billing_date = parse_datetime(data.get("claim_billing_date"))

    payload = (
        billing_id,
        patient_id,
        encounter_id,
        data.get("insurance_provider"),
        data.get("payment_method"),
        claim_id,
        billing_date,
        data.get("billed_amount", 0),
        data.get("paid_amount", 0),
        data.get("claim_status", "Pending"),
        data.get("denial_reason"),
    )

    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(
                    """
                    INSERT INTO claims_and_billing (
                        billing_id, patient_id, encounter_id, insurance_provider, payment_method,
                        claim_id, claim_billing_date, billed_amount, paid_amount, claim_status,
                        denial_reason
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s
                    )
                    """,
                    payload,
                )
                conn.commit()
                cur.execute(
                    "SELECT * FROM claims_and_billing WHERE billing_id = %s",
                    (billing_id,),
                )
                claim = cur.fetchone()
                return jsonify(claim), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@claims_bp.route('/patient/<patient_id>', methods=['GET'])
def get_claims_by_patient(patient_id):
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                # claims_and_billing tablosunda patient_id sütunu var
                query = "SELECT * FROM claims_and_billing WHERE patient_id = %s;"
                cur.execute(query, (patient_id,))
                claims = cur.fetchall() # Bir hastanın birden çok faturası olabilir -> fetchall
                return jsonify(claims)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@claims_bp.route('/<billing_id>', methods=['GET'])
def get_claim_by_id(billing_id):
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                # Tablonun Primary Key'i: billing_id
                query = "SELECT * FROM claims_and_billing WHERE billing_id = %s;"
                cur.execute(query, (billing_id,))
                claim = cur.fetchone() # Tek kayıt -> fetchone
                
                if claim:
                    return jsonify(claim)
                else:
                    return jsonify({"error": "Claim not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@claims_bp.route('/<billing_id>', methods=['DELETE'])
def delete_claim(billing_id):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM claims_and_billing WHERE billing_id = %s", (billing_id,))
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Claim not found"}), 404
                return jsonify({"message": "Claim deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@claims_bp.route('/<billing_id>', methods=['PUT'])
def update_claim(billing_id):
    data = request.get_json(silent=True) or {}
    allowed_fields = {
        "patient_id": lambda v: v,
        "encounter_id": lambda v: v,
        "insurance_provider": lambda v: v,
        "payment_method": lambda v: v,
        "claim_id": lambda v: v,
        "claim_billing_date": parse_datetime,
        "billed_amount": lambda v: float(v) if v is not None else None,
        "paid_amount": lambda v: float(v) if v is not None else None,
        "claim_status": lambda v: v,
        "denial_reason": lambda v: v,
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
                sql = f"UPDATE claims_and_billing SET {', '.join(updates)} WHERE billing_id = %s"
                cur.execute(sql, values + [billing_id])
                conn.commit()
                if cur.rowcount == 0:
                    return jsonify({"error": "Claim not found"}), 404
                cur.execute("SELECT * FROM claims_and_billing WHERE billing_id = %s", (billing_id,))
                return jsonify(cur.fetchone())
    except Exception as e:
        return jsonify({"error": str(e)}), 400