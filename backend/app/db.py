"""
Database connection module using mysql.connector.
Provides connection handling with error management.
NO ORM - Raw SQL only.
"""
import mysql.connector
from mysql.connector import Error, errorcode
from settings import DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT


def get_conn():
    """
    Create and return a database connection.
    
    Returns:
        mysql.connector.connection.MySQLConnection: Database connection object
        
    Raises:
        mysql.connector.Error: If connection fails
    """
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            autocommit=False
        )
        return conn
    except Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            raise Error("Access denied: Check username and password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            raise Error(f"Database '{DB_NAME}' does not exist")
        else:
            raise Error(f"Database connection error: {err}")