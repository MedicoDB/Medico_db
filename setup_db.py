import mysql.connector
from mysql.connector import errorcode
from settings import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
from table_definitions import CREATE_TABLES_SQL
import os

def setup_database():
    try:
        print(f"Connecting to MySQL server as user '{DB_USER}'...")
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        print("Server connection successful.")

        print(f"Creating database '{DB_NAME}' if it does not exist...")
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        print(f"Database '{DB_NAME}' is ready.")
        cursor.close()
        conn.close()

        print(f"Reconnecting to the '{DB_NAME}' database...")
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            allow_local_infile=True  
        )
        cursor = conn.cursor()
        print("Database connection successful.")

        print("Creating tables...")
        for statement in CREATE_TABLES_SQL:
            try:
                cursor.execute(statement)
            except mysql.connector.Error as err:
                print(f"Error while creating a table: {err}")
        print("All tables created successfully!")

        print("\nLoading data from CSV files...")
        
        script_dir = os.path.dirname(__file__) 
        dataset_path = os.path.abspath(os.path.join(script_dir, 'Dataset_renewed'))

        csv_files_in_order = [
            ('insurers', 'insurers.csv', ''),
            ('specialty_heads', 'specialty_heads.csv', ''),
            ('patients', 'patients.csv', "(patient_id,first_name,last_name,@dob,age,gender,ethnicity,insurance_type,marital_status,address,city,state,zip,phone,email,@registration_date) SET dob = STR_TO_DATE(@dob, '%d-%m-%Y'), registration_date = STR_TO_DATE(@registration_date, '%d-%m-%Y')"),
            ('providers', 'providers.csv', "(provider_id,name,department,specialty,npi,@inhouse,location,years_experience,contact_info,email,head_id) SET inhouse = (@inhouse = 'Yes')"),
            ('encounters', 'encounters.csv', "(encounter_id,patient_id,provider_id,@visit_date,visit_type,department,reason_for_visit,diagnosis_code,admission_type,@discharge_date,length_of_stay,status,@readmitted_flag) SET visit_date = STR_TO_DATE(@visit_date, '%d-%m-%Y'), discharge_date = IF(@discharge_date = '', NULL, STR_TO_DATE(@discharge_date, '%d-%m-%Y')), readmitted_flag = (@readmitted_flag = 'Yes')"),
            ('diagnoses', 'diagnoses.csv', "(diagnosis_id,encounter_id,diagnosis_code,diagnosis_description,@primary_flag,@chronic_flag) SET primary_flag = (@primary_flag = 'TRUE'), chronic_flag = (@chronic_flag = 'TRUE')"),
            ('procedures', 'procedures.csv', "(procedure_id,encounter_id,procedure_code,procedure_description,@procedure_date,provider_id,procedure_cost) SET procedure_date = STR_TO_DATE(@procedure_date, '%d-%m-%Y')"),
            ('lab_tests', 'lab_tests.csv', "(test_id,lab_id,encounter_id,test_name,test_code,specimen_type,test_result,units,normal_range,@test_date,status) SET test_date = STR_TO_DATE(@test_date, '%d-%m-%Y')"),
            ('medications', 'medications.csv', "(medication_id,encounter_id,drug_name,dosage,route,frequency,duration,@prescribed_date,prescriber_id,cost) SET prescribed_date = STR_TO_DATE(@prescribed_date, '%d-%m-%Y')"),
            ('claims_and_billing', 'claims_and_billing.csv', "(billing_id,patient_id,encounter_id,insurance_provider,payment_method,@claim_id_var,@claim_billing_date,billed_amount,paid_amount,claim_status,denial_reason) SET claim_billing_date = STR_TO_DATE(@claim_billing_date, '%d-%m-%Y %H:%i'), claim_id = NULLIF(@claim_id_var, '')"),
            ('denials', 'denials.csv', "(claim_id,denial_id,denial_reason_code,denial_reason_description,denied_amount,@denial_date,appeal_filed,appeal_status,@appeal_resolution_date,final_outcome) SET denial_date = STR_TO_DATE(@denial_date, '%d-%m-%Y'), appeal_resolution_date = IF(@appeal_resolution_date = '', NULL, STR_TO_DATE(@appeal_resolution_date, '%d-%m-%Y'))")
        ]

        for table_name, file_name, columns_and_setters in csv_files_in_order:
            file_path = os.path.join(dataset_path, file_name).replace('\\', '/')
            print(f"  -> Loading: {file_name} -> {table_name}")
            
            load_query = f"""
                LOAD DATA LOCAL INFILE '{file_path}'
                INTO TABLE {table_name}
                FIELDS TERMINATED BY ',' ENCLOSED BY '"'
                LINES TERMINATED BY '\\r\\n'
                IGNORE 1 ROWS
                {columns_and_setters}
            """
            cursor.execute(load_query)
            conn.commit() 

        print("All data loaded successfully!")

    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("ERROR: Incorrect username or password.")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print(f"ERROR: Database '{DB_NAME}' does not exist.")
        else:
            print(f"ERROR: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("MySQL connection closed.")

if __name__ == "__main__":
    setup_database()