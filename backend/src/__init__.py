from flask import Flask
from flask_cors import CORS
from src.routes.telemetry_routes import telemetry_bp

def create_app():

    app = Flask(__name__, template_folder="static", static_folder="static")
    app.register_blueprint(telemetry_bp)
    CORS(app)
    return app