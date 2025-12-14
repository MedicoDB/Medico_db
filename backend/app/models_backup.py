"""
Data Access Objects (DAO) for the Hospital Management System.
Each class represents a table and contains raw SQL methods for CRUD operations.
NO ORM - All queries use raw SQL with mysql.connector.
"""
from .db import get_db_connection, get_db_cursor
from .utils import generate_new_id
from mysql.connector import Error


class PatientsModel:
    SORTABLE_COLUMNS = {
        "registration_date": "p.registration_date", "patient_id": "p.patient_id",
        "first_name": "p.first_name", "last_name": "p.last_name",
        "age": "p.age", "gender": "p.gender"
    }
    
    @staticmethod
    def get_all(limit=1000, page=1, search=None, filters=None, sort_by="registration_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Build base query for filtering
            base_query = "SELECT p.*, i.name AS insurance_name FROM patients p LEFT JOIN insurers i ON p.insurance_type = i.code WHERE 1 = 1"
            params = []
            
            if search:
                like_term = f"%{search}%"
                base_query += " AND (p.patient_id LIKE %s OR p.first_name LIKE %s OR p.last_name LIKE %s OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR p.phone LIKE %s OR p.email LIKE %s)"
                params.extend([like_term] * 6)
            
            filters = filters or {}
            if filters.get('patient_id'): base_query += " AND p.patient_id LIKE %s"; params.append(f"%{filters['patient_id']}%")
            if filters.get('first_name'): base_query += " AND p.first_name LIKE %s"; params.append(f"%{filters['first_name']}%")
            if filters.get('last_name'): base_query += " AND p.last_name LIKE %s"; params.append(f"%{filters['last_name']}%")
            if filters.get('gender'): base_query += " AND LOWER(p.gender) = LOWER(%s)"; params.append(filters['gender'])
            if filters.get('insurance_type'): base_query += " AND p.insurance_type = %s"; params.append(filters['insurance_type'])
            if filters.get('age_exact') is not None: base_query += " AND p.age = %s"; params.append(filters['age_exact'])
            if filters.get('age_min') is not None: base_query += " AND p.age >= %s"; params.append(filters['age_min'])
            if filters.get('age_max') is not None: base_query += " AND p.age <= %s"; params.append(filters['age_max'])
            if filters.get('city'): base_query += " AND p.city LIKE %s"; params.append(f"%{filters['city']}%")
            if filters.get('state'): base_query += " AND p.state LIKE %s"; params.append(f"%{filters['state']}%")
            if filters.get('registration_from'): base_query += " AND p.registration_date >= %s"; params.append(filters['registration_from'])
            if filters.get('registration_to'): base_query += " AND p.registration_date <= %s"; params.append(filters['registration_to'])
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM ({base_query}) as filtered"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()['total']
            
            # Apply sorting and pagination
            sort_column = PatientsModel.SORTABLE_COLUMNS.get(sort_by, "p.registration_date")
            sort_direction = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            offset = (page - 1) * limit
            query = f"{base_query} ORDER BY {sort_column} {sort_direction} LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            patients = cursor.fetchall()
            
            return {
                'data': patients,
                'total': total_count,
                'page': page,
                'per_page': limit,
                'total_pages': (total_count + limit - 1) // limit
            }
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
        """
        Add a new patient. Validates required NOT NULL fields according to table definition.
        Required fields: first_name, last_name, dob, gender, registration_date
        """
        conn = None
        try:
            # Validate required NOT NULL fields
            if not patient_data.get('first_name'):
                raise ValueError("first_name is required (NOT NULL)")
            if not patient_data.get('last_name'):
                raise ValueError("last_name is required (NOT NULL)")
            if not patient_data.get('dob'):
                raise ValueError("dob (date of birth) is required (NOT NULL)")
            if not patient_data.get('gender'):
                raise ValueError("gender is required (NOT NULL)")
            
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            patient_id = generate_new_id(cursor, 'patients', 'patient_id', 'PAT', 6)
            
            # Set default for registration_date if not provided
            registration_date = patient_data.get('registration_date')
            if not registration_date:
                from datetime import date
                registration_date = date.today().isoformat()
            
            # Set default for marital_status if not provided
            marital_status = patient_data.get('marital_status')
            if not marital_status:
                marital_status = 'unknown'
            
            # Calculate age from dob using SQL TIMESTAMPDIFF
            dob = patient_data.get('dob')
            
            query = """INSERT INTO patients 
                (patient_id, first_name, last_name, dob, age, gender, ethnicity, insurance_type, 
                 marital_status, address, city, state, zip, phone, email, registration_date) 
                VALUES (%s, %s, %s, %s, TIMESTAMPDIFF(YEAR, %s, CURDATE()), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            
            values = (
                patient_id,
                patient_data.get('first_name'),
                patient_data.get('last_name'),
                dob,
                dob,  # dob is used twice: once for dob column, once for TIMESTAMPDIFF calculation
                patient_data.get('gender'),
                patient_data.get('ethnicity'),
                patient_data.get('insurance_type'),
                marital_status,
                patient_data.get('address'),
                patient_data.get('city'),
                patient_data.get('state'),
                patient_data.get('zip'),
                patient_data.get('phone'),
                patient_data.get('email'),
                registration_date
            )
            cursor.execute(query, values)
            conn.commit()
            return patient_id
        except ValueError as ve:
            if conn: conn.rollback()
            raise ve
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding patient: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(patient_id, patient_data):
        """
        Update patient information. Automatically recalculates age if dob is updated.
        Validates required NOT NULL fields if they are being updated.
        """
        conn = None
        try:
            # Validate required fields if they're being updated
            if 'first_name' in patient_data and not patient_data.get('first_name'):
                raise ValueError("first_name cannot be empty (NOT NULL)")
            if 'last_name' in patient_data and not patient_data.get('last_name'):
                raise ValueError("last_name cannot be empty (NOT NULL)")
            if 'dob' in patient_data and not patient_data.get('dob'):
                raise ValueError("dob cannot be empty (NOT NULL)")
            if 'gender' in patient_data and not patient_data.get('gender'):
                raise ValueError("gender cannot be empty (NOT NULL)")
            
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Remove 'age' from patient_data if present - we'll calculate it using SQL
            if 'age' in patient_data:
                del patient_data['age']
            
            fields, values = [], []
            for key, value in patient_data.items():
                if key != 'patient_id':
                    # If dob is being updated, calculate age using SQL TIMESTAMPDIFF
                    if key == 'dob':
                        fields.append("dob = %s")
                        fields.append("age = TIMESTAMPDIFF(YEAR, %s, CURDATE())")
                        values.append(value)
                        values.append(value)  # dob value is used twice - for dob column and for TIMESTAMPDIFF
                    else:
                        fields.append(f"{key} = %s")
                        values.append(value)
            
            # If dob is not being updated, recalculate age from existing dob using SQL
            if 'dob' not in patient_data:
                fields.append("age = TIMESTAMPDIFF(YEAR, dob, CURDATE())")
            
            if not fields: 
                return False
            
            values.append(patient_id)
            cursor.execute(f"UPDATE patients SET {', '.join(fields)} WHERE patient_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except ValueError as ve:
            if conn: conn.rollback()
            raise ve
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
    def get_all(limit=1000, page=1, search=None, filters=None, sort_by="visit_date", sort_dir="desc"):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Build base query
            base_query = """
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
                base_query += " AND (e.encounter_id LIKE %s OR e.patient_id LIKE %s OR e.provider_id LIKE %s OR CONCAT(p.first_name, ' ', p.last_name) LIKE %s OR pr.name LIKE %s OR e.department LIKE %s OR e.visit_type LIKE %s)"
                params.extend([like_term] * 7)
            
            filters = filters or {}
            if filters.get('encounter_id'): base_query += " AND e.encounter_id LIKE %s"; params.append(f"%{filters['encounter_id']}%")
            if filters.get('patient_id'): base_query += " AND e.patient_id LIKE %s"; params.append(f"%{filters['patient_id']}%")
            if filters.get('provider_id'): base_query += " AND e.provider_id LIKE %s"; params.append(f"%{filters['provider_id']}%")
            if filters.get('patient_name'): base_query += " AND CONCAT(p.first_name, ' ', p.last_name) LIKE %s"; params.append(f"%{filters['patient_name']}%")
            if filters.get('provider_name'): base_query += " AND pr.name LIKE %s"; params.append(f"%{filters['provider_name']}%")
            if filters.get('department'): base_query += " AND e.department LIKE %s"; params.append(f"%{filters['department']}%")
            if filters.get('visit_type'): base_query += " AND e.visit_type LIKE %s"; params.append(f"%{filters['visit_type']}%")
            if filters.get('status'): base_query += " AND e.status = %s"; params.append(filters['status'])
            if filters.get('readmitted_flag') is not None: base_query += " AND e.readmitted_flag = %s"; params.append(filters['readmitted_flag'])
            if filters.get('visit_from'): base_query += " AND e.visit_date >= %s"; params.append(filters['visit_from'])
            if filters.get('visit_to'): base_query += " AND e.visit_date <= %s"; params.append(filters['visit_to'])
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM ({base_query}) as filtered"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()['total']
            
            # Apply sorting and pagination
            sort_col = EncountersModel.SORTABLE_COLUMNS.get(sort_by, "e.visit_date")
            sort_d = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            offset = (page - 1) * limit
            query = f"{base_query} ORDER BY {sort_col} {sort_d} LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            encounters = cursor.fetchall()
            
            return {
                'data': encounters,
                'total': total_count,
                'page': page,
                'per_page': limit,
                'total_pages': (total_count + limit - 1) // limit
            }
        except Error as e: raise Error(f"Error fetching encounters: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def get_by_id(encounter_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = """SELECT e.*, 
                       p.first_name as patient_first_name, 
                       p.last_name as patient_last_name, 
                       pr.name as provider_name,
                       pr.department as provider_department
                       FROM encounters e 
                       LEFT JOIN patients p ON e.patient_id = p.patient_id 
                       LEFT JOIN providers pr ON e.provider_id = pr.provider_id 
                       WHERE e.encounter_id = %s"""
            cursor.execute(query, (encounter_id,))
            result = cursor.fetchone()
            
            # If department is not set in encounter but provider has department, use provider's department
            if result and not result.get('department') and result.get('provider_department'):
                result['department'] = result['provider_department']
            
            return result
        except Error as e: raise Error(f"Error fetching encounter: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def add(encounter_data):
        """
        Add a new encounter. Validates required NOT NULL fields according to table definition.
        Required fields: patient_id, provider_id, visit_date, status (defaults to 'Not Completed')
        """
        conn = None
        try:
            # Validate required NOT NULL fields
            if not encounter_data.get('patient_id'):
                raise ValueError("patient_id is required (NOT NULL)")
            if not encounter_data.get('provider_id'):
                raise ValueError("provider_id is required (NOT NULL)")
            if not encounter_data.get('visit_date'):
                raise ValueError("visit_date is required (NOT NULL)")
            
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Get department from provider if not provided (REQUIRED for encounters)
            provider_id = encounter_data.get('provider_id')
            real_dept = encounter_data.get('department')
            if provider_id:
                if not real_dept:
                    # Try to get department from provider
                    cursor.execute("SELECT department FROM providers WHERE provider_id = %s", (provider_id,))
                    result = cursor.fetchone()
                    if result and result.get('department'):
                        real_dept = result['department']
                    else:
                        raise ValueError(f"Provider {provider_id} does not have a department assigned. Please assign a department to the provider first.")
                # Validate that provider exists
                cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
                if not cursor.fetchone():
                    raise ValueError(f"Provider {provider_id} not found")

            eid = generate_new_id(cursor, 'encounters', 'encounter_id', 'ENC', 6)
            
            # Set default for status if not provided (per table definition: DEFAULT 'Not Completed')
            status = encounter_data.get('status')
            if not status:
                status = 'Not Completed'
            
            # Set defaults
            length_of_stay = encounter_data.get('length_of_stay', 0)
            readmitted_flag = encounter_data.get('readmitted_flag', False)
            
            query = """INSERT INTO encounters 
                (encounter_id, patient_id, provider_id, visit_date, visit_type, department, 
                 reason_for_visit, diagnosis_code, admission_type, discharge_date, 
                 length_of_stay, status, readmitted_flag) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            
            values = (
                eid,
                encounter_data.get('patient_id'),
                encounter_data.get('provider_id'),
                encounter_data.get('visit_date'),
                encounter_data.get('visit_type'),
                real_dept,
                encounter_data.get('reason_for_visit'),
                encounter_data.get('diagnosis_code'),
                encounter_data.get('admission_type'),
                encounter_data.get('discharge_date'),
                length_of_stay,
                status,
                readmitted_flag
            )
            cursor.execute(query, values)
            conn.commit()
            return eid
        except ValueError as ve:
            if conn: conn.rollback()
            raise ve
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding encounter: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    @staticmethod
    def update(encounter_id, data):
        """
        Update encounter information. Handles department auto-fill from provider.
        Validates required NOT NULL fields if they are being updated.
        """
        conn = None
        try:
            # Validate required fields if they're being updated
            if 'patient_id' in data and not data.get('patient_id'):
                raise ValueError("patient_id cannot be empty (NOT NULL)")
            if 'provider_id' in data and not data.get('provider_id'):
                raise ValueError("provider_id cannot be empty (NOT NULL)")
            if 'visit_date' in data and not data.get('visit_date'):
                raise ValueError("visit_date cannot be empty (NOT NULL)")
            
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # If provider_id is being updated, try to get department from provider
            if 'provider_id' in data:
                provider_id = data.get('provider_id')
                # Validate provider exists
                cursor.execute("SELECT provider_id, department FROM providers WHERE provider_id = %s", (provider_id,))
                provider_result = cursor.fetchone()
                if not provider_result:
                    raise ValueError(f"Provider {provider_id} not found")
                
                # If department is not being updated or is empty, use provider's department
                if 'department' not in data or not data.get('department'):
                    if provider_result.get('department'):
                        data['department'] = provider_result['department']
                    else:
                        raise ValueError(f"Provider {provider_id} does not have a department assigned. Please assign a department to the provider first.")
            
            fields, values = [], []
            for key, value in data.items():
                if key != 'encounter_id': 
                    fields.append(f"{key} = %s")
                    values.append(value)
            
            if not fields: 
                return False
            
            values.append(encounter_id)
            cursor.execute(f"UPDATE encounters SET {', '.join(fields)} WHERE encounter_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except ValueError as ve:
            if conn: conn.rollback()
            raise ve
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


# Helper models for dropdowns
class ProvidersModel:
    @staticmethod
    def get_all(limit=1000, search=None):
        """
        Get all providers with optional search using SQL LIKE.
        Search matches against name, specialty, provider_id.
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT provider_id, name, specialty, department FROM providers WHERE 1 = 1"
            params = []
            
            if search:
                like_term = f"%{search}%"
                query += " AND (provider_id LIKE %s OR name LIKE %s OR specialty LIKE %s OR department LIKE %s)"
                params.extend([like_term] * 4)
            
            query += " ORDER BY name LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
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


class InsurersModel:
    SORTABLE_COLUMNS = {
        "insurer_id": "insurer_id",
        "code": "code",
        "name": "name",
        "payer_type": "payer_type"
    }
    
    @staticmethod
    def get_all(limit=1000, page=1, search=None, filters=None, sort_by="name", sort_dir="asc"):
        """
        Get all insurers with optional search, filters, sorting, and pagination.
        Uses SQL LIKE for search and filtering.
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Build base query for filtering
            base_query = "SELECT * FROM insurers WHERE 1 = 1"
            params = []
            
            if search:
                like_term = f"%{search}%"
                base_query += " AND (insurer_id LIKE %s OR code LIKE %s OR name LIKE %s OR payer_type LIKE %s OR phone LIKE %s)"
                params.extend([like_term] * 5)
            
            filters = filters or {}
            if filters.get('code'): base_query += " AND code LIKE %s"; params.append(f"%{filters['code']}%")
            if filters.get('name'): base_query += " AND name LIKE %s"; params.append(f"%{filters['name']}%")
            if filters.get('payer_type'): base_query += " AND payer_type = %s"; params.append(filters['payer_type'])
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM ({base_query}) as filtered"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()['total']
            
            # Apply sorting and pagination
            sort_column = InsurersModel.SORTABLE_COLUMNS.get(sort_by, "name")
            sort_direction = "ASC" if str(sort_dir).lower() == "asc" else "DESC"
            offset = (page - 1) * limit
            query = f"{base_query} ORDER BY {sort_column} {sort_direction} LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            insurers = cursor.fetchall()
            
            return {
                'data': insurers,
                'total': total_count,
                'page': page,
                'per_page': limit,
                'total_pages': (total_count + limit - 1) // limit
            }
        except Error as e: raise Error(f"Error fetching insurers: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def get_by_id(insurer_id):
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            query = "SELECT * FROM insurers WHERE insurer_id = %s"
            cursor.execute(query, (insurer_id,))
            return cursor.fetchone()
        except Error as e: raise Error(f"Error fetching insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def add(insurer_data):
        """
        Add a new insurer. Validates required NOT NULL fields.
        Required fields: code (UNIQUE), name, payer_type
        """
        conn = None
        try:
            # Validate required NOT NULL fields
            if not insurer_data.get('code'):
                raise ValueError("code is required (NOT NULL)")
            if not insurer_data.get('name'):
                raise ValueError("name is required (NOT NULL)")
            if not insurer_data.get('payer_type'):
                raise ValueError("payer_type is required (NOT NULL)")
            
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Check if code already exists (UNIQUE constraint)
            cursor.execute("SELECT insurer_id FROM insurers WHERE code = %s", (insurer_data.get('code'),))
            if cursor.fetchone():
                raise ValueError(f"Code '{insurer_data.get('code')}' already exists (must be UNIQUE)")
            
            query = """INSERT INTO insurers 
                (code, name, payer_type, phone) 
                VALUES (%s, %s, %s, %s)"""
            
            values = (
                insurer_data.get('code'),
                insurer_data.get('name'),
                insurer_data.get('payer_type'),
                insurer_data.get('phone')
            )
            cursor.execute(query, values)
            conn.commit()
            return cursor.lastrowid  # Return the auto-generated insurer_id
        except ValueError as ve:
            if conn: conn.rollback()
            raise ve
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error adding insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def update(insurer_id, insurer_data):
        """
        Update insurer information. Validates required NOT NULL fields if they are being updated.
        """
        conn = None
        try:
            # Validate required fields if they're being updated
            if 'code' in insurer_data and not insurer_data.get('code'):
                raise ValueError("code cannot be empty (NOT NULL)")
            if 'name' in insurer_data and not insurer_data.get('name'):
                raise ValueError("name cannot be empty (NOT NULL)")
            if 'payer_type' in insurer_data and not insurer_data.get('payer_type'):
                raise ValueError("payer_type cannot be empty (NOT NULL)")
            
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Check if code already exists (if code is being updated)
            if 'code' in insurer_data:
                cursor.execute("SELECT insurer_id FROM insurers WHERE code = %s AND insurer_id != %s", 
                             (insurer_data.get('code'), insurer_id))
                if cursor.fetchone():
                    raise ValueError(f"Code '{insurer_data.get('code')}' already exists (must be UNIQUE)")
            
            fields, values = [], []
            for key, value in insurer_data.items():
                if key != 'insurer_id': 
                    fields.append(f"{key} = %s")
                    values.append(value)
            
            if not fields: 
                return False
            
            values.append(insurer_id)
            cursor.execute(f"UPDATE insurers SET {', '.join(fields)} WHERE insurer_id = %s", values)
            conn.commit()
            return cursor.rowcount > 0
        except ValueError as ve:
            if conn: conn.rollback()
            raise ve
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error updating insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()
    
    @staticmethod
    def delete(insurer_id):
        """
        Delete an insurer. Checks for foreign key constraints.
        """
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Check if insurer is referenced by patients
            cursor.execute("SELECT COUNT(*) AS cnt FROM patients WHERE insurance_type = (SELECT code FROM insurers WHERE insurer_id = %s)", (insurer_id,))
            result = cursor.fetchone()
            if result and result.get('cnt', 0) > 0:
                raise Error(f"Cannot delete insurer {insurer_id}: It is referenced by patients. Update or remove patient references first.")
            
            cursor.execute("DELETE FROM insurers WHERE insurer_id = %s", (insurer_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            if conn: conn.rollback()
            raise Error(f"Error deleting insurer: {e}")
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

