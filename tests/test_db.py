import unittest
from unittest.mock import patch, MagicMock
import db as root_db

class TestRootDB(unittest.TestCase):

    @patch('db.mysql.connector.connect')
    def test_get_db_connection_success_with_credentials(self, mock_connect):
        """
        Ensure we are passing the global settings credentials to the connector.
        """
        # Act
        conn = root_db.get_db_connection()

        # Assert
        mock_connect.assert_called_once_with(
            host=root_db.DB_HOST,
            user=root_db.DB_USER,
            password=root_db.DB_PASSWORD,
            database=root_db.DB_NAME,
            port=root_db.DB_PORT,
            autocommit=False
        )
        self.assertIsNotNone(conn)

    def test_get_db_connection_access_denied(self):
        """
        Ensure specific MySQL error codes are translated to readable messages.
        """
        # Create a mock error that looks like a mysql.connector.Error
        # We assume db.Error is just an alias for mysql.connector.Error
        mock_err = root_db.Error() 
        mock_err.errno = 1045 # ER_ACCESS_DENIED_ERROR

        with patch('db.mysql.connector.connect', side_effect=mock_err):
            with self.assertRaises(root_db.Error) as cm:
                root_db.get_db_connection()
            
            # Verify your custom logic:
            self.assertEqual(str(cm.exception), "Access denied: Check username and password")

    def test_get_db_connection_bad_db(self):
        """
        Test the elif err.errno == errorcode.ER_BAD_DB_ERROR branch
        """
        mock_err = root_db.Error()
        mock_err.errno = 1049 # ER_BAD_DB_ERROR

        with patch('db.mysql.connector.connect', side_effect=mock_err):
            with self.assertRaises(root_db.Error) as cm:
                root_db.get_db_connection()
            
            self.assertIn("does not exist", str(cm.exception))

if __name__ == '__main__':
    unittest.main()