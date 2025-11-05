CREATE_TABLES_SQL = [
    """
    CREATE TABLE insurers (
        insurer_id INT PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(255),
        payer_type VARCHAR(50)
    );
    """,
    """
    CREATE TABLE specialty_heads (
        head_id INT PRIMARY KEY,
        specialty VARCHAR(255),
        head_provider_id VARCHAR(50),
        head_name VARCHAR(255),
        head_email VARCHAR(255)
    );
    """,
    """
    CREATE TABLE patients (
        patient_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        dob DATE,
        age INT,
        gender VARCHAR(50),
        ethnicity VARCHAR(100),
        insurance_type VARCHAR(50),
        marital_status VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        registration_date DATE,
        FOREIGN KEY (insurance_type) REFERENCES insurers(code)
    );
    """,
    """
    CREATE TABLE providers (
        provider_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        department VARCHAR(255),
        specialty VARCHAR(255),
        npi VARCHAR(50),
        inhouse BOOLEAN,
        location VARCHAR(50),
        years_experience INT,
        contact_info VARCHAR(50),
        email VARCHAR(255),
        head_id INT,
        FOREIGN KEY (head_id) REFERENCES specialty_heads(head_id)
    );
    """,
    """
    CREATE TABLE encounters (
        encounter_id VARCHAR(50) PRIMARY KEY,
        patient_id VARCHAR(50),
        provider_id VARCHAR(50),
        visit_date DATE,
        visit_type VARCHAR(100),
        department VARCHAR(255),
        reason_for_visit TEXT,
        diagnosis_code VARCHAR(50),
        admission_type VARCHAR(100),
        discharge_date DATE,
        length_of_stay INT,
        status VARCHAR(100),
        readmitted_flag BOOLEAN,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
        FOREIGN KEY (provider_id) REFERENCES providers(provider_id)
    );
    """,
    """
    CREATE TABLE diagnoses (
        diagnosis_id VARCHAR(50) PRIMARY KEY,
        encounter_id VARCHAR(50),
        diagnosis_code VARCHAR(50),
        diagnosis_description TEXT,
        primary_flag BOOLEAN,
        chronic_flag BOOLEAN,
        FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id)
    );
    """,
    """
    CREATE TABLE procedures (
        procedure_id VARCHAR(50) PRIMARY KEY,
        encounter_id VARCHAR(50),
        procedure_code VARCHAR(50),
        procedure_description TEXT,
        procedure_date DATE,
        provider_id VARCHAR(50),
        procedure_cost DECIMAL(10, 2),
        FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id),
        FOREIGN KEY (provider_id) REFERENCES providers(provider_id)
    );
    """,
    """
    CREATE TABLE lab_tests (
        test_id VARCHAR(50) PRIMARY KEY,
        lab_id VARCHAR(50),
        encounter_id VARCHAR(50),
        test_name VARCHAR(255),
        test_code VARCHAR(50),
        specimen_type VARCHAR(100),
        test_result VARCHAR(255),
        units VARCHAR(50),
        normal_range VARCHAR(100),
        test_date DATE,
        status VARCHAR(100),
        FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id)
    );
    """,
    """
    CREATE TABLE medications (
        medication_id VARCHAR(50) PRIMARY KEY,
        encounter_id VARCHAR(50),
        drug_name VARCHAR(255),
        dosage VARCHAR(100),
        route VARCHAR(100),
        frequency VARCHAR(100),
        duration VARCHAR(100),
        prescribed_date DATE,
        prescriber_id VARCHAR(50),
        cost DECIMAL(10, 2),
        FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id),
        FOREIGN KEY (prescriber_id) REFERENCES providers(provider_id)
    );
    """,
    """
    CREATE TABLE claims_and_billing (
        billing_id VARCHAR(50) PRIMARY KEY,
        patient_id VARCHAR(50),
        encounter_id VARCHAR(50),
        insurance_provider VARCHAR(255),
        payment_method VARCHAR(100),
        claim_id VARCHAR(50) UNIQUE,
        claim_billing_date DATETIME,
        billed_amount DECIMAL(10, 2),
        paid_amount DECIMAL(10, 2),
        claim_status VARCHAR(100),
        denial_reason TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
        FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id)
    );
    """,
    """
    CREATE TABLE denials (
        claim_id VARCHAR(50),
        denial_id VARCHAR(50) PRIMARY KEY,
        denial_reason_code VARCHAR(50),
        denial_reason_description TEXT,
        denied_amount DECIMAL(10, 2),
        denial_date DATE,
        appeal_filed VARCHAR(10),
        appeal_status VARCHAR(100),
        appeal_resolution_date DATE,
        final_outcome VARCHAR(100),
        FOREIGN KEY (claim_id) REFERENCES claims_and_billing(claim_id)
    );
    """
]