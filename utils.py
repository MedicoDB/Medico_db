"""
Utility functions for the Hospital Management System.
Contains ID generation logic for string-based primary keys.
"""
from mysql.connector import Error


def generate_new_id(cursor, table_name, column_name, prefix, padding=3):
    """
    Generate a new ID for a table with string-based primary keys.
    
    This function:
    1. Selects MAX(id) from the table
    2. If None, starts with 1 (e.g., "P-001")
    3. If exists, strips the prefix, converts to int, increments by 1
    4. Formats back to string with zero-padding
    
    Args:
        cursor: Database cursor object
        table_name (str): Name of the table
        column_name (str): Name of the ID column
        prefix (str): Prefix for the ID (e.g., "P-", "BILL", "ENC-")
        padding (int): Number of digits for zero-padding (default: 3)
        
    Returns:
        str: Newly generated ID (e.g., "P-001", "BILL005", "ENC-100")
        
    Raises:
        Error: If database query fails
    """
    try:
        # Query to get the maximum ID
        query = f"SELECT MAX({column_name}) as max_id FROM {table_name}"
        cursor.execute(query)
        result = cursor.fetchone()
        
        max_id = result.get('max_id') if result else None
        
        if max_id is None:
            # No existing records, start with 1
            new_number = 1
        else:
            # Extract the numeric part after the prefix
            if isinstance(max_id, str):
                # Remove prefix if it exists
                if max_id.startswith(prefix):
                    numeric_part = max_id[len(prefix):]
                else:
                    # If prefix not found, try to extract numbers from the end
                    numeric_part = ''.join(filter(str.isdigit, max_id))
                
                # Convert to int and increment
                try:
                    new_number = int(numeric_part) + 1
                except ValueError:
                    # If conversion fails, start with 1
                    new_number = 1
            else:
                # If max_id is not a string, convert to int and increment
                new_number = int(max_id) + 1
        
        # Format with zero-padding
        formatted_number = str(new_number).zfill(padding)
        new_id = f"{prefix}{formatted_number}"
        
        return new_id
        
    except Error as e:
        raise Error(f"Error generating new ID: {e}")

