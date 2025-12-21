# Database Schema Foreign Key Relationships

This document maps all foreign key relationships in the Medico database schema.

## Table: `patients`
- **Primary Key**: `patient_id` (VARCHAR(50))
- **Foreign Keys**:
  - `insurance_type` → `insurers.code` (ON DELETE SET NULL)

## Table: `providers`
- **Primary Key**: `provider_id` (VARCHAR(50))
- **Foreign Keys**:
  - `head_id` → `department_heads.head_id` (ON DELETE SET NULL)

## Table: `department_heads`
- **Primary Key**: `head_id` (INT)
- **Foreign Keys**:
  - `head_provider_id` → `providers.provider_id` (ON DELETE RESTRICT)

## Table: `encounters`
- **Primary Key**: `encounter_id` (VARCHAR(50))
- **Foreign Keys**:
  - `patient_id` → `patients.patient_id` (ON DELETE RESTRICT)
  - `provider_id` → `providers.provider_id` (ON DELETE RESTRICT)

## Table: `diagnoses`
- **Primary Key**: `diagnosis_id` (VARCHAR(50))
- **Foreign Keys**:
  - `encounter_id` → `encounters.encounter_id` (ON DELETE CASCADE)

## Table: `procedures`
- **Primary Key**: `procedure_id` (VARCHAR(50))
- **Foreign Keys**:
  - `encounter_id` → `encounters.encounter_id` (ON DELETE CASCADE)
  - `provider_id` → `providers.provider_id` (ON DELETE SET NULL)

## Table: `lab_tests`
- **Primary Key**: `test_id` (VARCHAR(50))
- **Foreign Keys**:
  - `encounter_id` → `encounters.encounter_id` (ON DELETE CASCADE)

## Table: `medications`
- **Primary Key**: `medication_id` (VARCHAR(50))
- **Foreign Keys**:
  - `encounter_id` → `encounters.encounter_id` (ON DELETE RESTRICT)
  - `prescriber_id` → `providers.provider_id` (ON DELETE RESTRICT)

## Table: `claims_and_billing`
- **Primary Key**: `billing_id` (VARCHAR(50))
- **Foreign Keys**:
  - `patient_id` → `patients.patient_id` (ON DELETE RESTRICT)
  - `encounter_id` → `encounters.encounter_id` (ON DELETE RESTRICT)
  - `insurance_provider` → `insurers.code` (ON DELETE SET NULL)

## Table: `denials`
- **Primary Key**: `denial_id` (VARCHAR(50))
- **Foreign Keys**:
  - `claim_id` → `claims_and_billing.claim_id` (ON DELETE RESTRICT)

## Dropdown Label Formats

- **Patient**: `PATxxxx — First Last`
- **Encounter**: `ENCxxxx — PatientName — Date`
- **Provider**: `PRVxxxx — First Last (Specialty)`
- **Insurer**: `CODE — Name`
- **Claim**: `CLMxxxx — PatientName — Date — Amount`
