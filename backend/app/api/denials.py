from flask import Blueprint, jsonify, request
from ..db import get_conn

# 'denials_api' blueprint tanımı
denials_bp = Blueprint('denials_api', __name__, url_prefix='/api/denials')

# 1. TÜM LİSTEYİ ÇEKME (Mevcut Fonksiyonun)
@denials_bp.route('/', methods=['GET'])
def get_all_denials():
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        
        cur.execute("SELECT * FROM denials ORDER BY id DESC;") # Yeniden eskiye sıraladım, daha pro durur.
        denials = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify(denials)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. ID'YE GÖRE TEK BİR KAYIT ÇEKME (Yeni - Detay Sayfası İçin)
@denials_bp.route('/<int:id>', methods=['GET'])
def get_denial_by_id(id):
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        
        # SQL Injection korumalı sorgu
        cur.execute("SELECT * FROM denials WHERE id = %s;", (id,))
        denial = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if denial:
            return jsonify(denial)
        else:
            return jsonify({"message": "Kayıt bulunamadı"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. YENİ KAYIT EKLEME (Yeni - POST İsteği)
@denials_bp.route('/', methods=['POST'])
def add_denial():
    try:
        data = request.get_json()
        
        # ÖNEMLİ: 'reason' veya 'description' gibi sütun adlarını kendi DB yapına göre değiştir.
        reason = data.get('reason', '') 
        status = data.get('status', 'pending') 

        conn = get_conn()
        cur = conn.cursor()
        
        query = "INSERT INTO denials (reason, status) VALUES (%s, %s);"
        cur.execute(query, (reason, status))
        
        conn.commit() # Değişikliği kaydetmek için şart
        new_id = cur.lastrowid
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Başarıyla eklendi", "id": new_id}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 4. KAYIT SİLME (Yeni - DELETE İsteği)
@denials_bp.route('/<int:id>', methods=['DELETE'])
def delete_denial(id):
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        # Önce var mı diye kontrol edelim (Opsiyonel ama havalı durur)
        cur.execute("SELECT id FROM denials WHERE id = %s;", (id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"message": "Silinecek kayıt bulunamadı"}), 404

        cur.execute("DELETE FROM denials WHERE id = %s;", (id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": f"{id} numaralı kayıt silindi."}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500