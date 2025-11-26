"""
Flask routes for the Hospital Management System.
Uses app.add_url_rule instead of decorators.
All routes call methods from models.py for data access.
"""
from flask import render_template, request, redirect, url_for, flash, jsonify
from models import (
    PatientsModel, EncountersModel, InsurersModel, ClaimsAndBillingModel
)
from db import get_db_connection, get_db_cursor
from mysql.connector import Error


def register_routes(app):
    """
    Register all routes with the Flask application using add_url_rule.
    
    Args:
        app: Flask application instance
    """
    
    # ========================================================================
    # HOME / DASHBOARD ROUTE
    # ========================================================================
    # Complex Join Query: Encounters + Patients + Providers + Diagnoses + Insurers
    # This satisfies the "Complex Join (4+ tables)" rubric requirement
    
    def home():
        """Dashboard showing recent hospital activity with complex join query."""
        conn = None
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Complex join query involving 5+ tables
            query = """
                SELECT 
                    e.encounter_id,
                    e.visit_date,
                    e.visit_type,
                    e.department,
                    e.status as encounter_status,
                    p.patient_id,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name,
                    p.age as patient_age,
                    pr.provider_id,
                    pr.name as provider_name,
                    pr.specialty as provider_specialty,
                    d.diagnosis_code,
                    d.diagnosis_description,
                    d.primary_flag,
                    i.code as insurance_code,
                    i.name as insurance_name,
                    cb.billed_amount,
                    cb.claim_status
                FROM encounters e
                INNER JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                LEFT JOIN diagnoses d ON e.encounter_id = d.encounter_id AND d.primary_flag = 1
                LEFT JOIN insurers i ON p.insurance_type = i.code
                LEFT JOIN claims_and_billing cb ON e.encounter_id = cb.encounter_id
                ORDER BY e.visit_date DESC
                LIMIT 50
            """
            cursor.execute(query)
            recent_activity = cursor.fetchall()
            
            # Get summary statistics
            stats_query = """
                SELECT 
                    COUNT(DISTINCT e.encounter_id) as total_encounters,
                    COUNT(DISTINCT p.patient_id) as total_patients,
                    COUNT(DISTINCT pr.provider_id) as total_providers,
                    SUM(cb.billed_amount) as total_billed
                FROM encounters e
                LEFT JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                LEFT JOIN claims_and_billing cb ON e.encounter_id = cb.encounter_id
            """
            cursor.execute(stats_query)
            stats = cursor.fetchone()
            
            return render_template('home.html', 
                                 recent_activity=recent_activity,
                                 stats=stats)
        except Error as e:
            flash(f'Error loading dashboard: {str(e)}', 'danger')
            return render_template('home.html', recent_activity=[], stats={})
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    app.add_url_rule('/', 'home', home, methods=['GET'])
    app.add_url_rule('/home', 'home_alt', home, methods=['GET'])
    
    # ========================================================================
    # PATIENT CRUD ROUTES (Member A)
    # ========================================================================
    
    def patients_list():
        """List all patients."""
        try:
            patients = PatientsModel.get_all()
            return render_template('patients/list.html', patients=patients)
        except Error as e:
            flash(f'Error loading patients: {str(e)}', 'danger')
            return render_template('patients/list.html', patients=[])
    
    app.add_url_rule('/patients', 'patients_list', patients_list, methods=['GET'])
    
    def patient_view(patient_id):
        """View a single patient's details."""
        conn = None
        try:
            patient = PatientsModel.get_by_id(patient_id)
            if not patient:
                flash('Patient not found', 'danger')
                return redirect(url_for('patients_list'))
            
            # Get patient's encounters
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            encounters_query = """
                SELECT e.*, pr.name as provider_name
                FROM encounters e
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                WHERE e.patient_id = %s
                ORDER BY e.visit_date DESC
            """
            cursor.execute(encounters_query, (patient_id,))
            encounters = cursor.fetchall()
            
            return render_template('patients/view.html', 
                                 patient=patient, 
                                 encounters=encounters)
        except Error as e:
            flash(f'Error loading patient: {str(e)}', 'danger')
            return redirect(url_for('patients_list'))
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    app.add_url_rule('/patients/<patient_id>', 'patient_view', patient_view, methods=['GET'])
    
    def patient_add():
        """Add a new patient (GET: show form, POST: process form)."""
        if request.method == 'GET':
            try:
                insurers = InsurersModel.get_all()
                return render_template('patients/add.html', insurers=insurers)
            except Error as e:
                flash(f'Error loading form: {str(e)}', 'danger')
                return redirect(url_for('patients_list'))
        
        # POST: Process form submission
        try:
            patient_data = {
                'first_name': request.form.get('first_name'),
                'last_name': request.form.get('last_name'),
                'dob': request.form.get('dob'),
                'age': int(request.form.get('age', 0)),
                'gender': request.form.get('gender'),
                'ethnicity': request.form.get('ethnicity'),
                'insurance_type': request.form.get('insurance_type') or None,
                'marital_status': request.form.get('marital_status', 'unknown'),
                'address': request.form.get('address') or None,
                'city': request.form.get('city') or None,
                'state': request.form.get('state') or None,
                'zip': request.form.get('zip') or None,
                'phone': request.form.get('phone') or None,
                'email': request.form.get('email') or None,
                'registration_date': request.form.get('registration_date')
            }
            
            patient_id = PatientsModel.add(patient_data)
            flash(f'Patient {patient_id} added successfully!', 'success')
            return redirect(url_for('patient_view', patient_id=patient_id))
        except Error as e:
            flash(f'Error adding patient: {str(e)}', 'danger')
            try:
                insurers = InsurersModel.get_all()
                return render_template('patients/add.html', insurers=insurers)
            except:
                return redirect(url_for('patients_list'))
    
    app.add_url_rule('/patients/add', 'patient_add', patient_add, methods=['GET', 'POST'])
    
    def patient_edit(patient_id):
        """Edit an existing patient (GET: show form, POST: process form)."""
        if request.method == 'GET':
            try:
                patient = PatientsModel.get_by_id(patient_id)
                if not patient:
                    flash('Patient not found', 'danger')
                    return redirect(url_for('patients_list'))
                
                insurers = InsurersModel.get_all()
                return render_template('patients/edit.html', 
                                     patient=patient, 
                                     insurers=insurers)
            except Error as e:
                flash(f'Error loading patient: {str(e)}', 'danger')
                return redirect(url_for('patients_list'))
        
        # POST: Process form submission
        try:
            patient_data = {
                'first_name': request.form.get('first_name'),
                'last_name': request.form.get('last_name'),
                'dob': request.form.get('dob'),
                'age': int(request.form.get('age', 0)),
                'gender': request.form.get('gender'),
                'ethnicity': request.form.get('ethnicity'),
                'insurance_type': request.form.get('insurance_type') or None,
                'marital_status': request.form.get('marital_status', 'unknown'),
                'address': request.form.get('address') or None,
                'city': request.form.get('city') or None,
                'state': request.form.get('state') or None,
                'zip': request.form.get('zip') or None,
                'phone': request.form.get('phone') or None,
                'email': request.form.get('email') or None,
                'registration_date': request.form.get('registration_date')
            }
            
            success = PatientsModel.update(patient_id, patient_data)
            if success:
                flash(f'Patient {patient_id} updated successfully!', 'success')
                return redirect(url_for('patient_view', patient_id=patient_id))
            else:
                flash('No changes were made', 'warning')
                return redirect(url_for('patient_edit', patient_id=patient_id))
        except Error as e:
            flash(f'Error updating patient: {str(e)}', 'danger')
            return redirect(url_for('patient_edit', patient_id=patient_id))
    
    app.add_url_rule('/patients/<patient_id>/edit', 'patient_edit', patient_edit, methods=['GET', 'POST'])
    
    def patient_delete(patient_id):
        """Delete a patient."""
        if request.method == 'POST':
            try:
                success = PatientsModel.delete(patient_id)
                if success:
                    flash(f'Patient {patient_id} deleted successfully!', 'success')
                else:
                    flash('Patient not found or could not be deleted', 'warning')
            except Error as e:
                flash(f'Error deleting patient: {str(e)}', 'danger')
        
        return redirect(url_for('patients_list'))
    
    app.add_url_rule('/patients/<patient_id>/delete', 'patient_delete', patient_delete, methods=['POST'])
    
    # ========================================================================
    # ENCOUNTER CRUD ROUTES (Member A)
    # ========================================================================
    
    def encounters_list():
        """List all encounters."""
        try:
            encounters = EncountersModel.get_all()
            return render_template('encounters/list.html', encounters=encounters)
        except Error as e:
            flash(f'Error loading encounters: {str(e)}', 'danger')
            return render_template('encounters/list.html', encounters=[])
    
    app.add_url_rule('/encounters', 'encounters_list', encounters_list, methods=['GET'])
    
    def encounter_view(encounter_id):
        """View a single encounter's details."""
        conn = None
        try:
            encounter = EncountersModel.get_by_id(encounter_id)
            if not encounter:
                flash('Encounter not found', 'danger')
                return redirect(url_for('encounters_list'))
            
            # Get encounter's diagnoses
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            diagnoses_query = """
                SELECT * FROM diagnoses
                WHERE encounter_id = %s
                ORDER BY primary_flag DESC
            """
            cursor.execute(diagnoses_query, (encounter_id,))
            diagnoses = cursor.fetchall()
            
            # Get encounter's procedures
            procedures_query = """
                SELECT pr.*, p.name as provider_name
                FROM procedures pr
                LEFT JOIN providers p ON pr.provider_id = p.provider_id
                WHERE pr.encounter_id = %s
                ORDER BY pr.procedure_date DESC
            """
            cursor.execute(procedures_query, (encounter_id,))
            procedures = cursor.fetchall()
            
            # Get encounter's medications
            medications_query = """
                SELECT m.*, p.name as prescriber_name
                FROM medications m
                LEFT JOIN providers p ON m.prescriber_id = p.provider_id
                WHERE m.encounter_id = %s
                ORDER BY m.prescribed_date DESC
            """
            cursor.execute(medications_query, (encounter_id,))
            medications = cursor.fetchall()
            
            # Get billing info
            billing_query = """
                SELECT * FROM claims_and_billing
                WHERE encounter_id = %s
            """
            cursor.execute(billing_query, (encounter_id,))
            billing = cursor.fetchone()
            
            return render_template('encounters/view.html', 
                                 encounter=encounter,
                                 diagnoses=diagnoses,
                                 procedures=procedures,
                                 medications=medications,
                                 billing=billing)
        except Error as e:
            flash(f'Error loading encounter: {str(e)}', 'danger')
            return redirect(url_for('encounters_list'))
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    app.add_url_rule('/encounters/<encounter_id>', 'encounter_view', encounter_view, methods=['GET'])

