# app/api/denials.py

from flask import Blueprint, jsonify
from ..db import get_conn 

# 'denials_api' adında yeni bir blueprint oluşturuyoruz
denials_bp = Blueprint('denials_api', __name__, url_prefix='/api/denials')

# /api/denials/ adresine GET isteği
@denials_bp.route('/', methods=['GET'])
def get_all_denials():
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                # Sorumlu olduğun 'denials' tablosu
                cur.execute("SELECT * FROM denials;")
                denials = cur.fetchall()
                return jsonify(denials)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

    