"""
Flask routes for the Hospital Management System.
"""
from flask import render_template, request, redirect, url_for, flash
from models import (
    PatientsModel, EncountersModel, InsurersModel, ClaimsAndBillingModel, ProvidersModel, MedicationsModel
)
from db import get_db_connection, get_db_cursor
from mysql.connector import Error


PATIENT_SORT_OPTIONS = [("registration_date", "Registration Date"), ("patient_id", "ID"), ("first_name", "First Name"), ("last_name", "Last Name"), ("age", "Age"), ("gender", "Gender")]
PATIENT_GENDER_OPTIONS = ["Male", "Female", "Other"]
ENCOUNTER_SORT_OPTIONS = [("visit_date", "Visit Date"), ("encounter_id", "ID"), ("patient_id", "Patient ID"), ("provider_id", "Provider ID"), ("department", "Department"), ("visit_type", "Type"), ("status", "Status")]
ENCOUNTER_STATUS_OPTIONS = ["Scheduled", "Completed", "In Progress", "Cancelled", "Discharged"]

def _safe_int(value):
    try: return int(value)
    except: return None

def _value_or_none(value):
    return value.strip() if value and value.strip() else None

def _bool_from_request(value):
    if value is None or value == "": return None
    return value.lower() in ("1", "true", "yes", "y")

def _has_filters(filters_dict):
    if not filters_dict: return False
    for val in filters_dict.values():
        if val not in (None, ''): return True
    return False

def register_routes(app):
    
    # --- HOME ---
    def home():
        """Dashboard showing recent hospital activity with complex join query."""
        
        # Arama ve Sıralama Parametrelerini Al
        search_query = request.args.get('q', '').strip()
        sort_by = request.args.get('sort', 'visit_date')
        direction = request.args.get('direction', 'desc').lower()
        
        # Filtreler
        filters = {
            'encounter_id': _value_or_none(request.args.get('encounter_id')),
            'patient_name': _value_or_none(request.args.get('patient_name')),
            'provider_name': _value_or_none(request.args.get('provider_name')),
            'department': _value_or_none(request.args.get('department')),
            'visit_date': _value_or_none(request.args.get('visit_date')),
            'status': _value_or_none(request.args.get('status'))
        }
        filters_active = _has_filters(filters)

        conn = None
        try:
            # İstatistikler için kısa bir bağlantı (Basit count sorguları)
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            # Summary Statistics
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
            
            # Recent Activity Listesi (Modelden geliyor)
            recent_activity = EncountersModel.get_dashboard_activity(
                limit=50,
                search=search_query or None,
                filters=filters,
                sort_by=sort_by,
                sort_dir=direction
            )
            
            # Departman listesi (Filtre dropdown'ı için)
            departments = ProvidersModel.get_departments()

            return render_template('home.html', 
                                 recent_activity=recent_activity,
                                 stats=stats,
                                 search_query=search_query,
                                 filters=filters,
                                 filters_active=filters_active,
                                 current_sort=sort_by,
                                 current_direction=direction,
                                 departments=departments,
                                 status_options=ENCOUNTER_STATUS_OPTIONS)
                                 
        except Error as e:
            flash(f'Error loading dashboard: {str(e)}', 'danger')
            return render_template('home.html', recent_activity=[], stats={})
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    app.add_url_rule('/', 'home', home, methods=['GET'])
    app.add_url_rule('/home', 'home_alt', home, methods=['GET'])

    # --- PATIENTS (Member A) ---
    def patients_list():
        search = request.args.get('q', '').strip()
        sort_by = request.args.get('sort', 'registration_date')
        direction = request.args.get('direction', 'desc').lower()
        filters = {
            'patient_id': _value_or_none(request.args.get('patient_id')),
            'first_name': _value_or_none(request.args.get('first_name')),
            'last_name': _value_or_none(request.args.get('last_name')),
            'gender': _value_or_none(request.args.get('gender')),
            'insurance_type': _value_or_none(request.args.get('insurance_type')),
            'age_exact': _safe_int(request.args.get('age')),
            'registration_from': _value_or_none(request.args.get('registration_from')),
            'city': _value_or_none(request.args.get('city'))
        }
        try:
            patients = PatientsModel.get_all(limit=1000, search=search or None, filters=filters, sort_by=sort_by, sort_dir=direction)
            insurers = InsurersModel.get_all()
            return render_template('patients/list.html', patients=patients, search_query=search, filters=filters, filters_active=_has_filters(filters), sort_options=PATIENT_SORT_OPTIONS, current_sort=sort_by, current_direction=direction, gender_options=PATIENT_GENDER_OPTIONS, insurer_options=insurers)
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return redirect(url_for('home'))

    app.add_url_rule('/patients', 'patients_list', patients_list, methods=['GET'])

    def patient_view(patient_id):
        try:
            patient = PatientsModel.get_by_id(patient_id)
            if not patient: return redirect(url_for('patients_list'))
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT e.*, pr.name as provider_name FROM encounters e LEFT JOIN providers pr ON e.provider_id = pr.provider_id WHERE e.patient_id = %s ORDER BY e.visit_date DESC", (patient_id,))
            encounters = cursor.fetchall()
            conn.close()
            return render_template('patients/view.html', patient=patient, encounters=encounters)
        except Error: return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/<patient_id>', 'patient_view', patient_view, methods=['GET'])

    def patient_add():
        if request.method == 'GET':
            return render_template('patients/add.html', insurers=InsurersModel.get_all())
        try:
            pid = PatientsModel.add(request.form)
            flash(f'Patient {pid} added!', 'success')
            return redirect(url_for('patient_view', patient_id=pid))
        except Error as e:
            flash(str(e), 'danger')
            return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/add', 'patient_add', patient_add, methods=['GET', 'POST'])

    def patient_delete(patient_id):
        if request.method == 'POST':
            try:
                if PatientsModel.delete(patient_id): flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/<patient_id>/delete', 'patient_delete', patient_delete, methods=['POST'])

    def patient_edit(patient_id):
        if request.method == 'GET':
            p = PatientsModel.get_by_id(patient_id)
            if not p: return redirect(url_for('patients_list'))
            return render_template('patients/edit.html', patient=p, insurers=InsurersModel.get_all())
        try:
            PatientsModel.update(patient_id, request.form)
            flash('Updated!', 'success')
            return redirect(url_for('patient_view', patient_id=patient_id))
        except Error as e:
            flash(str(e), 'danger')
            return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/<patient_id>/edit', 'patient_edit', patient_edit, methods=['GET', 'POST'])

    # --- ENCOUNTERS (Member A) ---
    def encounters_list():
        search = request.args.get('q', '').strip()
        sort_by = request.args.get('sort', 'visit_date')
        direction = request.args.get('direction', 'desc').lower()
        filters = {
            'encounter_id': _value_or_none(request.args.get('encounter_id')),
            'patient_id': _value_or_none(request.args.get('patient_id')),
            'provider_id': _value_or_none(request.args.get('provider_id')),
            'patient_name': _value_or_none(request.args.get('patient_name')),
            'provider_name': _value_or_none(request.args.get('provider_name')),
            'department': _value_or_none(request.args.get('department')),
            'status': _value_or_none(request.args.get('status')),
            'visit_from': _value_or_none(request.args.get('visit_from')),
            'readmitted_flag': _bool_from_request(request.args.get('readmitted_flag'))
        }
        try:
            encounters = EncountersModel.get_all(limit=1000, search=search or None, filters=filters, sort_by=sort_by, sort_dir=direction)
            return render_template('encounters/list.html', encounters=encounters, search_query=search, filters=filters, filters_active=_has_filters(filters), sort_options=ENCOUNTER_SORT_OPTIONS, status_options=ENCOUNTER_STATUS_OPTIONS, current_sort=sort_by, current_direction=direction)
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return render_template('encounters/list.html', encounters=[], search_query='', filters={}, filters_active=False, sort_options=[], status_options=[])

    app.add_url_rule('/encounters', 'encounters_list', encounters_list, methods=['GET'])

    def encounter_view(encounter_id):
        conn = None
        try:
            encounter = EncountersModel.get_by_id(encounter_id)
            if not encounter:
                flash('Encounter not found', 'danger')
                return redirect(url_for('encounters_list'))
            
            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            
            cursor.execute("SELECT * FROM diagnoses WHERE encounter_id = %s ORDER BY primary_flag DESC", (encounter_id,))
            diagnoses = cursor.fetchall()
            
            cursor.execute("SELECT pr.*, p.name as provider_name FROM procedures pr LEFT JOIN providers p ON pr.provider_id = p.provider_id WHERE pr.encounter_id = %s ORDER BY pr.procedure_date DESC", (encounter_id,))
            procedures = cursor.fetchall()
            
            cursor.execute("SELECT m.*, p.name as prescriber_name FROM medications m LEFT JOIN providers p ON m.prescriber_id = p.provider_id WHERE m.encounter_id = %s ORDER BY m.prescribed_date DESC", (encounter_id,))
            medications = cursor.fetchall()
            
            cursor.execute("SELECT * FROM claims_and_billing WHERE encounter_id = %s", (encounter_id,))
            billing = cursor.fetchone()
            
            return render_template('encounters/view.html', encounter=encounter, diagnoses=diagnoses, procedures=procedures, medications=medications, billing=billing)
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return redirect(url_for('encounters_list'))
        finally:
            if conn and conn.is_connected(): cursor.close(); conn.close()

    app.add_url_rule('/encounters/<encounter_id>', 'encounter_view', encounter_view, methods=['GET'])

    def encounter_add():
        if request.method == 'GET':
            try:
                # Hastaları ve Doktorları çekiyoruz
                patients = PatientsModel.get_all(limit=3000) # Limiti biraz artırdık
                providers = ProvidersModel.get_all()
                # Departman listesini çekiyoruz
                departments = ProvidersModel.get_departments()
                
                return render_template('encounters/add.html', 
                                     patients=patients, 
                                     providers=providers,
                                     departments=departments, # Template'e gönderdik
                                     status_options=ENCOUNTER_STATUS_OPTIONS)
            except Error as e:
                flash(f'Error loading form: {str(e)}', 'danger')
                return redirect(url_for('encounters_list'))
        try:
            data = {
                'patient_id': _value_or_none(request.form.get('patient_id')),
                'provider_id': _value_or_none(request.form.get('provider_id')),
                'visit_date': request.form.get('visit_date'),
                'visit_type': request.form.get('visit_type'),
                'department': request.form.get('department'),
                'reason_for_visit': request.form.get('reason_for_visit'),
                'diagnosis_code': request.form.get('diagnosis_code'),
                'admission_type': request.form.get('admission_type'),
                'discharge_date': _value_or_none(request.form.get('discharge_date')),
                'length_of_stay': _safe_int(request.form.get('length_of_stay')),
                'status': request.form.get('status'),
                'readmitted_flag': True if request.form.get('readmitted_flag') else False
            }
            eid = EncountersModel.add(data)
            flash(f'Encounter {eid} created!', 'success')
            return redirect(url_for('encounter_view', encounter_id=eid))
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return redirect(url_for('encounters_list'))

    app.add_url_rule('/encounters/add', 'encounter_add', encounter_add, methods=['GET', 'POST'])

    def encounter_edit(encounter_id):
        if request.method == 'GET':
            enc = EncountersModel.get_by_id(encounter_id)
            if not enc: return redirect(url_for('encounters_list'))
            return render_template('encounters/edit.html', encounter=enc, patients=PatientsModel.get_all(limit=500), providers=ProvidersModel.get_all(), status_options=ENCOUNTER_STATUS_OPTIONS)
        try:
            data = {
                'patient_id': _value_or_none(request.form.get('patient_id')),
                'provider_id': _value_or_none(request.form.get('provider_id')),
                'visit_date': request.form.get('visit_date'),
                'visit_type': request.form.get('visit_type'),
                'department': request.form.get('department'),
                'reason_for_visit': request.form.get('reason_for_visit'),
                'diagnosis_code': request.form.get('diagnosis_code'),
                'admission_type': request.form.get('admission_type'),
                'discharge_date': _value_or_none(request.form.get('discharge_date')),
                'length_of_stay': _safe_int(request.form.get('length_of_stay')),
                'status': request.form.get('status'),
                'readmitted_flag': True if request.form.get('readmitted_flag') else False
            }
            EncountersModel.update(encounter_id, data)
            flash('Updated!', 'success')
            return redirect(url_for('encounter_view', encounter_id=encounter_id))
        except Error as e:
            flash(str(e), 'danger')
            return redirect(url_for('encounters_list'))

    app.add_url_rule('/encounters/<encounter_id>/edit', 'encounter_edit', encounter_edit, methods=['GET', 'POST'])

    def encounter_delete(encounter_id):
        if request.method == 'POST':
            try:
                if EncountersModel.delete(encounter_id): flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('encounters_list'))

    app.add_url_rule('/encounters/<encounter_id>/delete', 'encounter_delete', encounter_delete, methods=['POST'])


    def medications_list():
        search = request.args.get('q', '').strip()
        sort_by = request.args.get('sort', 'prescribed_date')
        direction = request.args.get('direction', 'desc').lower()
        
        filters = {
            'drug_name': _value_or_none(request.args.get('drug_name')),
            'encounter_id': _value_or_none(request.args.get('encounter_id')),
            'date_from': _value_or_none(request.args.get('date_from')),
            'date_to': _value_or_none(request.args.get('date_to'))
        }
        
        try:
            medications = MedicationsModel.get_all(
                limit=1000, 
                search=search or None, 
                filters=filters, 
                sort_by=sort_by, 
                sort_dir=direction
            )
            return render_template('medications/list.html', 
                                 medications=medications,
                                 search_query=search,
                                 filters=filters,
                                 filters_active=_has_filters(filters),
                                 current_sort=sort_by,
                                 current_direction=direction)
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return render_template('medications/list.html', medications=[])

    app.add_url_rule('/medications', 'medications_list', medications_list, methods=['GET'])

    def medication_add():
        if request.method == 'GET':
            try:
                # İlaç eklerken Encounter ve Provider seçmemiz lazım
                encounters = EncountersModel.get_all(limit=500)
                providers = ProvidersModel.get_all()
                return render_template('medications/add.html', encounters=encounters, providers=providers)
            except Error as e:
                flash(f'Error: {str(e)}', 'danger')
                return redirect(url_for('medications_list'))
        
        try:
            data = {
                'encounter_id': _value_or_none(request.form.get('encounter_id')),
                'drug_name': request.form.get('drug_name'),
                'dosage': request.form.get('dosage'),
                'route': request.form.get('route'),
                'frequency': request.form.get('frequency'),
                'duration': request.form.get('duration'),
                'prescribed_date': request.form.get('prescribed_date'),
                'prescriber_id': _value_or_none(request.form.get('prescriber_id')),
                'cost': request.form.get('cost')
            }
            MedicationsModel.add(data)
            flash('Medication added!', 'success')
            return redirect(url_for('medications_list'))
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return redirect(url_for('medications_list'))

    app.add_url_rule('/medications/add', 'medication_add', medication_add, methods=['GET', 'POST'])

    def medication_edit(med_id):
        if request.method == 'GET':
            med = MedicationsModel.get_by_id(med_id)
            if not med: return redirect(url_for('medications_list'))
            encounters = EncountersModel.get_all(limit=500)
            providers = ProvidersModel.get_all()
            return render_template('medications/edit.html', medication=med, encounters=encounters, providers=providers)
        
        try:
            data = {
                'encounter_id': _value_or_none(request.form.get('encounter_id')),
                'drug_name': request.form.get('drug_name'),
                'dosage': request.form.get('dosage'),
                'route': request.form.get('route'),
                'frequency': request.form.get('frequency'),
                'duration': request.form.get('duration'),
                'prescribed_date': request.form.get('prescribed_date'),
                'prescriber_id': _value_or_none(request.form.get('prescriber_id')),
                'cost': request.form.get('cost')
            }
            MedicationsModel.update(med_id, data)
            flash('Updated!', 'success')
            return redirect(url_for('medications_list'))
        except Error as e:
            flash(str(e), 'danger')
            return redirect(url_for('medications_list'))

    app.add_url_rule('/medications/<med_id>/edit', 'medication_edit', medication_edit, methods=['GET', 'POST'])

    def medication_delete(med_id):
        if request.method == 'POST':
            try:
                if MedicationsModel.delete(med_id): flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('medications_list'))

    app.add_url_rule('/medications/<med_id>/delete', 'medication_delete', medication_delete, methods=['POST'])