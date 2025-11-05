import mysql.connector
from ...settings import DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT

def get_conn():
    
    return mysql.connector.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )