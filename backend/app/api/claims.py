# app/api/claims.py

from flask import Blueprint, jsonify
from app.db import get_db_connection 

# 'claims_api' adında yeni bir blueprint oluşturuyoruz
claims_bp = Blueprint('claims_api', __name__, url_prefix='/api/claims')

# /api/claims/ adresine GET isteği
@claims_bp.route('/', methods=['GET'])
def get_all_claims():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Sorumlu olduğun 'claims_and_billing' tablosu
        cur.execute("SELECT * FROM claims_and_billing;")
        claims = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify(claims)
    except Exception as e:
        return jsonify({"error": str(e)}), 500