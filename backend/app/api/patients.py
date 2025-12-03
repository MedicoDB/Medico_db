"""
Patients API - Models and Routes
Location: backend/app/api/patients.py
"""
from flask import Blueprint, request, jsonify
from ..db import get_db_connection, get_db_cursor
from ..utils import generate_new_id
from mysql.connector import Error

patients_bp = Blueprint('patients', __name__)

def _value_or_none(value):
    return value.strip() if value and value.strip() else None

class PatientsModel:
    SORTABLE_COLUMNS = {
        "registration_date": "p.registration_date", "patient_id": "p.patient_id",
        "first_name": "p.first_name", "last_name": "p.last_name",
        "age": "p.age", "gender": "p.gender"
    }
    
    @staticmethod
    def get_all(limit=1000, search=None, filters=None, sort_by="registration_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT p.*, i.name AS insurance_name FROM patients p LEFT JOIN insurers i ON p.insurance_type = i.code WHERE 1 = 1"
            params = []
            
            if search:
                like_term = f"%{search}%"
                query += " AND (p.patient_id LIKE %s OR p.first_name LIKE %s OR p.last_name LIKE %s OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR p.phone LIKE %s OR p.email LIKE %s)"
                params.extend([like_term] * 6)
            
            filters = filters or {}
            if filters.get('patient_id'): query += " AND p.patient_id LIKE %s"; params.append(f"%{filters['patient_id']}%")
            if filters.get('first_name'): query += " AND p.first_name LIKE %s"; params.append(f"%{filters['first_name']}%")
            if filters.get('last_name'): query += " AND p.last_name LIKE %s"; params.append(f"%{filters['last_name']}%")
            if filters.get('gender'): query += " AND LOWER(p.gender) = LOWER(%s)"; params.append(filters['gender'])
            if filters.get('insurance_type'): query += " AND p.insurance_type = %s"; params.append(filters['insurance_type'])
            if filters.get('city'): query += " AND p.city LIKE %s"; params.append(f"%{filters['city']}%")
            
            sort_column = PatientsModel.SORTABLE_COLUMNS.get(sort_by, "p.registration_date")
            sort_direction = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            query += f" ORDER BY {sort_column} {sort_direction} LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e: raise Error(f"Error fetching patients: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(patient_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT p.*, i.name as insurance_name, i.insurer_id as insurance_id_fk 
                FROM patients p
                LEFT JOIN insurers i ON p.insurance_type = i.code
                WHERE p.patient_id = %s
            """
            cursor.execute(query, (patient_id,))
            return cursor.fetchone()
        except Error as e: raise Error(f"Error fetching patient: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(patient_data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            patient_id = generate_new_id(cursor, 'patients', 'patient_id', 'PAT-', 6)
            query = """
                INSERT INTO patients (patient_id, first_name, last_name, dob, age, gender, ethnicity, 
                insurance_type, marital_status, address, city, state, zip, phone, email, registration_date) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (patient_id, patient_data.get('first_name'), patient_data.get('last_name'), 
                      patient_data.get('dob'), patient_data.get('age'), patient_data.get('gender'), 
                      patient_data.get('ethnicity'), patient_data.get('insurance_type'), 
                      patient_data.get('marital_status'), patient_data.get('address'), 
                      patient_data.get('city'), patient_data.get('state'), patient_data.get('zip'), 
                      patient_data.get('phone'), patient_data.get('email'), patient_data.get('registration_date'))
            cursor.execute(query, values)
            conn.commit()
            return patient_id
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding patient: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(patient_id, patient_data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            fields, values = [], []
            for key, value in patient_data.items():
                if key != 'patient_id': fields.append(f"{key} = %s"); values.append(value)
            if not fields: return False
            values.append(patient_id)
            cursor.execute(f"UPDATE patients SET {', '.join(fields)} WHERE patient_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating patient: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def delete(patient_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT COUNT(*) AS cnt FROM encounters WHERE patient_id = %s", (patient_id,))
            if cursor.fetchone()['cnt'] > 0: 
                raise Error(f"Cannot delete patient {patient_id}: Delete related encounters first.")
            cursor.execute("DELETE FROM patients WHERE patient_id = %s", (patient_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting patient: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

# --- ROUTES (API JSON) ---

@patients_bp.route('/patients', methods=['GET'])
def get_patients():
    search = request.args.get('q', '').strip()
    sort_by = request.args.get('sort', 'registration_date')
    direction = request.args.get('direction', 'desc').lower()
    filters = {
        'patient_id': _value_or_none(request.args.get('patient_id')),
        'first_name': _value_or_none(request.args.get('first_name')),
        'last_name': _value_or_none(request.args.get('last_name')),
        'gender': _value_or_none(request.args.get('gender')),
        'city': _value_or_none(request.args.get('city'))
    }
    try:
        patients = PatientsModel.get_all(limit=1000, search=search or None, filters=filters, sort_by=sort_by, sort_dir=direction)
        return jsonify({"success": True, "data": patients}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@patients_bp.route('/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    try:
        patient = PatientsModel.get_by_id(patient_id)
        if not patient:
            return jsonify({"success": False, "error": "Not found"}), 404
        
        # Get Encounters for this patient
        conn = get_db_connection(); cursor = get_db_cursor(conn)
        cursor.execute("SELECT e.*, pr.name as provider_name FROM encounters e LEFT JOIN providers pr ON e.provider_id = pr.provider_id WHERE e.patient_id = %s ORDER BY e.visit_date DESC", (patient_id,))
        encounters = cursor.fetchall(); conn.close()
        
        return jsonify({"success": True, "data": {"patient": patient, "encounters": encounters}}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@patients_bp.route('/patients', methods=['POST'])
def add_patient():
    try:
        data = request.get_json() # React sends JSON
        new_id = PatientsModel.add(data)
        return jsonify({"success": True, "message": "Patient added", "patient_id": new_id}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@patients_bp.route('/patients/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    try:
        data = request.get_json()
        PatientsModel.update(patient_id, data)
        return jsonify({"success": True, "message": "Patient updated"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@patients_bp.route('/patients/<patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    try:
        PatientsModel.delete(patient_id)
        return jsonify({"success": True, "message": "Patient deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500