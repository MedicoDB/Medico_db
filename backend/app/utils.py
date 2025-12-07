"""
Utility functions for the Hospital Management System.
Contains ID generation logic for string-based primary keys.
Age calculation is done directly in SQL using TIMESTAMPDIFF, not in Python.
"""
from mysql.connector import Error

# Whitelist of allowed table and column names for security
ALLOWED_TABLES = {'patients', 'encounters', 'claims_and_billing', 'medications', 'providers', 'denials'}
ALLOWED_ID_COLUMNS = {'patient_id', 'encounter_id', 'billing_id', 'medication_id', 'provider_id', 'denial_id'}

def generate_new_id(cursor, table_name, column_name, prefix, padding=6):
    """
    Generates IDs like PAT000001, BILL000001, DEN00001.
    Uses raw SQL queries with mysql.connector (NO ORM).
    """
    # Validate table and column names for security
    if table_name not in ALLOWED_TABLES:
        raise Error(f"Invalid table name: {table_name}")
    if column_name not in ALLOWED_ID_COLUMNS:
        raise Error(f"Invalid column name: {column_name}")
    
    try:
        # Use parameterized query structure (table/column names are whitelisted)
        query = f"SELECT MAX(`{column_name}`) as max_id FROM `{table_name}`"
        cursor.execute(query)
        result = cursor.fetchone()
        
        # Cursor dictionary=True ise result['max_id'], değilse result[0]
        if isinstance(result, dict):
            max_id = result.get('max_id')
        elif result:
            max_id = result[0]
        else:
            max_id = None
        
        if max_id is None:
            new_number = 1
        else:
            # Prefix'i temizle (örn: 'PAT001464' -> '001464')
            if max_id.startswith(prefix):
                numeric_part = max_id[len(prefix):]
            else:
                # Prefix yoksa sadece sayıları al
                numeric_part = ''.join(filter(str.isdigit, max_id))
            
            try:
                new_number = int(numeric_part) + 1
            except ValueError:
                new_number = 1
        
        # Belirtilen padding kadar sıfır ekle
        formatted_number = str(new_number).zfill(padding)
        new_id = f"{prefix}{formatted_number}"
        
        return new_id
        
    except Error as e:
        raise Error(f"Error generating new ID: {e}")

