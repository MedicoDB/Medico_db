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

- Navigate to the backend directory and install Python dependencies:

    ```bash
    cd backend
    pip install -r requirements.txt
    ```

    Or if you're using Python 3 specifically:

    ```bash
    pip3 install -r requirements.txt
    ```

**3. Frontend Setup**

- Navigate to the frontend directory and install Node.js dependencies:

    ```bash
    cd medico-frontend
    npm install
    ```

## Running the Application

You need to run both the backend and frontend servers simultaneously. Open two terminal windows.

**1. Start the Backend Server**

From the project root directory:

    ```bash
    python run.py
    ```

    Or:

    ```bash
    python3 run.py
    ```

    The backend server will start on `http://localhost:5001`

**2. Start the Frontend Server**

In a new terminal, navigate to the frontend directory:

    ```bash
    cd medico-frontend
    npm run dev
    ```

    The frontend development server will start (usually on `http://localhost:5173`)

**3. Open the Application**

Your React application should now be running. Open your web browser and navigate to `http://localhost:5173`.

The frontend is configured to proxy API requests to the backend server automatically.

## Project Structure

```
Medico_db/
├── backend/              # Flask backend application
│   ├── app/
│   │   ├── api/         # API endpoints (patients, dashboard, claims, denials)
│   │   ├── db.py        # Database connection
│   │   └── __init__.py  # Flask app factory
│   ├── app.py           # Backend entry point
│   └── requirements.txt # Python dependencies
├── medico-frontend/      # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service utilities
│   │   └── App.jsx      # Main app component
│   └── package.json     # Node.js dependencies
├── Dataset_renewed/      # CSV data files
├── settings.py          # Database configuration
├── setup_db.py          # Database setup script
└── run.py               # Backend server runner
```

## API Endpoints

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/patients/` - Get list of patients
- `GET /api/claims/` - Get all claims
- `GET /api/claims/<id>` - Get claim by ID
- `GET /api/claims/patient/<patient_id>` - Get claims by patient
- `GET /api/denials/` - Get all denials

## Troubleshooting

- **Database Connection Errors**: Make sure MySQL is running and your credentials in `settings.py` are correct
- **Port Already in Use**: If port 5001 or 5173 is already in use, you may need to stop other services or change the ports. Note: Port 5000 is often used by macOS AirPlay, so we use 5001 instead
- **"Failed to load dashboard statistics"**: Make sure the backend server is running on port 5001 and the frontend proxy is configured correctly
- **Module Not Found Errors**: Make sure you've installed all dependencies for both backend and frontend
- **CORS Errors**: The backend has CORS enabled, but if you encounter issues, check that the backend is running on port 5000
