# MySQL Configuration Guide

## How to Configure settings.py

### Step 1: Find Your MySQL Credentials

#### Option A: If MySQL is Already Installed

1. **Try the default root user:**
   - Username: `root`
   - Password: The password you set when installing MySQL, or empty (`""`) if you didn't set one

2. **Test your connection:**
   ```bash
   mysql -u root -p
   ```
   - If it asks for a password, enter the password you set during installation
   - If it connects without asking for a password, use `""` (empty string) in settings.py

#### Option B: If You Don't Remember Your MySQL Password

**On macOS (using Homebrew):**
```bash
# Reset MySQL root password
brew services stop mysql
mysqld_safe --skip-grant-tables &
mysql -u root
# Then in MySQL:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
exit;
# Restart MySQL
brew services start mysql
```

**On Linux:**
```bash
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
# Then in MySQL:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
exit;
# Restart MySQL
sudo systemctl start mysql
```

#### Option C: Create a New MySQL User (Recommended for Development)

1. Connect to MySQL as root:
   ```bash
   mysql -u root -p
   ```

2. Create a new user and database:
   ```sql
   CREATE USER 'medico_user'@'localhost' IDENTIFIED BY 'medico_password';
   CREATE DATABASE medico_db;
   GRANT ALL PRIVILEGES ON medico_db.* TO 'medico_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. Then in `settings.py`:
   ```python
   DB_USER = "medico_user"
   DB_PASSWORD = "medico_password"
   ```

### Step 2: Update settings.py

Edit `settings.py` with your credentials:

```python
DB_HOST = "localhost"
DB_USER = "root"              # or "medico_user" if you created a new user
DB_PASSWORD = "your_password" # or "" if no password
DB_NAME = "medico_db"
DB_PORT = 3306
```

### Step 3: Test Your Connection

You can test if your settings work by running:

```bash
python3 -c "from settings import *; import mysql.connector; conn = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, port=DB_PORT); print('Connection successful!'); conn.close()"
```

If you see "Connection successful!", your settings are correct!

### Common Issues

1. **"Access denied" error:**
   - Check that your username and password are correct
   - Make sure the user has privileges to create databases

2. **"Can't connect to MySQL server":**
   - Make sure MySQL is running:
     - macOS: `brew services start mysql`
     - Linux: `sudo systemctl start mysql`
     - Windows: Check Services panel

3. **Port 3306 in use:**
   - Check if MySQL is using a different port
   - Find the port: `mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"`
   - Update `DB_PORT` in settings.py

### Quick Setup (No Password)

If you want to use MySQL without a password for local development:

1. Connect to MySQL:
   ```bash
   mysql -u root
   ```

2. Remove password requirement (NOT recommended for production):
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. In settings.py:
   ```python
   DB_USER = "root"
   DB_PASSWORD = ""  # Empty string
   ```

