"""
Data Access Objects (DAO) for the Hospital Management System.
Each class represents a table and contains raw SQL methods for CRUD operations.
NO ORM - All queries use raw SQL with mysql.connector.
"""
from db import get_db_connection, get_db_cursor
from utils import generate_new_id
from mysql.connector import Error

# ============================================================================
# MEMBER U Helper: ProvidersModel (Needed for Dropdowns)
# ============================================================================
class ProvidersModel:
    @staticmethod
    def get_all():
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT provider_id, name, specialty, department FROM providers ORDER BY name"
            cursor.execute(query)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching providers: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_departments():
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT DISTINCT department FROM providers WHERE department IS NOT NULL AND department != '' ORDER BY department"
            cursor.execute(query)
            return [row['department'] for row in cursor.fetchall()]
        except Error as e:
            return []
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

# ============================================================================
# MEMBER A: Tables - patients, encounters, insurers
# ============================================================================

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
            if filters.get('age_exact') is not None: query += " AND p.age = %s"; params.append(filters['age_exact'])
            if filters.get('age_min') is not None: query += " AND p.age >= %s"; params.append(filters['age_min'])
            if filters.get('age_max') is not None: query += " AND p.age <= %s"; params.append(filters['age_max'])
            if filters.get('city'): query += " AND p.city LIKE %s"; params.append(f"%{filters['city']}%")
            if filters.get('state'): query += " AND p.state LIKE %s"; params.append(f"%{filters['state']}%")
            if filters.get('registration_from'): query += " AND p.registration_date >= %s"; params.append(filters['registration_from'])
            if filters.get('registration_to'): query += " AND p.registration_date <= %s"; params.append(filters['registration_to'])
            
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
                SELECT p.*, 
                       i.name as insurance_name, 
                       i.insurer_id as insurance_id_fk 
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
            query = "INSERT INTO patients (patient_id, first_name, last_name, dob, age, gender, ethnicity, insurance_type, marital_status, address, city, state, zip, phone, email, registration_date) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            values = (patient_id, patient_data.get('first_name'), patient_data.get('last_name'), patient_data.get('dob'), patient_data.get('age'), patient_data.get('gender'), patient_data.get('ethnicity'), patient_data.get('insurance_type'), patient_data.get('marital_status'), patient_data.get('address'), patient_data.get('city'), patient_data.get('state'), patient_data.get('zip'), patient_data.get('phone'), patient_data.get('email'), patient_data.get('registration_date'))
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
            if cursor.fetchone()['cnt'] > 0: raise Error(f"Cannot delete patient {patient_id}: Delete related encounters first.")
            cursor.execute("DELETE FROM patients WHERE patient_id = %s", (patient_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting patient: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()


class EncountersModel:
    SORTABLE_COLUMNS = {
        "visit_date": "e.visit_date", "encounter_id": "e.encounter_id",
        "patient_id": "e.patient_id", "provider_id": "e.provider_id",
        "department": "e.department", "visit_type": "e.visit_type",
        "status": "e.status", "length_of_stay": "e.length_of_stay"
    }
    
    @staticmethod
    def get_dashboard_activity(limit=50, search=None, filters=None, sort_by="visit_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT e.encounter_id, e.visit_date, e.visit_type, e.department, e.status as encounter_status,
                    p.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
                    pr.provider_id, pr.name as provider_name,
                    d.diagnosis_code, d.diagnosis_description,
                    i.name as insurance_name, cb.billed_amount, cb.claim_status
                FROM encounters e
                INNER JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                LEFT JOIN diagnoses d ON e.encounter_id = d.encounter_id AND d.primary_flag = 1
                LEFT JOIN insurers i ON p.insurance_type = i.code
                LEFT JOIN claims_and_billing cb ON e.encounter_id = cb.encounter_id
                WHERE 1 = 1
            """
            params = []
            if search:
                like_term = f"%{search}%"
                query += " AND (e.encounter_id LIKE %s OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR pr.name LIKE %s OR d.diagnosis_code LIKE %s OR i.name LIKE %s OR e.department LIKE %s)"
                params.extend([like_term] * 6)

            filters = filters or {}
            if filters.get('encounter_id'): query += " AND e.encounter_id LIKE %s"; params.append(f"%{filters['encounter_id']}%")
            if filters.get('patient_name'): query += " AND CONCAT(p.first_name, ' ', p.last_name) LIKE %s"; params.append(f"%{filters['patient_name']}%")
            if filters.get('provider_name'): query += " AND pr.name LIKE %s"; params.append(f"%{filters['provider_name']}%")
            if filters.get('department'): query += " AND e.department LIKE %s"; params.append(f"%{filters['department']}%")
            if filters.get('visit_date'): query += " AND e.visit_date = %s"; params.append(filters['visit_date'])
            if filters.get('status'): query += " AND e.status = %s"; params.append(filters['status'])

            sort_map = {"encounter_id": "e.encounter_id", "visit_date": "e.visit_date", "patient_name": "p.first_name", "provider_name": "pr.name", "department": "e.department", "diagnosis": "d.diagnosis_code", "insurance": "i.name", "billed_amount": "cb.billed_amount", "status": "e.status"}
            sort_col = sort_map.get(sort_by, "e.visit_date")
            sort_d = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            query += f" ORDER BY {sort_col} {sort_d} LIMIT %s"
            params.append(limit)

            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e: raise Error(f"Error fetching dashboard: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_all(limit=1000, search=None, filters=None, sort_by="visit_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT e.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                       pr.name AS provider_name, pr.department AS provider_department
                FROM encounters e
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                WHERE 1 = 1
            """
            params = []
            if search:
                like_term = f"%{search}%"
                query += " AND (e.encounter_id LIKE %s OR e.patient_id LIKE %s OR e.provider_id LIKE %s OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR pr.name LIKE %s OR e.department LIKE %s OR e.visit_type LIKE %s)"
                params.extend([like_term] * 7)
            
            filters = filters or {}
            if filters.get('encounter_id'): query += " AND e.encounter_id LIKE %s"; params.append(f"%{filters['encounter_id']}%")
            if filters.get('patient_id'): query += " AND e.patient_id LIKE %s"; params.append(f"%{filters['patient_id']}%")
            if filters.get('provider_id'): query += " AND e.provider_id LIKE %s"; params.append(f"%{filters['provider_id']}%")
            if filters.get('patient_name'): query += " AND CONCAT(p.first_name, ' ', p.last_name) LIKE %s"; params.append(f"%{filters['patient_name']}%")
            if filters.get('provider_name'): query += " AND pr.name LIKE %s"; params.append(f"%{filters['provider_name']}%")
            if filters.get('department'): query += " AND e.department LIKE %s"; params.append(f"%{filters['department']}%")
            if filters.get('visit_type'): query += " AND e.visit_type LIKE %s"; params.append(f"%{filters['visit_type']}%")
            if filters.get('status'): query += " AND e.status = %s"; params.append(filters['status'])
            if filters.get('readmitted_flag') is not None: query += " AND e.readmitted_flag = %s"; params.append(filters['readmitted_flag'])
            if filters.get('visit_from'): query += " AND e.visit_date >= %s"; params.append(filters['visit_from'])
            if filters.get('visit_to'): query += " AND e.visit_date <= %s"; params.append(filters['visit_to'])
            
            sort_col = EncountersModel.SORTABLE_COLUMNS.get(sort_by, "e.visit_date")
            sort_d = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            query += f" ORDER BY {sort_col} {sort_d} LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e: raise Error(f"Error fetching encounters: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def get_by_id(encounter_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT e.*, p.first_name as patient_first_name, p.last_name as patient_last_name, pr.name as provider_name FROM encounters e LEFT JOIN patients p ON e.patient_id = p.patient_id LEFT JOIN providers pr ON e.provider_id = pr.provider_id WHERE e.encounter_id = %s"
            cursor.execute(query, (encounter_id,))
            return cursor.fetchone()
        except Error as e: raise Error(f"Error fetching encounter: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(encounter_data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            provider_id = encounter_data.get('provider_id')
            cursor.execute("SELECT department FROM providers WHERE provider_id = %s", (provider_id,))
            result = cursor.fetchone()
            real_dept = result['department'] if result else encounter_data.get('department')

            eid = generate_new_id(cursor, 'encounters', 'encounter_id', 'ENC-', 3)
            query = "INSERT INTO encounters (encounter_id, patient_id, provider_id, visit_date, visit_type, department, reason_for_visit, diagnosis_code, admission_type, discharge_date, length_of_stay, status, readmitted_flag) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            values = (eid, encounter_data.get('patient_id'), encounter_data.get('provider_id'), encounter_data.get('visit_date'), encounter_data.get('visit_type'), real_dept, encounter_data.get('reason_for_visit'), encounter_data.get('diagnosis_code'), encounter_data.get('admission_type'), encounter_data.get('discharge_date'), encounter_data.get('length_of_stay', 0), encounter_data.get('status', 'Completed'), encounter_data.get('readmitted_flag', False))
            cursor.execute(query, values)
            conn.commit()
            return eid
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding encounter: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(encounter_id, data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            fields, values = [], []
            for key, value in data.items():
                if key != 'encounter_id': fields.append(f"{key} = %s"); values.append(value)
            if not fields: return False
            values.append(encounter_id)
            cursor.execute(f"UPDATE encounters SET {', '.join(fields)} WHERE encounter_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating encounter: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def delete(encounter_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT COUNT(*) as cnt FROM claims_and_billing WHERE encounter_id = %s", (encounter_id,))
            if cursor.fetchone()['cnt'] > 0: raise Error("Cannot delete encounter: It has linked billing records.")
            cursor.execute("DELETE FROM encounters WHERE encounter_id = %s", (encounter_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting encounter: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

class InsurersModel:
    @staticmethod
    def get_all():
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM insurers ORDER BY name")
            return cursor.fetchall()
        except Error as e: raise Error(f"Error: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(insurer_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM insurers WHERE insurer_id = %s", (insurer_id,))
            return cursor.fetchone()
        except Error as e: raise Error(f"Error fetching insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def add(data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query_max = "SELECT MAX(insurer_id) as max_id FROM insurers"
            cursor.execute(query_max)
            res = cursor.fetchone()
            new_id = (int(res.get('max_id') or 0)) + 1
            query = "INSERT INTO insurers (insurer_id, code, name, payer_type, phone) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(query, (new_id, data.get('code'), data.get('name'), data.get('payer_type'), data.get('phone')))
            conn.commit()
            return new_id
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(insurer_id, data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "UPDATE insurers SET code=%s, name=%s, payer_type=%s, phone=%s WHERE insurer_id=%s"
            cursor.execute(query, (data.get('code'), data.get('name'), data.get('payer_type'), data.get('phone'), insurer_id))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def delete(insurer_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT COUNT(*) as cnt FROM patients WHERE insurance_type = (SELECT code FROM insurers WHERE insurer_id = %s)", (insurer_id,))
            if cursor.fetchone()['cnt'] > 0: raise Error("Cannot delete insurer: Linked to existing patients.")
            cursor.execute("DELETE FROM insurers WHERE insurer_id = %s", (insurer_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

# ============================================================================
# MEMBER F: Tables - medications
# ============================================================================

class MedicationsModel:
    SORTABLE_COLUMNS = {"prescribed_date": "m.prescribed_date", "drug_name": "m.drug_name", "cost": "m.cost", "medication_id": "m.medication_id"}
    
    @staticmethod
    def get_all(limit=1000, search=None, filters=None, sort_by="prescribed_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT m.*, e.visit_date, p.first_name as patient_first_name, p.last_name as patient_last_name, pr.name as prescriber_name
                FROM medications m
                LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON m.prescriber_id = pr.provider_id
                WHERE 1=1
            """
            params = []
            if search:
                like_term = f"%{search}%"
                query += " AND (m.medication_id LIKE %s OR m.drug_name LIKE %s OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR pr.name LIKE %s)"
                params.extend([like_term] * 4)
            
            filters = filters or {}
            if filters.get('drug_name'): query += " AND m.drug_name LIKE %s"; params.append(f"%{filters['drug_name']}%")
            if filters.get('encounter_id'): query += " AND m.encounter_id LIKE %s"; params.append(f"%{filters['encounter_id']}%")
            if filters.get('date_from'): query += " AND m.prescribed_date >= %s"; params.append(filters['date_from'])
            if filters.get('date_to'): query += " AND m.prescribed_date <= %s"; params.append(filters['date_to'])

            sort_col = MedicationsModel.SORTABLE_COLUMNS.get(sort_by, "m.prescribed_date")
            sort_d = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            query += f" ORDER BY {sort_col} {sort_d} LIMIT %s"
            params.append(limit)
            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e: raise Error(f"Error fetching medications: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(medication_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT m.*, e.visit_date, p.first_name as patient_first_name, p.last_name as patient_last_name
                FROM medications m
                LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                WHERE m.medication_id = %s
            """
            cursor.execute(query, (medication_id,))
            return cursor.fetchone()
        except Error as e: raise Error(f"Error fetching medication: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            med_id = generate_new_id(cursor, 'medications', 'medication_id', 'MED', 6)
            query = "INSERT INTO medications (medication_id, encounter_id, drug_name, dosage, route, frequency, duration, prescribed_date, prescriber_id, cost) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            values = (med_id, data.get('encounter_id'), data.get('drug_name'), data.get('dosage'), data.get('route'), data.get('frequency'), data.get('duration'), data.get('prescribed_date'), data.get('prescriber_id'), data.get('cost'))
            cursor.execute(query, values)
            conn.commit()
            return med_id
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding medication: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(med_id, data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            fields, values = [], []
            for key, value in data.items():
                if key != 'medication_id': fields.append(f"{key} = %s"); values.append(value)
            if not fields: return False
            values.append(med_id)
            cursor.execute(f"UPDATE medications SET {', '.join(fields)} WHERE medication_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating medication: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def delete(med_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("DELETE FROM medications WHERE medication_id = %s", (med_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting medication: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

# ============================================================================
# MEMBER M: Tables - claims_and_billing
# ============================================================================

class ClaimsAndBillingModel:
    """Data Access Object for the claims_and_billing table."""

    SORTABLE_COLUMNS = {
        "billing_id": "cb.billing_id",
        "claim_date": "cb.claim_billing_date",
        "encounter_id": "cb.encounter_id",
        "billed_amount": "cb.billed_amount",
        "claim_status": "cb.claim_status"
    }

    @staticmethod
    def get_all(limit=1000, search=None, filters=None, sort_by='claim_date', sort_dir='desc'):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Temel sorgu: Claims tablosunu Patients ve Encounters ile birleştiriyoruz
            query = """
                SELECT cb.*, 
                       p.first_name, p.last_name, 
                       e.visit_date, i.name as insurer_name
                FROM claims_and_billing cb
                LEFT JOIN patients p ON cb.patient_id = p.patient_id
                LEFT JOIN encounters e ON cb.encounter_id = e.encounter_id
                LEFT JOIN insurers i ON p.insurance_type = i.code
                WHERE 1=1
            """
            params = []

            # 1. Genel Arama (Search Bar)
            if search:
                like_term = f"%{search}%"
                query += """
                    AND (cb.billing_id LIKE %s OR cb.claim_id LIKE %s OR cb.encounter_id LIKE %s 
                    OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR cb.claim_status LIKE %s)
                """
                params.extend([like_term] * 5)

            # 2. Detaylı Filtreler
            filters = filters or {}
            if filters.get('billing_id'):
                query += " AND cb.billing_id LIKE %s"
                params.append(f"%{filters['billing_id']}%")
            if filters.get('encounter_id'):
                query += " AND cb.encounter_id LIKE %s"
                params.append(f"%{filters['encounter_id']}%")
            if filters.get('claim_status'):
                query += " AND cb.claim_status = %s"
                params.append(filters['claim_status'])
            if filters.get('billed_amount_min'):
                query += " AND cb.billed_amount >= %s"
                params.append(filters['billed_amount_min'])
            if filters.get('claim_date_from'):
                query += " AND cb.claim_billing_date >= %s"
                params.append(filters['claim_date_from'])

            # 3. Sıralama ve Limit
            sort_col = ClaimsAndBillingModel.SORTABLE_COLUMNS.get(sort_by, 'cb.claim_billing_date')
            sort_d = 'ASC' if str(sort_dir).lower() == 'asc' else 'DESC'
            
            query += f" ORDER BY {sort_col} {sort_d} LIMIT %s"
            params.append(limit)

            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching claims: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(billing_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT cb.*, p.first_name, p.last_name, e.visit_date 
                FROM claims_and_billing cb
                LEFT JOIN patients p ON cb.patient_id = p.patient_id
                LEFT JOIN encounters e ON cb.encounter_id = e.encounter_id
                WHERE cb.billing_id = %s
            """
            cursor.execute(query, (billing_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error fetching claim: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Otomatik ID oluşturma (BILL-xxx ve CLM-xxx)
            bill_id = generate_new_id(cursor, 'claims_and_billing', 'billing_id', 'BILL', 6)
            claim_id = generate_new_id(cursor, 'claims_and_billing', 'claim_id', 'CLM', 6)
            
            # Encounter ID'den Patient ID'yi bulalım (Veri tutarlılığı için)
            encounter_id = data.get('encounter_id')
            cursor.execute("SELECT patient_id FROM encounters WHERE encounter_id = %s", (encounter_id,))
            result = cursor.fetchone()
            if not result:
                raise Error("Invalid Encounter ID provided.")
            patient_id = result['patient_id']

            query = """
                INSERT INTO claims_and_billing 
                (billing_id, claim_id, patient_id, encounter_id, insurance_provider, payment_method, 
                 claim_billing_date, billed_amount, paid_amount, claim_status, denial_reason) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                bill_id,
                claim_id,
                patient_id,
                encounter_id,
                data.get('insurance_provider', 'Unknown'), # Formdan gelmezse default
                data.get('payment_method'),
                data.get('claim_billing_date'), # views.py'da claim_date olarak geliyor
                data.get('billed_amount', 0),
                data.get('paid_amount', 0),
                data.get('claim_status', 'Pending'),
                data.get('denial_reason')
            )
            
            cursor.execute(query, values)
            conn.commit()
            return bill_id
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding claim: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(billing_id, data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            fields, values = [], []
            # Güncellenebilir alanlar
            updatable_cols = ['encounter_id', 'insurance_provider', 'payment_method', 
                              'claim_billing_date', 'billed_amount', 'paid_amount', 
                              'claim_status', 'denial_reason']
            
            for key, value in data.items():
                if key in updatable_cols:
                    fields.append(f"{key} = %s")
                    values.append(value)
            
            # Eğer encounter değiştiyse patient_id'yi de güncellememiz gerekebilir
            if 'encounter_id' in data:
                cursor.execute("SELECT patient_id FROM encounters WHERE encounter_id = %s", (data['encounter_id'],))
                res = cursor.fetchone()
                if res:
                    fields.append("patient_id = %s")
                    values.append(res['patient_id'])

            if not fields: return False
            
            values.append(billing_id)
            cursor.execute(f"UPDATE claims_and_billing SET {', '.join(fields)} WHERE billing_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating claim: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def delete(billing_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # 1. Önce silinmek istenen kaydın 'claim_id' ve 'claim_status' bilgilerini çekelim
            # Çünkü denials tablosu claim_id ile bağlı, billing_id ile değil.
            check_query = "SELECT claim_id, claim_status FROM claims_and_billing WHERE billing_id = %s"
            cursor.execute(check_query, (billing_id,))
            claim = cursor.fetchone()
            
            if claim:
                # 2. Eğer statüsü 'Denied' ise kontrol etmeliyiz
                if claim['claim_status'] == 'Denied':
                    # Bu claim_id'ye ait denial kaydı var mı?
                    denial_check_query = "SELECT COUNT(*) as cnt FROM denials WHERE claim_id = %s"
                    cursor.execute(denial_check_query, (claim['claim_id'],))
                    result = cursor.fetchone()
                    
                    # 3. Eğer denials tablosunda kayıt varsa HATA FIRLAT ve silmeyi durdur
                    if result['cnt'] > 0:
                        raise Error(f"ENGEL: Statüsü 'Denied' olan ve {result['cnt']} adet itiraz kaydı bulunan fatura silinemez! Önce itiraz kayıtlarını silmelisiniz.")

            # 4. Engel yoksa (veya statü Denied değilse) silme işlemini yap
            # ON DELETE CASCADE sayesinde bağlı denials kayıtları da (varsa ve statü denied değilse) silinir.
            cursor.execute("DELETE FROM claims_and_billing WHERE billing_id = %s", (billing_id,))
            conn.commit()
            return cursor.rowcount > 0
            
        except Error as e:
            if conn: conn.rollback()
            # Hatayı yukarı fırlat, views.py bunu yakalayıp ekrana basacak
            raise Error(str(e))
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    @staticmethod
    def sync_claim_amount(encounter_id):
        """
        Bu fonksiyon, verilen encounter_id için prosedür ve ilaç maliyetlerini toplar.
        Eğer claim varsa tutarı günceller, yoksa yeni claim oluşturur.
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)

            # 1. Toplam Maliyeti Hesapla (Prosedürler + İlaçlar)
            # COALESCE(SUM(...), 0) -> Eğer kayıt yoksa None yerine 0 döndürür.
            calc_query = """
                SELECT 
                    (SELECT COALESCE(SUM(procedure_cost), 0) FROM procedures WHERE encounter_id = %s) +
                    (SELECT COALESCE(SUM(cost), 0) FROM medications WHERE encounter_id = %s) 
                AS total_amount
            """
            cursor.execute(calc_query, (encounter_id, encounter_id))
            result = cursor.fetchone()
            total_amount = float(result['total_amount']) if result else 0.0

            # 2. Bu encounter için zaten bir fatura (claim) var mı kontrol et
            check_query = "SELECT billing_id FROM claims_and_billing WHERE encounter_id = %s"
            cursor.execute(check_query, (encounter_id,))
            existing_claim = cursor.fetchone()

            if existing_claim:
                # DURUM A: Fatura zaten var -> Sadece tutarı güncelle
                update_query = "UPDATE claims_and_billing SET billed_amount = %s WHERE billing_id = %s"
                cursor.execute(update_query, (total_amount, existing_claim['billing_id']))
            else:
                # DURUM B: Fatura yok -> Yeni fatura oluştur
                # Gerekli ID'leri üret
                bill_id = generate_new_id(cursor, 'claims_and_billing', 'billing_id', 'BILL', 6)
                claim_id = generate_new_id(cursor, 'claims_and_billing', 'claim_id', 'CLM', 6)
                
                # Patient ID'yi Encounter tablosundan çek
                cursor.execute("SELECT patient_id FROM encounters WHERE encounter_id = %s", (encounter_id,))
                enc_data = cursor.fetchone()
                patient_id = enc_data['patient_id'] if enc_data else None

                insert_query = """
                    INSERT INTO claims_and_billing 
                    (billing_id, claim_id, patient_id, encounter_id, claim_billing_date, 
                     billed_amount, paid_amount, claim_status, payment_method, insurance_provider)
                    VALUES (%s, %s, %s, %s, NOW(), %s, 0, 'Pending', 'Insurance', 'Unknown')
                """
                cursor.execute(insert_query, (bill_id, claim_id, patient_id, encounter_id, total_amount))

            conn.commit()
            return True

        except Error as e:
            if conn: conn.rollback()
            print(f"Auto-billing error: {e}") # Loglama için
            return False # Hata olsa bile ana işlemi durdurmayalım, sadece false dönelim
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_claim_statistics():
        """
        GROUP BY kullanarak her statüdeki fatura sayısını ve toplam tutarı hesaplar.
        Ödev gereksinimi: GROUP BY Usage
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # GROUP BY Sorgusu: Statüye göre grupla, sayısını ve toplam tutarını al
            query = """
                SELECT 
                    claim_status, 
                    COUNT(*) as count, 
                    SUM(billed_amount) as total_amount
                FROM claims_and_billing
                GROUP BY claim_status
                ORDER BY total_amount DESC
            """
            cursor.execute(query)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching statistics: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

class DenialsModel:
    """Data Access Object for the denials table."""

    @staticmethod
    def get_all(limit=1000):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT d.*, cb.billing_id, cb.claim_billing_date 
                FROM denials d
                LEFT JOIN claims_and_billing cb ON d.claim_id = cb.claim_id
                ORDER BY d.denial_date DESC LIMIT %s
            """
            cursor.execute(query, (limit,))
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching denials: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(denial_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # İlişkili fatura bilgisini de çekiyoruz
            query = """
                SELECT d.*, cb.billing_id, cb.encounter_id, cb.billed_amount
                FROM denials d
                LEFT JOIN claims_and_billing cb ON d.claim_id = cb.claim_id
                WHERE d.denial_id = %s
            """
            cursor.execute(query, (denial_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error fetching denial: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_claim_id(claim_id):
        """Bir Claim ID'ye ait Denial kaydını bulur."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM denials WHERE claim_id = %s", (claim_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def delete(denial_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # SQL Silme Sorgusu
            cursor.execute("DELETE FROM denials WHERE denial_id = %s", (denial_id,))
            conn.commit()
            
            # Eğer bir satır silindiyse True, silinmediyse False döndür
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting denial: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    """Data Access Object for the denials table."""

    @staticmethod
    def get_all(limit=1000):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT d.*, cb.billing_id, cb.claim_billing_date 
                FROM denials d
                LEFT JOIN claims_and_billing cb ON d.claim_id = cb.claim_id
                ORDER BY d.denial_date DESC LIMIT %s
            """
            cursor.execute(query, (limit,))
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching denials: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(denial_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # İlişkili fatura bilgisini de çekiyoruz
            query = """
                SELECT d.*, cb.billing_id, cb.encounter_id, cb.billed_amount
                FROM denials d
                LEFT JOIN claims_and_billing cb ON d.claim_id = cb.claim_id
                WHERE d.denial_id = %s
            """
            cursor.execute(query, (denial_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error fetching denial: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_claim_id(claim_id):
        """Bir Claim ID'ye ait Denial kaydını bulur."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM denials WHERE claim_id = %s", (claim_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def delete(denial_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # SQL Silme Sorgusu
            cursor.execute("DELETE FROM denials WHERE denial_id = %s", (denial_id,))
            conn.commit()
            
            # Eğer bir satır silindiyse True, silinmediyse False döndür
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting denial: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
            
class ProvidersModel:
    """Data Access Object for the providers table."""
    
    SORTABLE_COLUMNS = {
        "provider_id": "p.provider_id",
        "name": "p.name",
        "department": "p.department",
        "specialty": "p.specialty",
        "years_experience": "p.years_experience"
    }

    @staticmethod
    def get_all(limit=1000, search=None, filters=None, sort_by="name", sort_dir="asc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # Specialty Head ismini de çekiyoruz
            query = """
                SELECT p.*, sh.head_name as head_of_department
                FROM providers p
                LEFT JOIN specialty_heads sh ON p.head_id = sh.head_id
                WHERE 1=1
            """
            params = []
            
            if search:
                like_term = f"%{search}%"
                query += """
                    AND (
                        p.provider_id LIKE %s
                        OR p.name LIKE %s
                        OR p.department LIKE %s
                        OR p.specialty LIKE %s
                        OR p.npi LIKE %s
                    )
                """
                params.extend([like_term] * 5)
            
            filters = filters or {}
            if filters.get('department'):
                query += " AND p.department = %s"
                params.append(filters['department'])
            if filters.get('specialty'):
                query += " AND p.specialty LIKE %s"
                params.append(f"%{filters['specialty']}%")
            if filters.get('inhouse') is not None:
                query += " AND p.inhouse = %s"
                params.append(filters['inhouse'])

            sort_column = ProvidersModel.SORTABLE_COLUMNS.get(sort_by, "p.name")
            sort_direction = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            
            query += f" ORDER BY {sort_column} {sort_direction} LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching providers: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(provider_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT p.*, sh.head_name 
                FROM providers p
                LEFT JOIN specialty_heads sh ON p.head_id = sh.head_id
                WHERE p.provider_id = %s
            """
            cursor.execute(query, (provider_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error fetching provider: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # ID Format: PRO00001 (Padding: 5)
            prov_id = generate_new_id(cursor, 'providers', 'provider_id', 'PRO', 5)
            
            query = """
                INSERT INTO providers (
                    provider_id, name, department, specialty, npi, inhouse, 
                    location, years_experience, contact_info, email, head_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                prov_id, data.get('name'), data.get('department'), data.get('specialty'),
                data.get('npi'), data.get('inhouse'), data.get('location'),
                data.get('years_experience'), data.get('contact_info'), 
                data.get('email'), data.get('head_id')
            )
            cursor.execute(query, values)
            conn.commit()
            return prov_id
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding provider: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(provider_id, data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            fields, values = [], []
            for key, value in data.items():
                if key != 'provider_id':
                    fields.append(f"{key} = %s")
                    values.append(value)
            if not fields: return False
            values.append(provider_id)
            
            cursor.execute(f"UPDATE providers SET {', '.join(fields)} WHERE provider_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating provider: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def delete(provider_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # Bağlı Encounters kontrolü
            cursor.execute("SELECT COUNT(*) as cnt FROM encounters WHERE provider_id = %s", (provider_id,))
            if cursor.fetchone()['cnt'] > 0:
                raise Error("Cannot delete provider: Linked to existing encounters.")
            
            cursor.execute("DELETE FROM providers WHERE provider_id = %s", (provider_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting provider: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_departments():
        # Dropdownlar için departman listesi (zaten vardı, kalsın)
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT DISTINCT department FROM providers WHERE department IS NOT NULL AND department != '' ORDER BY department"
            cursor.execute(query)
            return [row['department'] for row in cursor.fetchall()]
        except Error: return []
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()


class SpecialtyHeadsModel:
    """Data Access Object for the specialty_heads table."""
    
    @staticmethod
    def get_all():
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT * FROM specialty_heads ORDER BY specialty"
            cursor.execute(query)
            return cursor.fetchall()
        except Error as e: raise Error(f"Error fetching heads: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def get_by_id(head_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT * FROM specialty_heads WHERE head_id = %s"
            cursor.execute(query, (head_id,))
            return cursor.fetchone()
        except Error as e: raise Error(f"Error fetching head: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Manuel ID artırma (INT PK)
            cursor.execute("SELECT MAX(head_id) as max_id FROM specialty_heads")
            res = cursor.fetchone()
            new_id = (int(res.get('max_id') or 0)) + 1
            
            query = """
                INSERT INTO specialty_heads (head_id, specialty, head_provider_id, head_name, head_email)
                VALUES (%s, %s, %s, %s, %s)
            """
            values = (new_id, data.get('specialty'), data.get('head_provider_id'), data.get('head_name'), data.get('head_email'))
            cursor.execute(query, values)
            conn.commit()
            return new_id
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding head: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(head_id, data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "UPDATE specialty_heads SET specialty=%s, head_provider_id=%s, head_name=%s, head_email=%s WHERE head_id=%s"
            values = (data.get('specialty'), data.get('head_provider_id'), data.get('head_name'), data.get('head_email'), head_id)
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating head: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def delete(head_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # Bağlı Provider var mı kontrol et
            cursor.execute("SELECT COUNT(*) as cnt FROM providers WHERE head_id = %s", (head_id,))
            if cursor.fetchone()['cnt'] > 0:
                raise Error("Cannot delete Head: Linked to existing providers.")
            
            cursor.execute("DELETE FROM specialty_heads WHERE head_id = %s", (head_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting head: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()