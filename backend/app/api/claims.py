# app/api/claims.py

from flask import Blueprint, jsonify
from ..db import get_conn 

# 'claims_api' adında yeni bir blueprint oluşturuyoruz
claims_bp = Blueprint('claims_api', __name__, url_prefix='/api/claims')

# /api/claims/ adresine GET isteği
@claims_bp.route('/', methods=['GET'])
def get_all_claims():
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                # Sorumlu olduğun 'claims_and_billing' tablosu
                cur.execute("SELECT * FROM claims_and_billing;")
                claims = cur.fetchall()
                return jsonify(claims)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


# getting informations by patients ids'
@claims_bp.route('/patient/<int:patient_id>', methods=['GET'])
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
    


@claims_bp.route('/<int:id>', methods=['GET'])
def get_claim_by_id(id):
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                # Tablonun Primary Key'i: billing_id
                query = "SELECT * FROM claims_and_billing WHERE billing_id = %s;"
                cur.execute(query, (id,))
                claim = cur.fetchone() # Tek kayıt -> fetchone
                
                if claim:
                    return jsonify(claim)
                else:
                    return jsonify({"error": "Claim not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500