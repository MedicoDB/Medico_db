"""
Data Access Objects (DAO) for the Hospital Management System.
Each class represents a table and contains raw SQL methods for CRUD operations.
NO ORM - All queries use raw SQL with mysql.connector.
"""
from db import get_db_connection, get_db_cursor
from utils import generate_new_id
from mysql.connector import Error


# ============================================================================
# MEMBER A: Tables - patients, encounters, insurers
# ============================================================================

class PatientsModel:
    """Data Access Object for the patients table."""
    
    @staticmethod
    def get_all(limit=1000):
        """
        Retrieve patients from the database.
        
        Args:
            limit (int): Maximum number of patients to retrieve (default: 1000)
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT p.*, i.name as insurance_name
                FROM patients p
                LEFT JOIN insurers i ON p.insurance_type = i.code
                ORDER BY p.registration_date DESC
                LIMIT %s
            """
            cursor.execute(query, (limit,))
            results = cursor.fetchall()
            return results
        except Error as e:
            raise Error(f"Error fetching patients: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def get_by_id(patient_id):
        """Retrieve a single patient by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT p.*, i.name as insurance_name
                FROM patients p
                LEFT JOIN insurers i ON p.insurance_type = i.code
                WHERE p.patient_id = %s
            """
            cursor.execute(query, (patient_id,))
            result = cursor.fetchone()
            return result
        except Error as e:
            raise Error(f"Error fetching patient: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def add(patient_data):
        """
        Add a new patient to the database.
        Automatically generates patient_id using utils.generate_new_id.
        
        Args:
            patient_data (dict): Dictionary containing patient fields
                Required: first_name, last_name, dob, age, gender, ethnicity,
                         insurance_type, registration_date
                Optional: marital_status, address, city, state, zip, phone, email
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Generate new patient ID
            patient_id = generate_new_id(cursor, 'patients', 'patient_id', 'PAT-', 6)
            
            query = """
                INSERT INTO patients (
                    patient_id, first_name, last_name, dob, age, gender, ethnicity,
                    insurance_type, marital_status, address, city, state, zip,
                    phone, email, registration_date
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            values = (
                patient_id,
                patient_data.get('first_name'),
                patient_data.get('last_name'),
                patient_data.get('dob'),
                patient_data.get('age'),
                patient_data.get('gender'),
                patient_data.get('ethnicity'),
                patient_data.get('insurance_type'),
                patient_data.get('marital_status', 'unknown'),
                patient_data.get('address'),
                patient_data.get('city'),
                patient_data.get('state'),
                patient_data.get('zip'),
                patient_data.get('phone'),
                patient_data.get('email'),
                patient_data.get('registration_date')
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
        """Update an existing patient."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Build dynamic update query
            fields = []
            values = []
            for key, value in patient_data.items():
                if key != 'patient_id':  # Don't update the primary key
                    fields.append(f"{key} = %s")
                    values.append(value)
            
            if not fields:
                return False
            
            values.append(patient_id)
            query = f"UPDATE patients SET {', '.join(fields)} WHERE patient_id = %s"
            cursor.execute(query, values)
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
        """Delete a patient by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "DELETE FROM patients WHERE patient_id = %s"
            cursor.execute(query, (patient_id,))
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
    
    @staticmethod
    def get_all(limit=1000):
        """
        Retrieve encounters with related patient and provider information.
        
        Args:
            limit (int): Maximum number of encounters to retrieve (default: 1000)
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT e.*, 
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name,
                       pr.name as provider_name,
                       pr.department as provider_department
                FROM encounters e
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                ORDER BY e.visit_date DESC
                LIMIT %s
            """
            cursor.execute(query, (limit,))
            results = cursor.fetchall()
            return results
        except Error as e:
            raise Error(f"Error fetching encounters: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def get_by_id(encounter_id):
        """Retrieve a single encounter by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT e.*, 
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name,
                       pr.name as provider_name
                FROM encounters e
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                WHERE e.encounter_id = %s
            """
            cursor.execute(query, (encounter_id,))
            result = cursor.fetchone()
            return result
        except Error as e:
            raise Error(f"Error fetching encounter: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def add(encounter_data):
        """Add a new encounter. Automatically generates encounter_id."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Generate new encounter ID
            encounter_id = generate_new_id(cursor, 'encounters', 'encounter_id', 'ENC-', 3)
            
            query = """
                INSERT INTO encounters (
                    encounter_id, patient_id, provider_id, visit_date, visit_type,
                    department, reason_for_visit, diagnosis_code, admission_type,
                    discharge_date, length_of_stay, status, readmitted_flag
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            values = (
                encounter_id,
                encounter_data.get('patient_id'),
                encounter_data.get('provider_id'),
                encounter_data.get('visit_date'),
                encounter_data.get('visit_type'),
                encounter_data.get('department'),
                encounter_data.get('reason_for_visit'),
                encounter_data.get('diagnosis_code'),
                encounter_data.get('admission_type'),
                encounter_data.get('discharge_date'),
                encounter_data.get('length_of_stay', 0),
                encounter_data.get('status', 'Completed'),
                encounter_data.get('readmitted_flag', False)
            )
            cursor.execute(query, values)
            conn.commit()
            return encounter_id
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error adding encounter: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def update(encounter_id, encounter_data):
        """Update an existing encounter."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            fields = []
            values = []
            for key, value in encounter_data.items():
                if key != 'encounter_id':
                    fields.append(f"{key} = %s")
                    values.append(value)
            
            if not fields:
                return False
            
            values.append(encounter_id)
            query = f"UPDATE encounters SET {', '.join(fields)} WHERE encounter_id = %s"
            cursor.execute(query, values)
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
        """Delete an encounter by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "DELETE FROM encounters WHERE encounter_id = %s"
            cursor.execute(query, (encounter_id,))
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
        """Retrieve all insurers."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT * FROM insurers ORDER BY name"
            cursor.execute(query)
            results = cursor.fetchall()
            return results
        except Error as e:
            raise Error(f"Error fetching insurers: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def get_by_id(insurer_id):
        """Retrieve a single insurer by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT * FROM insurers WHERE insurer_id = %s"
            cursor.execute(query, (insurer_id,))
            result = cursor.fetchone()
            return result
        except Error as e:
            raise Error(f"Error fetching insurer: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def get_by_code(code):
        """Retrieve an insurer by code."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT * FROM insurers WHERE code = %s"
            cursor.execute(query, (code,))
            result = cursor.fetchone()
            return result
        except Error as e:
            raise Error(f"Error fetching insurer: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def add(insurer_data):
        """Add a new insurer."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # For insurers, we need to get the max insurer_id (integer)
            query_max = "SELECT MAX(insurer_id) as max_id FROM insurers"
            cursor.execute(query_max)
            result = cursor.fetchone()
            max_id = result.get('max_id') if result else 0
            new_insurer_id = max_id + 1
            
            query = """
                INSERT INTO insurers (insurer_id, code, name, payer_type)
                VALUES (%s, %s, %s, %s)
            """
            values = (
                new_insurer_id,
                insurer_data.get('code'),
                insurer_data.get('name'),
                insurer_data.get('payer_type')
            )
            cursor.execute(query, values)
            conn.commit()
            return new_insurer_id
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error adding insurer: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def update(insurer_id, insurer_data):
        """Update an existing insurer."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            fields = []
            values = []
            for key, value in insurer_data.items():
                if key != 'insurer_id':
                    fields.append(f"{key} = %s")
                    values.append(value)
            
            if not fields:
                return False
            
            values.append(insurer_id)
            query = f"UPDATE insurers SET {', '.join(fields)} WHERE insurer_id = %s"
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error updating insurer: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def delete(insurer_id):
        """Delete an insurer by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "DELETE FROM insurers WHERE insurer_id = %s"
            cursor.execute(query, (insurer_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error deleting insurer: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()


# ============================================================================
# MEMBER U: Tables - providers, specialty_heads, diagnoses
# ============================================================================

# TODO: Member U will implement ProvidersModel, SpecialtyHeadsModel, DiagnosesModel


# ============================================================================
# MEMBER F: Tables - procedures, medications
# ============================================================================

# TODO: Member F will implement ProceduresModel, MedicationsModel


# ============================================================================
# MEMBER M: Tables - claims_and_billing, denials
# ============================================================================

class ClaimsAndBillingModel:
    """Data Access Object for the claims_and_billing table."""
    
    @staticmethod
    def get_all():
        """Retrieve all billing records with related patient and encounter information."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT cb.*,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name,
                       e.visit_date as encounter_date,
                       e.visit_type
                FROM claims_and_billing cb
                LEFT JOIN patients p ON cb.patient_id = p.patient_id
                LEFT JOIN encounters e ON cb.encounter_id = e.encounter_id
                ORDER BY cb.claim_billing_date DESC
            """
            cursor.execute(query)
            results = cursor.fetchall()
            return results
        except Error as e:
            raise Error(f"Error fetching billing records: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def get_by_id(billing_id):
        """Retrieve a single billing record by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """
                SELECT cb.*,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name
                FROM claims_and_billing cb
                LEFT JOIN patients p ON cb.patient_id = p.patient_id
                WHERE cb.billing_id = %s
            """
            cursor.execute(query, (billing_id,))
            result = cursor.fetchone()
            return result
        except Error as e:
            raise Error(f"Error fetching billing record: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def add(billing_data):
        """Add a new billing record. Automatically generates billing_id."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Generate new billing ID
            billing_id = generate_new_id(cursor, 'claims_and_billing', 'billing_id', 'BILL', 3)
            
            query = """
                INSERT INTO claims_and_billing (
                    billing_id, patient_id, encounter_id, insurance_provider,
                    payment_method, claim_id, claim_billing_date, billed_amount,
                    paid_amount, claim_status, denial_reason
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            values = (
                billing_id,
                billing_data.get('patient_id'),
                billing_data.get('encounter_id'),
                billing_data.get('insurance_provider'),
                billing_data.get('payment_method'),
                billing_data.get('claim_id'),
                billing_data.get('claim_billing_date'),
                billing_data.get('billed_amount'),
                billing_data.get('paid_amount'),
                billing_data.get('claim_status'),
                billing_data.get('denial_reason')
            )
            cursor.execute(query, values)
            conn.commit()
            return billing_id
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error adding billing record: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def update(billing_id, billing_data):
        """Update an existing billing record."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            fields = []
            values = []
            for key, value in billing_data.items():
                if key != 'billing_id':
                    fields.append(f"{key} = %s")
                    values.append(value)
            
            if not fields:
                return False
            
            values.append(billing_id)
            query = f"UPDATE claims_and_billing SET {', '.join(fields)} WHERE billing_id = %s"
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error updating billing record: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    @staticmethod
    def delete(billing_id):
        """Delete a billing record by ID."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "DELETE FROM claims_and_billing WHERE billing_id = %s"
            cursor.execute(query, (billing_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn:
                conn.rollback()
            raise Error(f"Error deleting billing record: {e}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()


# ============================================================================
# MEMBER Y: Tables - lab_tests
# ============================================================================

# TODO: Member Y will implement LabTestsModel

