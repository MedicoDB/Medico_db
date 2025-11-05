# MedicoDB Project

A full stack hospital management dashboard application built with a React frontend, a Flask (Python) backend, and a MySQL database. This project provides a centralized view of patients, encounters, procedures, and medications, simulating a real world hospital information system.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following software installed on your machine:

-   **MySQL Server**: The database used for this project.
-   **Python 3.8+**: For the backend server.
-   **Node.js and npm**: For the frontend development server and package management.

### Installation & Database Setup

Follow these steps to set up your development environment.

**1. Database Setup**

This project uses an automated script to create the database, build all tables, and load data from the CSV files.

-   Open the new `settings.py` file and update the values to match your local MySQL setup:

    ```python
    # settings.py
    DB_HOST = "localhost"
    DB_USER = "your_mysql_username"      # e.g., "root"
    DB_PASSWORD = "your_mysql_password"  # The password you set for MySQL
    DB_NAME = "medico_db"
    DB_PORT = 3306
    ```

-   Once your settings are configured, run the setup script:

    ```bash
    python setup_db.py
    ```
    This script will create and populate the `medico_db` database.

**2. Backend Setup**

**3. Frontend Setup**

**1. Start the Backend Server**

**2. Start the Frontend Server**

**3. Open the Application**

Your React application should now be running. Open your web browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`).
