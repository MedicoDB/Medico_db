"""
Utility functions for ID generation and validation.
"""
from mysql.connector import Error

# Whitelist of allowed table and column names for security
ALLOWED_TABLES = {'patients', 'encounters', 'claims_and_billing', 'medications', 'providers', 'denials', 'procedures', 'diagnoses', 'department_heads', 'lab_tests'}
ALLOWED_ID_COLUMNS = {'patient_id', 'encounter_id', 'billing_id', 'medication_id', 'provider_id', 'denial_id', 'procedure_id', 'diagnosis_id', 'head_id', 'claim_id', 'test_id'}

def generate_new_id(cursor, table_name, column_name, prefix, padding=6):
    """Generate sequential IDs with prefix (e.g., PAT000001)."""
    # Validate inputs against whitelist
    if table_name not in ALLOWED_TABLES:
        raise Error(f"Invalid table name: {table_name}")
    if column_name not in ALLOWED_ID_COLUMNS:
        raise Error(f"Invalid column name: {column_name}")
    
    try:
        # Get max ID from database
        query = f"SELECT MAX(`{column_name}`) as max_id FROM `{table_name}`"
        cursor.execute(query)
        result = cursor.fetchone()
        
        # Extract max_id value
        if isinstance(result, dict):
            max_id = result.get('max_id')
        elif result:
            max_id = result[0]
        else:
            max_id = None
        
        # Calculate next number
        if max_id is None:
            new_number = 1
        else:
            # Extract numeric part from existing ID
            if max_id.startswith(prefix):
                numeric_part = max_id[len(prefix):]
            else:
                numeric_part = ''.join(filter(str.isdigit, max_id))
            
            try:
                new_number = int(numeric_part) + 1
            except ValueError:
                new_number = 1
        
        # Format with zero padding
        formatted_number = str(new_number).zfill(padding)
        new_id = f"{prefix}{formatted_number}"
        
        return new_id
        
    except Error as e:
        raise Error(f"Error generating new ID: {e}")

