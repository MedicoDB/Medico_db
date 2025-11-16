from flask import Flask
from flask_cors import CORS



def create_app():
    app = Flask(__name__)
    CORS(app)

    from .api.patients import bp as patients_bp
    app.register_blueprint(patients_bp, url_prefix="/api/patients")

    from .api.dashboard import bp as dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    from .api.claims import claims_bp
    app.register_blueprint(claims_bp)
    
    from .api.denials import denials_bp
    app.register_blueprint(denials_bp)

    return app