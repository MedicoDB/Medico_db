from flask import Blueprint, jsonify
from ..db import get_conn
import datetime

bp = Blueprint("dashboard", __name__)

@bp.get("/stats")
def get_dashboard_stats():
    """Get current statistics for the dashboard"""
    try:
        with get_conn() as conn:
            with conn.cursor(dictionary=True) as cur:
                stats = {}

                # Active Patients (had an encounter in last 30 days)
                cur.execute("""
                    SELECT COUNT(DISTINCT patient_id) as count 
                    FROM encounters 
                    WHERE visit_date >= DATE_SUB(%s, INTERVAL 30 DAY)
                """, ('2025-02-05',))  # fixed demo date
                stats['active_patients'] = cur.fetchone()['count']

                # Open Encounters
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM encounters 
                    WHERE status != 'Completed'
                """)
                stats['open_encounters'] = cur.fetchone()['count']

                # Procedures Today
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM procedures 
                    WHERE procedure_date = %s
                """, ('2025-02-05',))  # fixed demo date
                stats['procedures_today'] = cur.fetchone()['count']

                # Medications Issued Today
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM medications 
                    WHERE prescribed_date = %s
                """, ('2025-02-05',))  # fixed demo date
                stats['medications_issued'] = cur.fetchone()['count']

                # Average Length of Stay (last 30 days)
                cur.execute("""
                    SELECT ROUND(AVG(length_of_stay), 1) as avg_stay
                    FROM encounters
                    WHERE discharge_date IS NOT NULL
                    AND visit_date >= DATE_SUB(%s, INTERVAL 30 DAY)
                """, ('2025-02-05',))
                result = cur.fetchone()
                stats['avg_stay'] = result['avg_stay'] if result['avg_stay'] else 0

                # Claims Approval Rate (last 30 days)
                cur.execute("""
                    SELECT 
                        ROUND(
                            (SUM(CASE WHEN claim_status = 'Paid' THEN 1 ELSE 0 END) * 100.0) 
                            / COUNT(*)
                        ) as approval_rate
                    FROM claims_and_billing
                    WHERE claim_billing_date >= DATE_SUB(%s, INTERVAL 30 DAY)
                """, ('2025-02-05',))
                result = cur.fetchone()
                stats['claims_approval_rate'] = result['approval_rate'] if result['approval_rate'] else 0

                # Additional useful statistics
                cur.execute("""
                    SELECT 
                        COUNT(DISTINCT d.diagnosis_code) as unique_diagnoses,
                        COUNT(DISTINCT p.provider_id) as active_providers
                    FROM encounters e
                    LEFT JOIN diagnoses d ON e.encounter_id = d.encounter_id
                    LEFT JOIN providers p ON e.provider_id = p.provider_id
                    WHERE e.visit_date >= DATE_SUB(%s, INTERVAL 30 DAY)
                """, ('2025-02-05',))
                extra_stats = cur.fetchone()
                stats.update(extra_stats)

                return jsonify(stats)

    except Exception as e:
        print(f"Dashboard stats error: {e}")
        return jsonify({"error": str(e)}), 500