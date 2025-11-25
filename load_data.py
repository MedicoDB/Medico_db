import mysql.connector
import csv
import os
from settings import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
from datetime import datetime

def load_csv_data():
    """Load CSV data into database tables using Python CSV reader"""
    try:
        print(f"Connecting to MySQL database '{DB_NAME}'...")
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        cursor = conn.cursor()
        print("Connected successfully!\n")

        script_dir = os.path.dirname(__file__)
        dataset_path = os.path.join(script_dir, 'Dataset_renewed')

        # Define the order and column mappings
        csv_files = [
            ('insurers', 'insurers.csv', ['insurer_id', 'code', 'name', 'payer_type']),
            ('specialty_heads', 'specialty_heads.csv', ['head_id', 'specialty', 'head_provider_id', 'head_name', 'head_email']),
            ('patients', 'patients.csv', [
                'patient_id', 'first_name', 'last_name', 'dob', 'age', 'gender', 
                'ethnicity', 'insurance_type', 'marital_status', 'address', 
                'city', 'state', 'zip', 'phone', 'email', 'registration_date'
            ]),
            ('providers', 'providers.csv', [
                'provider_id', 'name', 'department', 'specialty', 'npi', 
                'inhouse', 'location', 'years_experience', 'contact_info', 'email', 'head_id'
            ]),
            ('encounters', 'encounters.csv', [
                'encounter_id', 'patient_id', 'provider_id', 'visit_date', 'visit_type', 
                'department', 'reason_for_visit', 'diagnosis_code', 'admission_type', 
                'discharge_date', 'length_of_stay', 'status', 'readmitted_flag'
            ]),
            ('diagnoses', 'diagnoses.csv', [
                'diagnosis_id', 'encounter_id', 'diagnosis_code', 'diagnosis_description', 
                'primary_flag', 'chronic_flag'
            ]),
            ('procedures', 'procedures.csv', [
                'procedure_id', 'encounter_id', 'procedure_code', 'procedure_description', 
                'procedure_date', 'provider_id', 'procedure_cost'
            ]),
            ('lab_tests', 'lab_tests.csv', [
                'test_id', 'lab_id', 'encounter_id', 'test_name', 'test_code', 
                'specimen_type', 'test_result', 'units', 'normal_range', 'test_date', 'status'
            ]),
            ('medications', 'medications.csv', [
                'medication_id', 'encounter_id', 'drug_name', 'dosage', 'route', 
                'frequency', 'duration', 'prescribed_date', 'prescriber_id', 'cost'
            ]),
            ('claims_and_billing', 'claims_and_billing.csv', [
                'billing_id', 'patient_id', 'encounter_id', 'insurance_provider', 
                'payment_method', 'claim_id', 'claim_billing_date', 'billed_amount', 
                'paid_amount', 'claim_status', 'denial_reason'
            ]),
            ('denials', 'denials.csv', [
                'claim_id', 'denial_id', 'denial_reason_code', 'denial_reason_description', 
                'denied_amount', 'denial_date', 'appeal_filed', 'appeal_status', 
                'appeal_resolution_date', 'final_outcome'
            ]),
        ]

        for table_name, file_name, columns in csv_files:
            file_path = os.path.join(dataset_path, file_name)
            
            if not os.path.exists(file_path):
                print(f"⚠️  Skipping {file_name} - file not found")
                continue

            print(f"Loading {file_name} into {table_name}...")
            
            # Clear existing data (disable foreign key checks temporarily)
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute(f"DELETE FROM {table_name}")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            # Read CSV and insert data
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                row_count = 0
                
                for row in reader:
                    try:
                        if table_name == 'patients':
                            # Parse date fields
                            dob = datetime.strptime(row['dob'], '%d-%m-%Y').date() if row['dob'] else None
                            reg_date = datetime.strptime(row['registration_date'], '%d-%m-%Y').date() if row['registration_date'] else None
                            cursor.execute("""
                                INSERT INTO patients (patient_id, first_name, last_name, dob, age, gender, 
                                    ethnicity, insurance_type, marital_status, address, city, state, zip, 
                                    phone, email, registration_date)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['patient_id'], row['first_name'], row['last_name'], dob, 
                                int(row['age']) if row['age'] else None, row['gender'], 
                                row['ethnicity'], row['insurance_type'], row['marital_status'], 
                                row['address'], row['city'], row['state'], row['zip'], 
                                row['phone'] if row['phone'] else None, 
                                row['email'] if row['email'] else None, reg_date
                            ))
                        
                        elif table_name == 'providers':
                            inhouse = row['inhouse'].strip().lower() == 'yes' if row['inhouse'] else False
                            cursor.execute("""
                                INSERT INTO providers (provider_id, name, department, specialty, npi, 
                                    inhouse, location, years_experience, contact_info, email, head_id)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['provider_id'], row['name'], row['department'], row['specialty'], 
                                row['npi'], inhouse, row['location'], 
                                int(row['years_experience']) if row['years_experience'] else None,
                                row['contact_info'], row['email'], row['head_id'] if row['head_id'] else None
                            ))
                        
                        elif table_name == 'encounters':
                            visit_date = datetime.strptime(row['visit_date'], '%d-%m-%Y').date() if row['visit_date'] else None
                            discharge_date = datetime.strptime(row['discharge_date'], '%d-%m-%Y').date() if row['discharge_date'] and row['discharge_date'].strip() else None
                            readmitted = row['readmitted_flag'].strip().lower() == 'yes' if row['readmitted_flag'] else False
                            cursor.execute("""
                                INSERT INTO encounters (encounter_id, patient_id, provider_id, visit_date, 
                                    visit_type, department, reason_for_visit, diagnosis_code, admission_type, 
                                    discharge_date, length_of_stay, status, readmitted_flag)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['encounter_id'], row['patient_id'], row['provider_id'], visit_date,
                                row['visit_type'], row['department'], row['reason_for_visit'], 
                                row['diagnosis_code'], row['admission_type'], discharge_date,
                                int(row['length_of_stay']) if row['length_of_stay'] and row['length_of_stay'].strip() else None,
                                row['status'], readmitted
                            ))
                        
                        elif table_name == 'diagnoses':
                            primary = row['primary_flag'].strip().upper() == 'TRUE' if row['primary_flag'] else False
                            chronic = row['chronic_flag'].strip().upper() == 'TRUE' if row['chronic_flag'] else False
                            cursor.execute("""
                                INSERT INTO diagnoses (diagnosis_id, encounter_id, diagnosis_code, 
                                    diagnosis_description, primary_flag, chronic_flag)
                                VALUES (%s, %s, %s, %s, %s, %s)
                            """, (
                                row['diagnosis_id'], row['encounter_id'], row['diagnosis_code'],
                                row['diagnosis_description'], primary, chronic
                            ))
                        
                        elif table_name == 'procedures':
                            proc_date = datetime.strptime(row['procedure_date'], '%d-%m-%Y').date() if row['procedure_date'] else None
                            cursor.execute("""
                                INSERT INTO procedures (procedure_id, encounter_id, procedure_code, 
                                    procedure_description, procedure_date, provider_id, procedure_cost)
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['procedure_id'], row['encounter_id'], row['procedure_code'],
                                row['procedure_description'], proc_date, row['provider_id'],
                                float(row['procedure_cost']) if row['procedure_cost'] else None
                            ))
                        
                        elif table_name == 'lab_tests':
                            test_date = datetime.strptime(row['test_date'], '%d-%m-%Y').date() if row['test_date'] else None
                            cursor.execute("""
                                INSERT INTO lab_tests (test_id, lab_id, encounter_id, test_name, test_code, 
                                    specimen_type, test_result, units, normal_range, test_date, status)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['test_id'], row['lab_id'], row['encounter_id'], row['test_name'],
                                row['test_code'], row['specimen_type'], row['test_result'],
                                row['units'], row['normal_range'], test_date, row['status']
                            ))
                        
                        elif table_name == 'medications':
                            presc_date = datetime.strptime(row['prescribed_date'], '%d-%m-%Y').date() if row['prescribed_date'] else None
                            cursor.execute("""
                                INSERT INTO medications (medication_id, encounter_id, drug_name, dosage, 
                                    route, frequency, duration, prescribed_date, prescriber_id, cost)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['medication_id'], row['encounter_id'], row['drug_name'], row['dosage'],
                                row['route'], row['frequency'], row['duration'], presc_date,
                                row['prescriber_id'], float(row['cost']) if row['cost'] else None
                            ))
                        
                        elif table_name == 'claims_and_billing':
                            claim_date = datetime.strptime(row['claim_billing_date'], '%d-%m-%Y %H:%M').date() if row['claim_billing_date'] else None
                            claim_id = row['claim_id'] if row['claim_id'] and row['claim_id'].strip() else None
                            cursor.execute("""
                                INSERT INTO claims_and_billing (billing_id, patient_id, encounter_id, 
                                    insurance_provider, payment_method, claim_id, claim_billing_date, 
                                    billed_amount, paid_amount, claim_status, denial_reason)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['billing_id'], row['patient_id'], row['encounter_id'],
                                row['insurance_provider'], row['payment_method'], claim_id, claim_date,
                                float(row['billed_amount']) if row['billed_amount'] else None,
                                float(row['paid_amount']) if row['paid_amount'] else None,
                                row['claim_status'], row['denial_reason'] if row['denial_reason'] else None
                            ))
                        
                        elif table_name == 'denials':
                            denial_date = datetime.strptime(row['denial_date'], '%d-%m-%Y').date() if row['denial_date'] else None
                            appeal_res_date = datetime.strptime(row['appeal_resolution_date'], '%d-%m-%Y').date() if row['appeal_resolution_date'] and row['appeal_resolution_date'].strip() else None
                            cursor.execute("""
                                INSERT INTO denials (claim_id, denial_id, denial_reason_code, 
                                    denial_reason_description, denied_amount, denial_date, appeal_filed, 
                                    appeal_status, appeal_resolution_date, final_outcome)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                row['claim_id'], row['denial_id'], row['denial_reason_code'],
                                row['denial_reason_description'], 
                                float(row['denied_amount']) if row['denied_amount'] else None,
                                denial_date, row['appeal_filed'], row['appeal_status'],
                                appeal_res_date, row['final_outcome']
                            ))
                        
                        else:
                            # Simple tables - use all columns from CSV
                            if columns:
                                values = [row.get(col, '') if row.get(col) else None for col in columns]
                                placeholders = ', '.join(['%s'] * len(values))
                                cols = ', '.join(columns)
                                cursor.execute(f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})", values)
                            else:
                                # Auto-detect columns from CSV
                                values = [row[col] if row[col] else None for col in row.keys()]
                                placeholders = ', '.join(['%s'] * len(values))
                                cols = ', '.join(row.keys())
                                cursor.execute(f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})", values)
                        
                        row_count += 1
                        if row_count % 1000 == 0:
                            conn.commit()
                            print(f"  ... {row_count} rows inserted")
                    
                    except Exception as e:
                        print(f"  ⚠️  Error inserting row {row_count + 1}: {e}")
                        continue
                
                conn.commit()
                print(f"  ✅ Loaded {row_count} rows into {table_name}\n")

        print("✅ All data loaded successfully!")
        
        # Verify counts
        print("\n📊 Data Summary:")
        tables_to_check = ['patients', 'encounters', 'procedures', 'medications', 'claims_and_billing']
        for table in tables_to_check:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count:,} rows")

    except mysql.connector.Error as err:
        print(f"❌ Database Error: {err}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("\n✅ Database connection closed.")

if __name__ == "__main__":
    load_csv_data()

