"""
Flask routes for the Hospital Management System.
"""
from flask import render_template, request, redirect, url_for, flash
from models import (
    PatientsModel, EncountersModel, InsurersModel, DenialsModel,
    ClaimsAndBillingModel, ProvidersModel, MedicationsModel, SpecialtyHeadsModel, ProvidersModel
)
from db import get_db_connection, get_db_cursor
from mysql.connector import Error

# --- OPTIONS & HELPER FUNCTIONS ---
PATIENT_SORT_OPTIONS = [("registration_date", "Registration Date"), ("patient_id", "ID"), ("first_name", "First Name"), ("last_name", "Last Name"), ("age", "Age"), ("gender", "Gender")]
PATIENT_GENDER_OPTIONS = ["Male", "Female", "Other"]
ENCOUNTER_SORT_OPTIONS = [("visit_date", "Visit Date"), ("encounter_id", "ID"), ("patient_id", "Patient ID"), ("provider_id", "Provider ID"), ("department", "Department"), ("visit_type", "Type"), ("status", "Status")]
ENCOUNTER_STATUS_OPTIONS = ["Scheduled", "Completed", "In Progress", "Cancelled", "Discharged"]
CLAIMS_SORT_OPTIONS = [("billing_id", "ID"), ("claim_date", "Claim Date"), ("encounter_id", "Encounter ID"), ("billed_amount", "Billed Amount"), ("claim_status", "Status")]
CLAIMS_STATUS_OPTIONS = ["Pending", "Approved", "Denied", "Paid", "Submitted", "Rejected"]

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

# --- MAIN ROUTE REGISTRATION ---
def register_routes(app):
    
    # 1. HOME / DASHBOARD
    def home():
        search_query = request.args.get('q', '').strip()
        sort_by = request.args.get('sort', 'visit_date')
        direction = request.args.get('direction', 'desc').lower()
        
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
            recent_activity = EncountersModel.get_dashboard_activity(limit=50, search=search_query or None, filters=filters, sort_by=sort_by, sort_dir=direction)
            departments = ProvidersModel.get_departments()

            return render_template('home.html', recent_activity=recent_activity, stats=stats, 
                                 search_query=search_query, filters=filters, filters_active=filters_active,
                                 current_sort=sort_by, current_direction=direction, departments=departments, 
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

    # 2. PATIENTS ROUTES
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
            flash(f'Error: {str(e)}', 'danger'); return redirect(url_for('home'))

    app.add_url_rule('/patients', 'patients_list', patients_list, methods=['GET'])

    def patient_view(patient_id):
        try:
            patient = PatientsModel.get_by_id(patient_id)
            if not patient: flash('Not found', 'danger'); return redirect(url_for('patients_list'))
            
            conn = get_db_connection(); cursor = get_db_cursor(conn)
            cursor.execute("SELECT e.*, pr.name as provider_name FROM encounters e LEFT JOIN providers pr ON e.provider_id = pr.provider_id WHERE e.patient_id = %s ORDER BY e.visit_date DESC", (patient_id,))
            encounters = cursor.fetchall(); conn.close()
            return render_template('patients/view.html', patient=patient, encounters=encounters)
        except Error: return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/<patient_id>', 'patient_view', patient_view, methods=['GET'])

    def patient_add():
        if request.method == 'GET': return render_template('patients/add.html', insurers=InsurersModel.get_all())
        try:
            data = request.form.to_dict()
            for k, v in data.items(): data[k] = _value_or_none(v)
            pid = PatientsModel.add(data)
            flash(f'Patient {pid} added!', 'success'); return redirect(url_for('patient_view', patient_id=pid))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/add', 'patient_add', patient_add, methods=['GET', 'POST'])

    def patient_edit(patient_id):
        if request.method == 'GET':
            p = PatientsModel.get_by_id(patient_id)
            return render_template('patients/edit.html', patient=p, insurers=InsurersModel.get_all())
        try:
            PatientsModel.update(patient_id, request.form)
            flash('Updated!', 'success'); return redirect(url_for('patient_view', patient_id=patient_id))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/<patient_id>/edit', 'patient_edit', patient_edit, methods=['GET', 'POST'])

    def patient_delete(patient_id):
        if request.method == 'POST':
            try:
                if PatientsModel.delete(patient_id): flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('patients_list'))

    app.add_url_rule('/patients/<patient_id>/delete', 'patient_delete', patient_delete, methods=['POST'])

    # 3. ENCOUNTERS ROUTES
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
            flash(f'Error: {str(e)}', 'danger'); return render_template('encounters/list.html', encounters=[])

    app.add_url_rule('/encounters', 'encounters_list', encounters_list, methods=['GET'])

    def encounter_view(encounter_id):
        conn = None
        try:
            encounter = EncountersModel.get_by_id(encounter_id)
            if not encounter: flash('Not found', 'danger'); return redirect(url_for('encounters_list'))
            
            conn = get_db_connection(); cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM diagnoses WHERE encounter_id = %s ORDER BY primary_flag DESC", (encounter_id,))
            diagnoses = cursor.fetchall()
            cursor.execute("SELECT pr.*, p.name as provider_name FROM procedures pr LEFT JOIN providers p ON pr.provider_id = p.provider_id WHERE pr.encounter_id = %s ORDER BY pr.procedure_date DESC", (encounter_id,))
            procedures = cursor.fetchall()
            cursor.execute("SELECT m.*, p.name as prescriber_name FROM medications m LEFT JOIN providers p ON m.prescriber_id = p.provider_id WHERE m.encounter_id = %s ORDER BY m.prescribed_date DESC", (encounter_id,))
            medications = cursor.fetchall()
            cursor.execute("SELECT * FROM claims_and_billing WHERE encounter_id = %s", (encounter_id,))
            billing = cursor.fetchone()
            
            return render_template('encounters/view.html', encounter=encounter, diagnoses=diagnoses, procedures=procedures, medications=medications, billing=billing)
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('encounters_list'))
        finally: 
            if conn and conn.is_connected(): cursor.close(); conn.close()

    app.add_url_rule('/encounters/<encounter_id>', 'encounter_view', encounter_view, methods=['GET'])

    def encounter_add():
        if request.method == 'GET':
            return render_template('encounters/add.html', patients=PatientsModel.get_all(limit=500), providers=ProvidersModel.get_all(), departments=ProvidersModel.get_departments(), status_options=ENCOUNTER_STATUS_OPTIONS)
        try:
            data = request.form.to_dict()
            for k, v in data.items(): data[k] = _value_or_none(v)
            data['readmitted_flag'] = True if request.form.get('readmitted_flag') else False
            eid = EncountersModel.add(data)
            flash(f'Encounter {eid} created!', 'success'); return redirect(url_for('encounter_view', encounter_id=eid))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('encounters_list'))

    app.add_url_rule('/encounters/add', 'encounter_add', encounter_add, methods=['GET', 'POST'])

    def encounter_delete(encounter_id):
        if request.method == 'POST':
            try:
                if EncountersModel.delete(encounter_id): flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('encounters_list'))

    app.add_url_rule('/encounters/<encounter_id>/delete', 'encounter_delete', encounter_delete, methods=['POST'])

    def encounter_edit(encounter_id):
        if request.method == 'GET':
            enc = EncountersModel.get_by_id(encounter_id)
            if not enc: return redirect(url_for('encounters_list'))
            return render_template('encounters/edit.html', encounter=enc, patients=PatientsModel.get_all(limit=500), providers=ProvidersModel.get_all(), status_options=ENCOUNTER_STATUS_OPTIONS)
        try:
            data = request.form.to_dict()
            for k, v in data.items(): data[k] = _value_or_none(v)
            EncountersModel.update(encounter_id, data)
            flash('Updated!', 'success'); return redirect(url_for('encounter_view', encounter_id=encounter_id))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('encounters_list'))

    app.add_url_rule('/encounters/<encounter_id>/edit', 'encounter_edit', encounter_edit, methods=['GET', 'POST'])

    # 4. INSURERS ROUTES
    def insurers_list():
        return render_template('insurers/list.html', insurers=InsurersModel.get_all())
    app.add_url_rule('/insurers', 'insurers_list', insurers_list, methods=['GET'])

    def insurer_add():
        if request.method == 'GET': return render_template('insurers/add.html')
        try:
            InsurersModel.add(request.form); flash('Added!', 'success'); return redirect(url_for('insurers_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('insurers_list'))
    app.add_url_rule('/insurers/add', 'insurer_add', insurer_add, methods=['GET', 'POST'])

    def insurer_delete(insurer_id):
        if request.method == 'POST':
            try: InsurersModel.delete(insurer_id); flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('insurers_list'))
    app.add_url_rule('/insurers/<int:insurer_id>/delete', 'insurer_delete', insurer_delete, methods=['POST'])

    def insurer_edit(insurer_id):
        if request.method == 'GET': return render_template('insurers/edit.html', insurer=InsurersModel.get_by_id(insurer_id))
        try: InsurersModel.update(insurer_id, request.form); flash('Updated!', 'success'); return redirect(url_for('insurers_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('insurers_list'))
    app.add_url_rule('/insurers/<int:insurer_id>/edit', 'insurer_edit', insurer_edit, methods=['GET', 'POST'])

    def insurer_view(insurer_id):
        return render_template('insurers/view.html', insurer=InsurersModel.get_by_id(insurer_id))
    app.add_url_rule('/insurers/<int:insurer_id>', 'insurer_view', insurer_view, methods=['GET'])

    # 5. MEDICATIONS ROUTES
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
            medications = MedicationsModel.get_all(limit=1000, search=search or None, filters=filters, sort_by=sort_by, sort_dir=direction)
            return render_template('medications/list.html', medications=medications, search_query=search, filters=filters, filters_active=_has_filters(filters), current_sort=sort_by, current_direction=direction)
        except Error as e: flash(str(e), 'danger'); return render_template('medications/list.html', medications=[])

    app.add_url_rule('/medications', 'medications_list', medications_list, methods=['GET'])

    def medication_add():
        if request.method == 'GET':
            return render_template('medications/add.html', encounters=EncountersModel.get_all(limit=500), providers=ProvidersModel.get_all())
        try:
            data = request.form.to_dict()
            for k, v in data.items(): data[k] = _value_or_none(v)
            MedicationsModel.add(data); flash('Added!', 'success'); return redirect(url_for('medications_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('medications_list'))

    app.add_url_rule('/medications/add', 'medication_add', medication_add, methods=['GET', 'POST'])

    def medication_edit(med_id):
        if request.method == 'GET':
            return render_template('medications/edit.html', medication=MedicationsModel.get_by_id(med_id), encounters=EncountersModel.get_all(limit=500), providers=ProvidersModel.get_all())
        try:
            data = request.form.to_dict()
            for k, v in data.items(): data[k] = _value_or_none(v)
            MedicationsModel.update(med_id, data); flash('Updated!', 'success'); return redirect(url_for('medications_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('medications_list'))

    app.add_url_rule('/medications/<med_id>/edit', 'medication_edit', medication_edit, methods=['GET', 'POST'])

    def medication_delete(med_id):
        if request.method == 'POST':
            try: MedicationsModel.delete(med_id); flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('medications_list'))

    app.add_url_rule('/medications/<med_id>/delete', 'medication_delete', medication_delete, methods=['POST'])

    def claims_list():
        # Arama ve Filtreleme Parametrelerini Al
        search = request.args.get('q', '').strip()
        sort_by = request.args.get('sort', 'claim_date')
        direction = request.args.get('direction', 'desc').lower()
        
        filters = {
            'billing_id': _value_or_none(request.args.get('billing_id')),
            'encounter_id': _value_or_none(request.args.get('encounter_id')),
            'claim_status': _value_or_none(request.args.get('claim_status')),
            'billed_amount_min': _safe_int(request.args.get('billed_amount_min')),
            'claim_date_from': _value_or_none(request.args.get('claim_date_from'))
        }
        
        try:
            claims = ClaimsAndBillingModel.get_all(
                limit=1000, 
                search=search or None, 
                filters=filters, 
                sort_by=sort_by, 
                sort_dir=direction
            )
            
            # YENİ EKLENEN KISIM: İstatistikleri çekiyoruz
            claim_stats = ClaimsAndBillingModel.get_claim_statistics()
            
            # render_template içine 'claim_stats' değişkenini ekliyoruz
            return render_template(
                'claims/list.html', 
                claims=claims, 
                claim_stats=claim_stats,  # <--- YENİ EKLENDİ
                search_query=search, 
                filters=filters, 
                filters_active=_has_filters(filters), 
                sort_options=CLAIMS_SORT_OPTIONS, 
                status_options=CLAIMS_STATUS_OPTIONS, 
                current_sort=sort_by, 
                current_direction=direction
            )
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            # Hata durumunda home sayfasına dön veya boş liste göster
            return render_template('claims/list.html', claims=[], search_query='', filters={}, filters_active=False, sort_options=[], status_options=[])

    app.add_url_rule('/claims', 'claims_list', claims_list, methods=['GET'])

    def claim_view(billing_id):
        try:
            claim = ClaimsAndBillingModel.get_by_id(billing_id)
            if not claim:
                flash('Claim not found', 'danger')
                return redirect(url_for('claims_list'))
            
            related_denial = None
            if claim.get('claim_status') == 'Denied':
                related_denial = DenialsModel.get_by_claim_id(claim['claim_id'])

            conn = get_db_connection()
            cursor = get_db_cursor(conn)
            cursor.execute("""
                SELECT e.*, p.first_name, p.last_name, pr.name as provider_name
                FROM encounters e
                INNER JOIN patients p ON e.patient_id = p.patient_id
                LEFT JOIN providers pr ON e.provider_id = pr.provider_id
                WHERE e.encounter_id = %s
            """, (claim['encounter_id'],))
            encounter_details = cursor.fetchone()
            conn.close()
            
            return render_template('claims/view.html', claim=claim, encounter=encounter_details, denial=related_denial)
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return redirect(url_for('claims_list'))

    app.add_url_rule('/claims/<billing_id>', 'claim_view', claim_view, methods=['GET'])

    def claim_add():
        if request.method == 'GET':
            try:
                encounters = EncountersModel.get_all(limit=500)
                return render_template('claims/add.html', encounters=encounters, status_options=CLAIMS_STATUS_OPTIONS)
            except Error as e:
                flash(f'Error loading form: {str(e)}', 'danger')
                return redirect(url_for('claims_list'))
        
        try:
            data = {
                'encounter_id': request.form.get('encounter_id'),
                'insurance_provider': request.form.get('insurance_provider'),
                'claim_billing_date': request.form.get('claim_billing_date'), # Formdaki name ile eşleşmeli
                'billed_amount': request.form.get('billed_amount'),
                'paid_amount': request.form.get('paid_amount'),
                'claim_status': request.form.get('claim_status'),
                'payment_method': request.form.get('payment_method'),
                'denial_reason': request.form.get('denial_reason')
            }
            
            new_id = ClaimsAndBillingModel.add(data)
            flash(f'Claim {new_id} created successfully!', 'success')
            return redirect(url_for('claim_view', billing_id=new_id))
        except Error as e:
            flash(f'Error creating claim: {str(e)}', 'danger')
            return redirect(url_for('claims_list'))

    app.add_url_rule('/claims/add', 'claim_add', claim_add, methods=['GET', 'POST'])

    def claim_edit(billing_id):
            return redirect(url_for('claims_list'))

    app.add_url_rule('/claims/<billing_id>/edit', 'claim_edit', claim_edit, methods=['GET', 'POST'])

    def claim_delete(billing_id):
        return redirect(url_for('claims_list'))

    app.add_url_rule('/claims/<billing_id>/delete', 'claim_delete', claim_delete, methods=['POST'])


    def denials_list():
            return redirect(url_for('home'))

    app.add_url_rule('/denials', 'denials_list', denials_list, methods=['GET'])

    def denial_view(denial_id):
        try:
            denial = DenialsModel.get_by_id(denial_id)
            if not denial:
                flash('Denial record not found', 'danger')
                return redirect(url_for('denials_list'))
            return render_template('denials/view.html', denial=denial)
        except Error as e:
            flash(f'Error: {str(e)}', 'danger')
            return redirect(url_for('denials_list'))

    app.add_url_rule('/denials/<denial_id>', 'denial_view', denial_view, methods=['GET'])

    # ... denial_view fonksiyonunun bittiği yerin hemen altına ...

    def denial_delete(denial_id):
        if request.method == 'POST':
            try:
                if DenialsModel.delete(denial_id):
                    flash('Denial record deleted successfully!', 'success')
                else:
                    flash('Could not delete record.', 'warning')
            except Error as e:
                flash(f'Error: {str(e)}', 'danger')
        # Silme işleminden sonra listeye geri dön
        return redirect(url_for('denials_list'))

    # Bu satır Flask'a rotayı tanıtır:
    app.add_url_rule('/denials/<denial_id>/delete', 'denial_delete', denial_delete, methods=['POST'])
    
    def providers_list():
        search = request.args.get('q', '').strip()
        filters = {
            'department': _value_or_none(request.args.get('department')),
            'specialty': _value_or_none(request.args.get('specialty')),
            'inhouse': _bool_from_request(request.args.get('inhouse'))
        }
        try:
            providers = ProvidersModel.get_all(limit=1000, search=search or None, filters=filters)
            departments = ProvidersModel.get_departments()
            return render_template('providers/list.html', providers=providers, departments=departments, search_query=search, filters=filters, filters_active=_has_filters(filters))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('home'))

    app.add_url_rule('/providers', 'providers_list', providers_list, methods=['GET'])

    def provider_view(provider_id):
        try:
            provider = ProvidersModel.get_by_id(provider_id)
            if not provider: flash('Not found', 'danger'); return redirect(url_for('providers_list'))
            return render_template('providers/view.html', provider=provider)
        except Error: return redirect(url_for('providers_list'))
    
    app.add_url_rule('/providers/<provider_id>', 'provider_view', provider_view, methods=['GET'])

    def provider_add():
        if request.method == 'GET':
            return render_template('providers/add.html', heads=SpecialtyHeadsModel.get_all())
        try:
            data = request.form.to_dict()
            for k, v in data.items(): data[k] = _value_or_none(v)
            # Checkbox handling for boolean
            data['inhouse'] = 1 if request.form.get('inhouse') else 0
            
            pid = ProvidersModel.add(data)
            flash(f'Provider {pid} added!', 'success'); return redirect(url_for('providers_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('providers_list'))

    app.add_url_rule('/providers/add', 'provider_add', provider_add, methods=['GET', 'POST'])

    def provider_edit(provider_id):
        if request.method == 'GET':
            p = ProvidersModel.get_by_id(provider_id)
            return render_template('providers/edit.html', provider=p, heads=SpecialtyHeadsModel.get_all())
        try:
            data = request.form.to_dict()
            for k, v in data.items(): data[k] = _value_or_none(v)
            data['inhouse'] = 1 if request.form.get('inhouse') else 0
            ProvidersModel.update(provider_id, data)
            flash('Updated!', 'success'); return redirect(url_for('providers_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('providers_list'))

    app.add_url_rule('/providers/<provider_id>/edit', 'provider_edit', provider_edit, methods=['GET', 'POST'])

    def provider_delete(provider_id):
        if request.method == 'POST':
            try:
                if ProvidersModel.delete(provider_id): flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('providers_list'))

    app.add_url_rule('/providers/<provider_id>/delete', 'provider_delete', provider_delete, methods=['POST'])


    # ========================================================================
    # SPECIALTY HEADS ROUTES (Member U)
    # ========================================================================
    def specialty_heads_list():
        try:
            return render_template('specialty_heads/list.html', heads=SpecialtyHeadsModel.get_all())
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('home'))

    app.add_url_rule('/specialty-heads', 'specialty_heads_list', specialty_heads_list, methods=['GET'])

    def specialty_head_add():
        if request.method == 'GET':
            # We need providers to select who is the head
            return render_template('specialty_heads/add.html', providers=ProvidersModel.get_all())
        try:
            data = request.form.to_dict()
            SpecialtyHeadsModel.add(data); flash('Added!', 'success'); return redirect(url_for('specialty_heads_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('specialty_heads_list'))

    app.add_url_rule('/specialty-heads/add', 'specialty_head_add', specialty_head_add, methods=['GET', 'POST'])

    def specialty_head_edit(head_id):
        if request.method == 'GET':
            return render_template('specialty_heads/edit.html', head=SpecialtyHeadsModel.get_by_id(head_id), providers=ProvidersModel.get_all())
        try:
            SpecialtyHeadsModel.update(head_id, request.form); flash('Updated!', 'success'); return redirect(url_for('specialty_heads_list'))
        except Error as e: flash(str(e), 'danger'); return redirect(url_for('specialty_heads_list'))

    app.add_url_rule('/specialty-heads/<int:head_id>/edit', 'specialty_head_edit', specialty_head_edit, methods=['GET', 'POST'])

    def specialty_head_delete(head_id):
        if request.method == 'POST':
            try: SpecialtyHeadsModel.delete(head_id); flash('Deleted!', 'success')
            except Error as e: flash(str(e), 'danger')
        return redirect(url_for('specialty_heads_list'))

    app.add_url_rule('/specialty-heads/<int:head_id>/delete', 'specialty_head_delete', specialty_head_delete, methods=['POST'])
