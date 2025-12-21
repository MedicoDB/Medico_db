"""
Clean database setup script.
Creates all tables from table_definitions.py and loads data from Dataset_renewed CSV files.
"""
import mysql.connector
from mysql.connector import errorcode
from settings import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
from table_definitions import CREATE_TABLES_SQL
import os

def drop_existing_tables(cursor):
    """Drop all existing tables in reverse dependency order."""
    tables = [
        'denials', 'claims_and_billing', 'medications', 'lab_tests', 
        'procedures', 'diagnoses', 'encounters', 'providers', 
        'patients', 'department_heads', 'insurers'
    ]
    cursor.execute('SET FOREIGN_KEY_CHECKS = 0')
    for table in tables:
        try:
            cursor.execute(f'DROP TABLE IF EXISTS {table}')
        except:
            pass
    cursor.execute('SET FOREIGN_KEY_CHECKS = 1')

def create_tables(cursor, conn):
    """Create all tables from table_definitions."""
    print("Creating tables...")
    
    for statement in CREATE_TABLES_SQL:
        statement = statement.strip()
        if not statement:
            continue
        
        try:
            if "ALTER TABLE" in statement.upper():
                cursor.execute(statement)
            else:
                cursor.execute(statement)
            conn.commit()
        except mysql.connector.Error as err:
            if err.errno != errorcode.ER_TABLE_EXISTS_ERROR and "Duplicate foreign key constraint" not in str(err):
                print(f"Error creating table: {err}")
                raise

def load_csv_data(cursor, conn, dataset_path):
    """Load data from CSV files."""
    print("Loading data from CSV files...")
    
    csv_files = [
        ('insurers', 'insurers.csv', '(insurer_id,code,name,payer_type,phone)'),
        ('department_heads', 'department_heads.csv', 
         "(head_id,department,head_provider_id,head_name,head_email) SET head_email = NULLIF(head_email, '')"),
        ('patients', 'patients.csv', 
         "(patient_id,first_name,last_name,@dob,age,gender,ethnicity,insurance_type,marital_status,address,city,state,zip,phone,@email,@registration_date) SET dob = STR_TO_DATE(@dob, '%d-%m-%Y'), registration_date = STR_TO_DATE(@registration_date, '%d-%m-%Y'), email = NULLIF(@email, '')"),
        ('providers', 'providers.csv', 
         "(provider_id,name,department,specialty,npi,@inhouse,location,years_experience,contact_info,@email,head_id) SET inhouse = (@inhouse = 'Yes'), email = NULLIF(@email, '')"),
        ('encounters', 'encounters.csv', 
         "(encounter_id,patient_id,provider_id,@visit_date,visit_type,department,reason_for_visit,diagnosis_code,admission_type,@discharge_date,length_of_stay,status,@readmitted_flag) SET visit_date = STR_TO_DATE(@visit_date, '%d-%m-%Y'), discharge_date = IF(@discharge_date = '', NULL, STR_TO_DATE(@discharge_date, '%d-%m-%Y')), readmitted_flag = (@readmitted_flag = 'Yes')"),
        ('diagnoses', 'diagnoses.csv', 
         "(diagnosis_id,encounter_id,diagnosis_code,diagnosis_description,@primary_flag,@chronic_flag) SET primary_flag = (@primary_flag = 'TRUE'), chronic_flag = (@chronic_flag = 'TRUE')"),
        ('procedures', 'procedures.csv', 
         "(procedure_id,encounter_id,procedure_code,procedure_description,@procedure_date,provider_id,procedure_cost) SET procedure_date = STR_TO_DATE(@procedure_date, '%d-%m-%Y')"),
        ('lab_tests', 'lab_tests.csv', 
         "(test_id,lab_id,encounter_id,test_name,test_code,specimen_type,test_result,units,normal_range,@test_date,status) SET test_date = STR_TO_DATE(@test_date, '%d-%m-%Y')"),
        ('medications', 'medications.csv', 
         "(medication_id,encounter_id,drug_name,dosage,route,frequency,duration,@prescribed_date,prescriber_id,cost) SET prescribed_date = STR_TO_DATE(@prescribed_date, '%d-%m-%Y')"),
        ('claims_and_billing', 'claims_and_billing.csv', 
         "(billing_id,patient_id,encounter_id,insurance_provider,payment_method,@claim_id_var,@claim_billing_date,billed_amount,paid_amount,claim_status,denial_reason) SET claim_billing_date = STR_TO_DATE(@claim_billing_date, '%d-%m-%Y %H:%i'), claim_id = NULLIF(@claim_id_var, '')"),
        ('denials', 'denials.csv', 
         "(claim_id,denial_id,denial_reason_code,denial_reason_description,denied_amount,@denial_date,appeal_filed,appeal_status,@appeal_resolution_date,final_outcome) SET denial_date = STR_TO_DATE(@denial_date, '%d-%m-%Y'), appeal_resolution_date = IF(@appeal_resolution_date = '', NULL, STR_TO_DATE(@appeal_resolution_date, '%d-%m-%Y'))")
    ]
    
    # Disable foreign key checks for faster loading
    cursor.execute('SET SESSION foreign_key_checks = 0')
    
    for table_name, file_name, columns_and_setters in csv_files:
        file_path = os.path.join(dataset_path, file_name).replace('\\', '/')
        
        if not os.path.exists(file_path):
            print(f"Warning: File not found - {file_name}")
            continue
        
        try:
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                continue
            
            load_query = f"""
                LOAD DATA LOCAL INFILE '{file_path}'
                INTO TABLE {table_name}
                FIELDS TERMINATED BY ',' 
                OPTIONALLY ENCLOSED BY '"'
                ESCAPED BY '\\\\'
                LINES TERMINATED BY '\\n'
                IGNORE 1 LINES
                {columns_and_setters}
            """
            
            cursor.execute(f"SELECT COUNT(*) as cnt FROM {table_name}")
            count_before = cursor.fetchone()[0]
            
            cursor.execute(load_query)
            conn.commit()
            
            cursor.execute(f"SELECT COUNT(*) as cnt FROM {table_name}")
            count_after = cursor.fetchone()[0]
            rows_loaded = count_after - count_before
            
            if rows_loaded > 0:
                print(f"  {table_name:20s}: {rows_loaded:>8,} rows")
            
        except mysql.connector.Error as err:
            print(f"Error loading {table_name}: {err}")
            conn.rollback()
    
    cursor.execute('SET SESSION foreign_key_checks = 1')

def verify_setup(cursor):
    """Verify database setup by checking row counts."""
    tables = [
        'insurers', 'department_heads', 'patients', 'providers',
        'encounters', 'diagnoses', 'procedures', 'lab_tests',
        'medications', 'claims_and_billing', 'denials'
    ]
    
    total_rows = 0
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            result = cursor.fetchone()
            count = result[0] if result else 0
            total_rows += count
        except Exception as e:
            print(f"Error checking {table}: {e}")
    
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = %s
        AND REFERENCED_TABLE_NAME IS NOT NULL
    """, (DB_NAME,))
    result = cursor.fetchone()
    fk_count = result[0] if result else 0
    
    print(f"\nTotal rows: {total_rows:,} | Foreign keys: {fk_count}")

def setup_database():
    """Main setup function."""
    conn = None
    try:
        print("Setting up database...")
        
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cursor = conn.cursor()
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS {DB_NAME} "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        cursor.close()
        conn.close()
        
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            allow_local_infile=True,
            autocommit=False
        )
        cursor = conn.cursor()
        
        try:
            cursor.execute('SET GLOBAL local_infile = 1')
        except:
            pass
        
        drop_existing_tables(cursor)
        create_tables(cursor, conn)
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        dataset_path = os.path.join(script_dir, 'Dataset_renewed')
        load_csv_data(cursor, conn, dataset_path)
        
        verify_setup(cursor)
        
        print("Setup complete!")
        
    except mysql.connector.Error as err:
        print(f"Database Error: {err}")
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Check your username and password in settings.py")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
    
    return True

if __name__ == "__main__":
    success = setup_database()
    exit(0 if success else 1)

