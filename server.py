"""
Flask application factory and entry point.
Creates and configures the Flask application instance.
"""
from flask import Flask
from views import register_routes


def create_app():
    """
    Application factory function.
    Creates and configures the Flask application.
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Secret key for session management and flash messages
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    
    # Register all routes
    register_routes(app)
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5500)

