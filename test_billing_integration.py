"""
Test script to verify billing calculation is correct.
This script:
1. Creates a patient
2. Creates an encounter for the patient
3. Creates a diagnosis for the encounter
4. Creates procedures with costs
5. Creates medications with costs
6. Creates a claim/billing
7. Verifies that billed_amount matches the sum of procedure costs + medication costs
"""

import sys
import os
from datetime import date, datetime

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from app.db import get_db_connection, get_db_cursor
from app.models import (
    PatientsModel, EncountersModel, DiagnosesModel, 
    ProceduresModel, MedicationsModel, ClaimsAndBillingModel
)
from app.utils import generate_new_id
from mysql.connector import Error


def test_billing_integration():
    """
    Complete integration test for billing calculation.
    """
    print("=" * 60)
    print("Billing Integration Test")
    print("=" * 60)
    
    conn = None
    patient_id = None
    encounter_id = None
    provider_id = None
    diagnosis_id = None
    procedure_ids = []
    medication_ids = []
    billing_id = None
    
    try:
        conn = get_db_connection()
        cursor = get_db_cursor(conn)
        
        # Step 1: Create a test patient
        print("\n1. Creating test patient...")
        # Get insurance code from database first
        cursor.execute("SELECT code FROM insurers LIMIT 1")
        insurer_result = cursor.fetchone()
        insurance_code = None
        if insurer_result:
            insurance_code = insurer_result['code']
            print(f"   Found insurance provider: {insurance_code}")
        else:
            print("   ⚠ No insurance providers found in database")
        
        patient_data = {
            'first_name': 'Test',
            'last_name': 'Patient',
            'dob': '1990-01-15',
            'gender': 'Male',
            'ethnicity': 'Caucasian',
            'insurance_type': insurance_code,  # Use insurance code from database
            'marital_status': 'Single',
            'address': '123 Test Street',
            'city': 'Test City',
            'state': 'TS',
            'zip': '12345',
            'phone': '555-0123',
            'email': 'test.patient@example.com',
            'registration_date': date.today().isoformat()
        }
        
        patient_id = PatientsModel.add(patient_data)
        print(f"   ✓ Patient created: {patient_id}")
        
        # Step 2: Get or create a provider (need provider_id for encounter)
        print("\n2. Getting provider for encounter...")
        cursor.execute("SELECT provider_id FROM providers LIMIT 1")
        provider_result = cursor.fetchone()
        if not provider_result:
            raise Error("No providers found in database. Please ensure providers are loaded.")
        provider_id = provider_result['provider_id']
        print(f"   ✓ Using provider: {provider_id}")
        
        # Step 3: Create an encounter
        print("\n3. Creating encounter...")
        encounter_data = {
            'patient_id': patient_id,
            'provider_id': provider_id,
            'visit_date': date.today().isoformat(),
            'visit_type': 'Emergency',
            'department': 'Emergency',
            'reason_for_visit': 'Test visit for billing verification',
            'diagnosis_code': 'Z00.00',
            'admission_type': 'Emergency',
            'status': 'Completed'
        }
        encounter_id = EncountersModel.add(encounter_data)
        print(f"   ✓ Encounter created: {encounter_id}")
        
        # Step 4: Create a diagnosis
        print("\n4. Creating diagnosis...")
        diagnosis_data = {
            'encounter_id': encounter_id,
            'diagnosis_code': 'Z00.00',
            'diagnosis_description': 'General health examination',
            'primary_flag': True,
            'chronic_flag': False
        }
        diagnosis_id = DiagnosesModel.add(diagnosis_data)
        print(f"   ✓ Diagnosis created: {diagnosis_id}")
        
        # Step 5: Create procedures with costs
        print("\n5. Creating procedures with costs...")
        procedures_data = [
            {
                'encounter_id': encounter_id,
                'procedure_code': '99213',
                'procedure_description': 'Office visit, established patient',
                'procedure_date': date.today().isoformat(),
                'provider_id': provider_id,
                'procedure_cost': 250.00
            },
            {
                'encounter_id': encounter_id,
                'procedure_code': '36415',
                'procedure_description': 'Routine venipuncture',
                'procedure_date': date.today().isoformat(),
                'provider_id': provider_id,
                'procedure_cost': 50.00
            }
        ]
        
        total_procedure_cost = 0
        for proc_data in procedures_data:
            proc_id = ProceduresModel.add(proc_data)
            procedure_ids.append(proc_id)
            total_procedure_cost += proc_data['procedure_cost']
            print(f"   ✓ Procedure created: {proc_id} (${proc_data['procedure_cost']:.2f})")
        
        print(f"   Total procedure costs: ${total_procedure_cost:.2f}")
        
        # Step 6: Create medications with costs
        print("\n6. Creating medications with costs...")
        medications_data = [
            {
                'encounter_id': encounter_id,
                'drug_name': 'Ibuprofen',
                'dosage': '200mg',
                'route': 'Oral',
                'frequency': 'Every 8 hours',
                'duration': '7 days',
                'prescribed_date': date.today().isoformat(),
                'prescriber_id': provider_id,
                'cost': 25.50
            },
            {
                'encounter_id': encounter_id,
                'drug_name': 'Amoxicillin',
                'dosage': '500mg',
                'route': 'Oral',
                'frequency': 'Twice daily',
                'duration': '10 days',
                'prescribed_date': date.today().isoformat(),
                'prescriber_id': provider_id,
                'cost': 45.75
            }
        ]
        
        total_medication_cost = 0
        for med_data in medications_data:
            med_id = MedicationsModel.add(med_data)
            medication_ids.append(med_id)
            total_medication_cost += med_data['cost']
            print(f"   ✓ Medication created: {med_id} (${med_data['cost']:.2f})")
        
        print(f"   Total medication costs: ${total_medication_cost:.2f}")
        
        # Expected total billing amount
        expected_total = total_procedure_cost + total_medication_cost
        print(f"\n   Expected total billing amount: ${expected_total:.2f}")
        
        # Step 7: Create claim/billing
        print("\n7. Creating claim/billing...")
        claim_data = {
            'encounter_id': encounter_id,
            'claim_billing_date': date.today().isoformat(),
            'billed_amount': expected_total,  # Set manually for now
            'paid_amount': 0.00,
            'claim_status': 'Pending',
            'payment_method': None,
            'insurance_provider': patient_data.get('insurance_type')
        }
        billing_id = ClaimsAndBillingModel.add(claim_data)
        print(f"   ✓ Billing created: {billing_id}")
        
        # Step 8: Verify billing calculation using sync method
        print("\n8. Syncing billing amount from encounter costs...")
        success = ClaimsAndBillingModel.sync_claim_amount(encounter_id)
        if success:
            print("   ✓ Billing amount synced successfully")
        else:
            print("   ⚠ Sync method returned False or created new billing")
        
        # Re-retrieve billing_id after sync (it might have created a new one)
        cursor.execute("SELECT billing_id FROM claims_and_billing WHERE encounter_id = %s ORDER BY claim_billing_date DESC LIMIT 1", (encounter_id,))
        updated_billing = cursor.fetchone()
        if updated_billing:
            billing_id = updated_billing['billing_id']
            print(f"   Using billing ID: {billing_id}")
        
        # Step 9: Retrieve the billing record and verify
        print("\n9. Verifying billing amount...")
        billing_record = ClaimsAndBillingModel.get_by_id(billing_id)
        
        if not billing_record:
            # Try to find by encounter_id
            cursor.execute("""
                SELECT * FROM claims_and_billing 
                WHERE encounter_id = %s 
                ORDER BY claim_billing_date DESC 
                LIMIT 1
            """, (encounter_id,))
            billing_record = cursor.fetchone()
        
        if billing_record:
            actual_billed = float(billing_record['billed_amount'])
            print(f"   Actual billed amount: ${actual_billed:.2f}")
            print(f"   Expected amount: ${expected_total:.2f}")
            
            # Allow small floating point differences
            if abs(actual_billed - expected_total) < 0.01:
                print("\n" + "=" * 60)
                print("✓ SUCCESS: Billing amount is correct!")
                print("=" * 60)
                return True
            else:
                print("\n" + "=" * 60)
                print(f"✗ FAILED: Billing amount mismatch!")
                print(f"   Expected: ${expected_total:.2f}")
                print(f"   Actual: ${actual_billed:.2f}")
                print(f"   Difference: ${abs(actual_billed - expected_total):.2f}")
                print("=" * 60)
                
                # Show breakdown
                cursor.execute("""
                    SELECT SUM(procedure_cost) as proc_total 
                    FROM procedures 
                    WHERE encounter_id = %s
                """, (encounter_id,))
                proc_result = cursor.fetchone()
                
                cursor.execute("""
                    SELECT SUM(cost) as med_total 
                    FROM medications 
                    WHERE encounter_id = %s
                """, (encounter_id,))
                med_result = cursor.fetchone()
                
                print(f"\n   Breakdown:")
                print(f"   - Procedures: ${proc_result['proc_total'] or 0:.2f}")
                print(f"   - Medications: ${med_result['med_total'] or 0:.2f}")
                print(f"   - Total should be: ${(proc_result['proc_total'] or 0) + (med_result['med_total'] or 0):.2f}")
                return False
        else:
            print("\n" + "=" * 60)
            print("✗ FAILED: Could not retrieve billing record")
            print("=" * 60)
            return False
            
    except Error as e:
        print("\n" + "=" * 60)
        print(f"✗ DATABASE ERROR: {e}")
        print("=" * 60)
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"✗ ERROR: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
        raise
    finally:
        # Cleanup: Delete test data in reverse order (to respect foreign key constraints)
        if conn and conn.is_connected():
            try:
                # Cleanup is optional - uncomment the cleanup section if you want automatic cleanup
                # Or keep it commented to retain test data for manual inspection
                AUTO_CLEANUP = False  # Set to True for automatic cleanup
                
                if AUTO_CLEANUP:
                    print("\nCleaning up test data...")
                    cursor = get_db_cursor(conn)
                    if billing_id:
                        cursor.execute("DELETE FROM claims_and_billing WHERE billing_id = %s", (billing_id,))
                        print(f"   Deleted billing: {billing_id}")
                    for med_id in medication_ids:
                        cursor.execute("DELETE FROM medications WHERE medication_id = %s", (med_id,))
                        print(f"   Deleted medication: {med_id}")
                    for proc_id in procedure_ids:
                        cursor.execute("DELETE FROM procedures WHERE procedure_id = %s", (proc_id,))
                        print(f"   Deleted procedure: {proc_id}")
                    if diagnosis_id:
                        cursor.execute("DELETE FROM diagnoses WHERE diagnosis_id = %s", (diagnosis_id,))
                        print(f"   Deleted diagnosis: {diagnosis_id}")
                    if encounter_id:
                        cursor.execute("DELETE FROM encounters WHERE encounter_id = %s", (encounter_id,))
                        print(f"   Deleted encounter: {encounter_id}")
                    if patient_id:
                        cursor.execute("DELETE FROM patients WHERE patient_id = %s", (patient_id,))
                        print(f"   Deleted patient: {patient_id}")
                    conn.commit()
                    print("   ✓ Cleanup complete")
                else:
                    print("\n" + "=" * 60)
                    print("Test data retained in database for inspection:")
                    print(f"   Patient ID: {patient_id}")
                    print(f"   Encounter ID: {encounter_id}")
                    print(f"   Billing ID: {billing_id}")
                    print(f"   Procedure IDs: {', '.join(procedure_ids) if procedure_ids else 'None'}")
                    print(f"   Medication IDs: {', '.join(medication_ids) if medication_ids else 'None'}")
                    print("=" * 60)
            except Exception as cleanup_error:
                print(f"\nWarning: Cleanup failed: {cleanup_error}")
                if conn:
                    conn.rollback()
            finally:
                if 'cursor' in locals() and cursor:
                    cursor.close()
                if conn:
                    conn.close()


if __name__ == "__main__":
    try:
        success = test_billing_integration()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nTest failed with exception: {e}")
        sys.exit(1)

