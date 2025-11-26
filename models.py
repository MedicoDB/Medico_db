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
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def get_departments():
        """Get distinct departments from providers table."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # Sadece benzersiz departman isimlerini çekiyoruz
            query = "SELECT DISTINCT department FROM providers WHERE department IS NOT NULL AND department != '' ORDER BY department"
            cursor.execute(query)
            # Sonucu düz liste olarak döndür: ['Cardiology', 'Neurology', ...]
            results = [row["department"] for row in cursor.fetchall()]
            return results
        except Error as e:
            return []  # Hata olursa boş liste dön
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()


# ============================================================================
# MEMBER A: Tables - patients, encounters, insurers
# ============================================================================


class PatientsModel:
    """Data Access Object for the patients table."""

    SORTABLE_COLUMNS = {
        "registration_date": "p.registration_date",
        "patient_id": "p.patient_id",
        "first_name": "p.first_name",
        "last_name": "p.last_name",
        "age": "p.age",
        "gender": "p.gender",
    }

    @staticmethod
    def get_all(
        limit=1000,
        search=None,
        filters=None,
        sort_by="registration_date",
        sort_dir="desc",
    ):
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
            if filters.get("patient_id"):
                query += " AND p.patient_id LIKE %s"
                params.append(f"%{filters['patient_id']}%")
            if filters.get("first_name"):
                query += " AND p.first_name LIKE %s"
                params.append(f"%{filters['first_name']}%")
            if filters.get("last_name"):
                query += " AND p.last_name LIKE %s"
                params.append(f"%{filters['last_name']}%")
            if filters.get("gender"):
                query += " AND LOWER(p.gender) = LOWER(%s)"
                params.append(filters["gender"])
            if filters.get("insurance_type"):
                query += " AND p.insurance_type = %s"
                params.append(filters["insurance_type"])
            if filters.get("age_exact") is not None:
                query += " AND p.age = %s"
                params.append(filters["age_exact"])
            if filters.get("age_min") is not None:
                query += " AND p.age >= %s"
                params.append(filters["age_min"])
            if filters.get("age_max") is not None:
                query += " AND p.age <= %s"
                params.append(filters["age_max"])
            if filters.get("city"):
                query += " AND p.city LIKE %s"
                params.append(f"%{filters['city']}%")
            if filters.get("state"):
                query += " AND p.state LIKE %s"
                params.append(f"%{filters['state']}%")
            if filters.get("registration_from"):
                query += " AND p.registration_date >= %s"
                params.append(filters["registration_from"])
            if filters.get("registration_to"):
                query += " AND p.registration_date <= %s"
                params.append(filters["registration_to"])

            sort_column = PatientsModel.SORTABLE_COLUMNS.get(
                sort_by, "p.registration_date"
            )
            sort_direction = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            query += f" ORDER BY {sort_column} {sort_direction} LIMIT %s"
            params.append(limit)

            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching patients: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def get_by_id(patient_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute(
                "SELECT p.*, i.name as insurance_name FROM patients p LEFT JOIN insurers i ON p.insurance_type = i.code WHERE p.patient_id = %s",
                (patient_id,),
            )
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error fetching patient: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def add(patient_data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            patient_id = generate_new_id(cursor, "patients", "patient_id", "PAT", 6)
            query = "INSERT INTO patients (patient_id, first_name, last_name, dob, age, gender, ethnicity, insurance_type, marital_status, address, city, state, zip, phone, email, registration_date) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            values = (
                patient_id,
                patient_data.get("first_name"),
                patient_data.get("last_name"),
                patient_data.get("dob"),
                patient_data.get("age"),
                patient_data.get("gender"),
                patient_data.get("ethnicity"),
                patient_data.get("insurance_type"),
                patient_data.get("marital_status"),
                patient_data.get("address"),
                patient_data.get("city"),
                patient_data.get("state"),
                patient_data.get("zip"),
                patient_data.get("phone"),
                patient_data.get("email"),
                patient_data.get("registration_date"),
            )
            cursor.execute(query, values)
            conn.commit()
            return patient_id
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error adding patient: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def update(patient_id, patient_data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            fields, values = [], []
            for key, value in patient_data.items():
                if key != "patient_id":
                    fields.append(f"{key} = %s")
                    values.append(value)
            if not fields:
                return False
            values.append(patient_id)
            cursor.execute(
                f"UPDATE patients SET {', '.join(fields)} WHERE patient_id = %s", values
            )
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error updating patient: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def delete(patient_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute(
                "SELECT COUNT(*) AS cnt FROM encounters WHERE patient_id = %s",
                (patient_id,),
            )
            if cursor.fetchone()["cnt"] > 0:
                raise Error(
                    f"Cannot delete patient {patient_id}: Delete related encounters first."
                )
            cursor.execute("DELETE FROM patients WHERE patient_id = %s", (patient_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error deleting patient: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()


class EncountersModel:
    """Data Access Object for the encounters table."""

    SORTABLE_COLUMNS = {
        "visit_date": "e.visit_date",
        "encounter_id": "e.encounter_id",
        "patient_id": "e.patient_id",
        "provider_id": "e.provider_id",
        "department": "e.department",
        "visit_type": "e.visit_type",
        "status": "e.status",
        "length_of_stay": "e.length_of_stay",
    }

    @staticmethod
    def get_dashboard_activity(limit=50, search=None, filters=None, sort_by="visit_date", sort_dir="desc"):
        """
        Retrieves recent hospital activity with a Complex Join of 6 tables.
        Supports filtering and sorting on joined fields (Insurance, Diagnosis, Billing).
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # 1. Ana Sorgu (6 Tablolu JOIN)
            query = """
                SELECT 
                    e.encounter_id,
                    e.visit_date,
                    e.visit_type,
                    e.department,
                    e.status as encounter_status,
                    p.patient_id,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name,
                    pr.provider_id,
                    pr.name as provider_name,
                    d.diagnosis_code,
                    d.diagnosis_description,
                    i.name as insurance_name,
                    cb.billed_amount,
                    cb.claim_status
                FROM encounters e
                INNER JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                LEFT JOIN diagnoses d ON e.encounter_id = d.encounter_id AND d.primary_flag = 1
                LEFT JOIN insurers i ON p.insurance_type = i.code
                LEFT JOIN claims_and_billing cb ON e.encounter_id = cb.encounter_id
                WHERE 1 = 1
            """
            params = []

            # 2. Genel Arama (Search Box)
            if search:
                like_term = f"%{search}%"
                query += """
                    AND (
                        e.encounter_id LIKE %s
                        OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s
                        OR pr.name LIKE %s
                        OR d.diagnosis_code LIKE %s
                        OR i.name LIKE %s
                        OR e.department LIKE %s
                    )
                """
                params.extend([like_term] * 6)

            # 3. Detaylı Filtreler
            filters = filters or {}
            if filters.get('encounter_id'):
                query += " AND e.encounter_id LIKE %s"
                params.append(f"%{filters['encounter_id']}%")
            
            if filters.get('patient_name'):
                query += " AND CONCAT(p.first_name, ' ', p.last_name) LIKE %s"
                params.append(f"%{filters['patient_name']}%")
                
            if filters.get('provider_name'):
                query += " AND pr.name LIKE %s"
                params.append(f"%{filters['provider_name']}%")
                
            if filters.get('department'):
                query += " AND e.department LIKE %s"
                params.append(f"%{filters['department']}%")
                
            if filters.get('visit_date'):
                query += " AND e.visit_date = %s"
                params.append(filters['visit_date'])
                
            if filters.get('status'):
                query += " AND e.status = %s"
                params.append(filters['status'])

            # 4. Sıralama Haritası (Dashboard Kolonları için)
            dashboard_sort_map = {
                "encounter_id": "e.encounter_id",
                "visit_date": "e.visit_date",
                "patient_name": "p.first_name", # Soyada göre de sıralanabilir
                "provider_name": "pr.name",
                "department": "e.department",
                "diagnosis": "d.diagnosis_code",
                "insurance": "i.name",
                "billed_amount": "cb.billed_amount",
                "status": "e.status"
            }
            
            sort_column = dashboard_sort_map.get(sort_by, "e.visit_date")
            sort_direction = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            
            query += f" ORDER BY {sort_column} {sort_direction} LIMIT %s"
            params.append(limit)

            cursor.execute(query, params)
            return cursor.fetchall()

        except Error as e:
            raise Error(f"Error fetching dashboard activity: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def get_all(
        limit=1000, search=None, filters=None, sort_by="visit_date", sort_dir="desc"
    ):
        """Retrieve encounters with filters for Patient Name and Provider Name."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT e.*,
                       p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                       pr.name AS provider_name, pr.department AS provider_department
                FROM encounters e
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                WHERE 1 = 1
            """
            params = []

            # 1. General Search
            if search:
                like_term = f"%{search}%"
                query += """
                    AND (e.encounter_id LIKE %s OR e.patient_id LIKE %s OR e.provider_id LIKE %s 
                    OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR pr.name LIKE %s 
                    OR e.department LIKE %s OR e.visit_type LIKE %s)
                """
                params.extend([like_term] * 7)

            # 2. Specific Filters
            filters = filters or {}
            if filters.get("encounter_id"):
                query += " AND e.encounter_id LIKE %s"
                params.append(f"%{filters['encounter_id']}%")
            if filters.get("patient_id"):
                query += " AND e.patient_id LIKE %s"
                params.append(f"%{filters['patient_id']}%")
            if filters.get("provider_id"):
                query += " AND e.provider_id LIKE %s"
                params.append(f"%{filters['provider_id']}%")

            # FIXED: Name Filters
            if filters.get("patient_name"):
                query += " AND CONCAT(p.first_name, ' ', p.last_name) LIKE %s"
                params.append(f"%{filters['patient_name']}%")
            if filters.get("provider_name"):
                query += " AND pr.name LIKE %s"
                params.append(f"%{filters['provider_name']}%")

            if filters.get("department"):
                query += " AND e.department LIKE %s"
                params.append(f"%{filters['department']}%")
            if filters.get("visit_type"):
                query += " AND e.visit_type LIKE %s"
                params.append(f"%{filters['visit_type']}%")
            if filters.get("status"):
                query += " AND e.status = %s"
                params.append(filters["status"])
            if filters.get("readmitted_flag") is not None:
                query += " AND e.readmitted_flag = %s"
                params.append(filters["readmitted_flag"])
            if filters.get("diagnosis_code"):
                query += " AND e.diagnosis_code LIKE %s"
                params.append(f"%{filters['diagnosis_code']}%")
            if filters.get("visit_from"):
                query += " AND e.visit_date >= %s"
                params.append(filters["visit_from"])
            if filters.get("visit_to"):
                query += " AND e.visit_date <= %s"
                params.append(filters["visit_to"])

            sort_col = EncountersModel.SORTABLE_COLUMNS.get(sort_by, "e.visit_date")
            sort_d = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            query += f" ORDER BY {sort_col} {sort_d} LIMIT %s"
            params.append(limit)

            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching encounters: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def get_by_id(encounter_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT e.*, p.first_name as patient_first_name, p.last_name as patient_last_name, pr.name as provider_name FROM encounters e LEFT JOIN patients p ON e.patient_id = p.patient_id LEFT JOIN providers pr ON e.provider_id = pr.provider_id WHERE e.encounter_id = %s"
            cursor.execute(query, (encounter_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error fetching encounter: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def add(data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            eid = generate_new_id(cursor, "encounters", "encounter_id", "ENC", 6)
            query = "INSERT INTO encounters (encounter_id, patient_id, provider_id, visit_date, visit_type, department, reason_for_visit, diagnosis_code, admission_type, discharge_date, length_of_stay, status, readmitted_flag) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            values = (
                eid,
                data.get("patient_id"),
                data.get("provider_id"),
                data.get("visit_date"),
                data.get("visit_type"),
                data.get("department"),
                data.get("reason_for_visit"),
                data.get("diagnosis_code"),
                data.get("admission_type"),
                data.get("discharge_date"),
                data.get("length_of_stay", 0),
                data.get("status", "Completed"),
                data.get("readmitted_flag", False),
            )
            cursor.execute(query, values)
            conn.commit()
            return eid
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error adding encounter: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def update(encounter_id, data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            fields, values = [], []
            for key, value in data.items():
                if key != "encounter_id":
                    fields.append(f"{key} = %s")
                    values.append(value)
            if not fields:
                return False
            values.append(encounter_id)
            cursor.execute(
                f"UPDATE encounters SET {', '.join(fields)} WHERE encounter_id = %s",
                values,
            )
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error updating encounter: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    @staticmethod
    def delete(encounter_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute(
                "SELECT COUNT(*) as cnt FROM claims_and_billing WHERE encounter_id = %s",
                (encounter_id,),
            )
            if cursor.fetchone()["cnt"] > 0:
                raise Error("Cannot delete encounter: It has linked billing records.")
            cursor.execute(
                "DELETE FROM encounters WHERE encounter_id = %s", (encounter_id,)
            )
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error deleting encounter: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()


class InsurersModel:
    """Data Access Object for the insurers table."""

    @staticmethod
    def get_all():
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM insurers ORDER BY name")
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()


class ClaimsAndBillingModel:
    """Data Access Object for the claims_and_billing table."""

    @staticmethod
    def get_all():
        # Placeholder as requested by Member M responsibilities
        pass


class MedicationsModel:
    """Data Access Object for the medications table."""
    
    SORTABLE_COLUMNS = {
        "prescribed_date": "m.prescribed_date",
        "drug_name": "m.drug_name",
        "cost": "m.cost",
        "medication_id": "m.medication_id"
    }
    
    @staticmethod
    def get_all(limit=1000, search=None, filters=None, sort_by="prescribed_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # Encounter ve Patient tablolarına join atıyoruz ki hasta ismini de arayabilelim
            query = """
                SELECT m.*, 
                       e.visit_date,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name,
                       pr.name as prescriber_name
                FROM medications m
                LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON m.prescriber_id = pr.provider_id
                WHERE 1=1
            """
            params = []
            
            if search:
                like_term = f"%{search}%"
                query += """
                    AND (
                        m.medication_id LIKE %s
                        OR m.drug_name LIKE %s
                        OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s
                        OR pr.name LIKE %s
                    )
                """
                params.extend([like_term] * 4)
            
            filters = filters or {}
            if filters.get('drug_name'):
                query += " AND m.drug_name LIKE %s"
                params.append(f"%{filters['drug_name']}%")
            if filters.get('encounter_id'):
                query += " AND m.encounter_id LIKE %s"
                params.append(f"%{filters['encounter_id']}%")
            if filters.get('date_from'):
                query += " AND m.prescribed_date >= %s"
                params.append(filters['date_from'])
            if filters.get('date_to'):
                query += " AND m.prescribed_date <= %s"
                params.append(filters['date_to'])

            sort_column = MedicationsModel.SORTABLE_COLUMNS.get(sort_by, "m.prescribed_date")
            sort_direction = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            
            query += f" ORDER BY {sort_column} {sort_direction} LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e:
            raise Error(f"Error fetching medications: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def get_by_id(medication_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT m.*, 
                       e.visit_date,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name
                FROM medications m
                LEFT JOIN encounters e ON m.encounter_id = e.encounter_id
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                WHERE m.medication_id = %s
            """
            cursor.execute(query, (medication_id,))
            return cursor.fetchone()
        except Error as e:
            raise Error(f"Error fetching medication: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(data):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            # ID Format: MED000001
            med_id = generate_new_id(cursor, 'medications', 'medication_id', 'MED', 6)
            
            query = """
                INSERT INTO medications (
                    medication_id, encounter_id, drug_name, dosage, route, 
                    frequency, duration, prescribed_date, prescriber_id, cost
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                med_id,
                data.get('encounter_id'),
                data.get('drug_name'),
                data.get('dosage'),
                data.get('route'),
                data.get('frequency'),
                data.get('duration'),
                data.get('prescribed_date'),
                data.get('prescriber_id'),
                data.get('cost')
            )
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
            fields = []
            values = []
            for key, value in data.items():
                if key != 'medication_id':
                    fields.append(f"{key} = %s")
                    values.append(value)
            if not fields: return False
            values.append(med_id)
            
            query = f"UPDATE medications SET {', '.join(fields)} WHERE medication_id = %s"
            cursor.execute(query, values)
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