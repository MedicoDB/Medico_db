# app/api/denials.py

from flask import Blueprint, jsonify
from app.db import get_db_connection 

# 'denials_api' adında yeni bir blueprint oluşturuyoruz
denials_bp = Blueprint('denials_api', __name__, url_prefix='/api/denials')

# /api/denials/ adresine GET isteği
@denials_bp.route('/', methods=['GET'])
def get_all_denials():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Sorumlu olduğun 'denials' tablosu
        cur.execute("SELECT * FROM denials;")
        denials = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify(denials)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

    