"""
Utility functions for the Hospital Management System.
Location: backend/app/utils.py
"""
from mysql.connector import Error

def generate_new_id(cursor, table_name, column_name, prefix, padding=6):
    """
    Generates IDs like PAT000001, BILL000001, DEN00001.
    """
    try:
        query = f"SELECT MAX({column_name}) as max_id FROM {table_name}"
        cursor.execute(query)
        result = cursor.fetchone()
        
        if isinstance(result, dict):
            max_id = result.get('max_id')
        elif result:
            max_id = result[0]
        else:
            max_id = None
        
        if max_id is None:
            new_number = 1
        else:
            if max_id.startswith(prefix):
                numeric_part = max_id[len(prefix):]
            else:
                numeric_part = ''.join(filter(str.isdigit, max_id))
            
            try:
                new_number = int(numeric_part) + 1
            except ValueError:
                new_number = 1
        
        formatted_number = str(new_number).zfill(padding)
        new_id = f"{prefix}{formatted_number}"
        
        return new_id
        
    except Error as e:
        raise Error(f"Error generating new ID: {e}")