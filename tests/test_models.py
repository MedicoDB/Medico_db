import unittest
from unittest.mock import patch, MagicMock, ANY
from mysql.connector import Error
import models

class TestProvidersModel(unittest.TestCase):
    
    @patch('models.get_db_connection')
    def test_get_departments_transforms_data(self, mock_get_conn):
        """
        Test that the method correctly extracts the 'department' string 
        from the list of dictionaries returned by the cursor.
        """
        # Arrange
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Simulate DB returning list of dicts
        mock_cursor.fetchall.return_value = [
            {'department': 'Cardiology'}, 
            {'department': 'Neurology'}
        ]

        # Act
        result = models.ProvidersModel.get_departments()

        # Assert
        self.assertEqual(result, ['Cardiology', 'Neurology'])
        # Verify connection was closed
        mock_cursor.close.assert_called()
        mock_conn.close.assert_called()

    @patch('models.get_db_connection')
    def test_get_departments_returns_empty_on_error(self, mock_get_conn):
        """Test the try/except block returning [] on error."""
        mock_get_conn.side_effect = Error("DB Down")
        
        result = models.ProvidersModel.get_departments()
        
        self.assertEqual(result, [])


class TestPatientsModel(unittest.TestCase):

    @patch('models.get_db_connection')
    def test_get_all_dynamic_query_construction(self, mock_get_conn):
        """
        CRITICAL TEST: Verifies that passing filters correctly appends 
        SQL clauses and adds parameters in the right order.
        """
        # Arrange
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Act: Search for 'John', filter by Gender 'M', limit 50
        filters = {'gender': 'M', 'city': 'New York'}
        models.PatientsModel.get_all(search='John', filters=filters, limit=50)

        # Assert
        # We need to inspect the arguments passed to cursor.execute
        args, _ = mock_cursor.execute.call_args
        executed_sql = args[0]
        executed_params = args[1]

        # 1. Verify SQL structure
        self.assertIn("p.gender", executed_sql)
        self.assertIn("p.city", executed_sql)
        self.assertIn("ORDER BY", executed_sql)

        # 2. Verify Parameter Order (Search params first, then filters, then limit)
        # Search term appears 6 times in your SQL (id, first, last, concat, phone, email)
        self.assertEqual(executed_params[0], "%John%") 
        self.assertEqual(executed_params[5], "%John%")
        
        # Filter params follow
        self.assertIn('M', executed_params)
        self.assertIn('%New York%', executed_params)
        
        # Limit is last
        self.assertEqual(executed_params[-1], 50)

    @patch('models.get_db_connection')
    def test_delete_prevented_if_encounters_exist(self, mock_get_conn):
        """
        Test the business logic: Do not delete patient if they have history.
        """
        # Arrange
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Simulate the "COUNT(*)" query returning 1 (Encounters exist)
        mock_cursor.fetchone.return_value = {"cnt": 1}

        # Act & Assert
        with self.assertRaises(Error) as cm:
            models.PatientsModel.delete("PAT-123")
        
        self.assertIn("Delete related encounters first", str(cm.exception))
        
        # Verify we never called the actual DELETE statement
        # call_args_list[0] is the SELECT COUNT, call_args_list[1] would be DELETE
        self.assertEqual(mock_cursor.execute.call_count, 1)

    @patch('models.get_db_connection')
    def test_delete_success(self, mock_get_conn):
        """Test successful deletion when no encounters exist."""
        # Arrange
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Simulate Count = 0
        mock_cursor.fetchone.return_value = {"cnt": 0}
        mock_cursor.rowcount = 1 # Simulate 1 row deleted

        # Act
        result = models.PatientsModel.delete("PAT-123")

        # Assert
        self.assertTrue(result)
        # Verify DELETE was called
        self.assertEqual(mock_cursor.execute.call_count, 2)
        args, _ = mock_cursor.execute.call_args
        self.assertIn("DELETE FROM patients", args[0])


class TestEncountersModel(unittest.TestCase):

    @patch('models.generate_new_id') # Mock the ID generator
    @patch('models.get_db_connection')
    def test_add_uses_defaults(self, mock_get_conn, mock_gen_id):
        """
        Test that default values (status='Completed', readmitted=False) 
        are applied if not provided.
        """
        mock_cursor = MagicMock()
        mock_get_conn.return_value.cursor.return_value = mock_cursor
        mock_gen_id.return_value = "ENC-001"

        data = {
            "patient_id": "P1",
            "provider_id": "D1",
            "visit_date": "2023-01-01",
            # Missing status, missing readmitted_flag, missing length_of_stay
        }

        models.EncountersModel.add(data)

        # Inspect values passed to INSERT
        args, _ = mock_cursor.execute.call_args
        values = args[1]
        
        self.assertIn("Completed", values) # Default status
        self.assertIn(False, values)       # Default readmitted
        self.assertIn(0, values)           # Default length_of_stay

if __name__ == '__main__':
    unittest.main()