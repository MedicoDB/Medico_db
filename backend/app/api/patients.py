"""
Patients API - Full CRUD operations using raw SQL (NO ORM)
Member A: patients, encounters, insurers
"""
from flask import Blueprint, request, jsonify
from ..db import get_conn
from ..utils import generate_new_id
from mysql.connector import Error

bp = Blueprint("patients", __name__)


@bp.get("/")
def list_patients():
    """
    Get all patients with advanced filtering, sorting, and multi-column search.
    
    Query parameters:
    - limit: Maximum number of results (default: 1000)
    - search: General search term (searches multiple columns)
    - sort_by: Column name to sort by (default: registration_date)
    - sort_order: 'asc' or 'desc' (default: desc)
    - patient_id, first_name, last_name, age, gender, ethnicity, insurance_type,
      marital_status, city, state, email: Column-specific search filters
    """
    limit = int(request.args.get("limit", 1000))
    sort_by = request.args.get("sort_by", "registration_date")
    sort_order = request.args.get("sort_order", "desc").upper()
    
    # Validate sort_order
    if sort_order not in ["ASC", "DESC"]:
        sort_order = "DESC"
    
    # Allowed columns for sorting
    allowed_sort_columns = [
        "patient_id", "first_name", "last_name", "dob", "age", "gender",
        "ethnicity", "insurance_type", "marital_status", "city", "state",
        "registration_date", "encounter_count"
    ]
    
    # Validate sort_by column
    if sort_by not in allowed_sort_columns:
        sort_by = "registration_date"
    
    # Handle encounter_count sorting (needs special handling)
    if sort_by == "encounter_count":
        order_clause = f"encounter_count {sort_order}"
    else:
        order_clause = f"p.{sort_by} {sort_order}"
    
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        
        # Build WHERE clause for multi-column search
        where_conditions = []
        params = []
        
        # Column-specific search filters
        search_columns = {
            "patient_id": "p.patient_id",
            "first_name": "p.first_name",
            "last_name": "p.last_name",
            "age": "p.age",
            "gender": "p.gender",
            "ethnicity": "p.ethnicity",
            "insurance_type": "p.insurance_type",
            "marital_status": "p.marital_status",
            "city": "p.city",
            "state": "p.state",
            "email": "p.email",
        }
        
        # Process each search parameter
        for param_name, column_name in search_columns.items():
            search_value = request.args.get(param_name, "").strip()
            if search_value:
                if param_name == "age":
                    # For age, try exact match first, then range
                    try:
                        age_value = int(search_value)
                        where_conditions.append(f"{column_name} = %s")
                        params.append(age_value)
                    except ValueError:
                        # If not a number, try LIKE for partial match
                        where_conditions.append(f"CAST({column_name} AS CHAR) LIKE %s")
                        params.append(f"%{search_value}%")
                else:
                    where_conditions.append(f"{column_name} LIKE %s")
                    params.append(f"%{search_value}%")
        
        # General search (searches multiple columns if no specific filters)
        general_search = request.args.get("search", "").strip()
        if general_search and not where_conditions:
            # Only use general search if no specific column filters
            where_conditions.append(
                "(p.first_name LIKE %s OR p.last_name LIKE %s OR p.patient_id LIKE %s "
                "OR p.email LIKE %s OR p.gender LIKE %s OR CAST(p.age AS CHAR) LIKE %s)"
            )
            search_pattern = f"%{general_search}%"
            params.extend([search_pattern] * 6)
        
        # Build WHERE clause
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Main query
        sql = f"""
            SELECT p.patient_id, p.first_name, p.last_name, p.dob, p.age, 
                   p.gender, p.ethnicity, p.insurance_type, p.marital_status,
                   p.address, p.city, p.state, p.zip, p.phone, p.email, 
                   p.registration_date,
                   COUNT(e.encounter_id) AS encounter_count,
                   MIN(e.visit_date) AS first_visit,
                   MAX(e.visit_date) AS last_visit,
                   i.name as insurance_name
            FROM patients p
            LEFT JOIN encounters e ON e.patient_id = p.patient_id
            LEFT JOIN insurers i ON p.insurance_type = i.code
            {where_clause}
            GROUP BY p.patient_id, p.first_name, p.last_name, p.dob, p.age, 
                     p.gender, p.ethnicity, p.insurance_type, p.marital_status,
                     p.address, p.city, p.state, p.zip, p.phone, p.email, 
                     p.registration_date, i.name
            ORDER BY {order_clause}
            LIMIT %s
        """
        
        params.append(limit)
        cursor.execute(sql, params)
        patients = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(patients)
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({"error": str(e)}), 500


@bp.get("/<patient_id>")
def get_patient(patient_id):
    """Get a single patient by ID."""
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT p.*, i.name as insurance_name
            FROM patients p
            LEFT JOIN insurers i ON p.insurance_type = i.code
            WHERE p.patient_id = %s
        """
        cursor.execute(sql, (patient_id,))
        patient = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        
        return jsonify(patient)
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({"error": str(e)}), 500


@bp.post("/")
def create_patient():
    """Create a new patient. ID is auto-generated."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Required fields validation
        required_fields = ['first_name', 'last_name', 'dob', 'age', 'gender', 'ethnicity', 'registration_date']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        
        # Generate new patient ID
        patient_id = generate_new_id(cursor, 'patients', 'patient_id', 'P-', 3)
        
        # Check for denials before allowing creation (business rule)
        # This is just for consistency, actual check happens on delete
        
        sql = """
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
            data.get('first_name'),
            data.get('last_name'),
            data.get('dob'),
            int(data.get('age')),
            data.get('gender'),
            data.get('ethnicity'),
            data.get('insurance_type') or None,
            data.get('marital_status', 'unknown'),
            data.get('address') or None,
            data.get('city') or None,
            data.get('state') or None,
            data.get('zip') or None,
            data.get('phone') or None,
            data.get('email') or None,
            data.get('registration_date')
        )
        
        cursor.execute(sql, values)
        conn.commit()
        
        # Fetch the created patient
        cursor.execute("""
            SELECT p.*, i.name as insurance_name
            FROM patients p
            LEFT JOIN insurers i ON p.insurance_type = i.code
            WHERE p.patient_id = %s
        """, (patient_id,))
        patient = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify(patient), 201
    except Error as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({"error": str(e)}), 500


@bp.put("/<patient_id>")
def update_patient(patient_id):
    """Update an existing patient."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        
        # Check if patient exists
        cursor.execute("SELECT patient_id FROM patients WHERE patient_id = %s", (patient_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Patient not found"}), 404
        
        # Build dynamic update query
        fields = []
        values = []
        allowed_fields = [
            'first_name', 'last_name', 'dob', 'age', 'gender', 'ethnicity',
            'insurance_type', 'marital_status', 'address', 'city', 'state',
            'zip', 'phone', 'email', 'registration_date'
        ]
        
        for field in allowed_fields:
            if field in data:
                fields.append(f"{field} = %s")
                if field == 'age':
                    values.append(int(data[field]))
                else:
                    values.append(data[field] if data[field] else None)
        
        if not fields:
            cursor.close()
            conn.close()
            return jsonify({"error": "No valid fields to update"}), 400
        
        values.append(patient_id)
        sql = f"UPDATE patients SET {', '.join(fields)} WHERE patient_id = %s"
        cursor.execute(sql, values)
        conn.commit()
        
        # Fetch updated patient
        cursor.execute("""
            SELECT p.*, i.name as insurance_name
            FROM patients p
            LEFT JOIN insurers i ON p.insurance_type = i.code
            WHERE p.patient_id = %s
        """, (patient_id,))
        patient = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify(patient)
    except Error as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({"error": str(e)}), 500


@bp.delete("/<patient_id>")
def delete_patient(patient_id):
    """Delete a patient. Business rule: Cannot delete if patient has denials."""
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        
        # Check if patient exists
        cursor.execute("SELECT patient_id FROM patients WHERE patient_id = %s", (patient_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Patient not found"}), 404
        
        # Application-level check: Verify patient has no denials
        denial_check_sql = """
            SELECT COUNT(*) as denial_count
            FROM denials d
            INNER JOIN claims_and_billing cb ON d.claim_id = cb.claim_id
            WHERE cb.patient_id = %s
        """
        cursor.execute(denial_check_sql, (patient_id,))
        result = cursor.fetchone()
        denial_count = result.get('denial_count', 0) if result else 0
        
        if denial_count > 0:
            cursor.close()
            conn.close()
            return jsonify({
                "error": f"Cannot delete patient: Patient has {denial_count} associated denial(s). Please resolve denials first."
            }), 400
        
        # Delete patient
        cursor.execute("DELETE FROM patients WHERE patient_id = %s", (patient_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({"message": f"Patient {patient_id} deleted successfully"}), 200
    except Error as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        # Check for foreign key constraint violation
        if "foreign key constraint" in str(e).lower() or "restrict" in str(e).lower():
            return jsonify({
                "error": "Cannot delete patient: Patient has associated records (encounters, claims, etc.). Please delete related records first."
            }), 400
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({"error": str(e)}), 500


@bp.get("/<patient_id>/encounters")
def get_patient_encounters(patient_id):
    """Get all encounters for a specific patient."""
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT e.*, pr.name as provider_name, pr.department as provider_department
            FROM encounters e
            LEFT JOIN providers pr ON e.provider_id = pr.provider_id
            WHERE e.patient_id = %s
            ORDER BY e.visit_date DESC
        """
        cursor.execute(sql, (patient_id,))
        encounters = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(encounters)
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({"error": str(e)}), 500
