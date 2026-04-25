"""
CourtApp — Flask Backend
Main application entry point
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv(override=True)

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "message": "CourtApp API is running"})

    # Register blueprints
    from routes.adhikaar import adhikaar_bp
    from routes.predictor import predictor_bp
    from routes.document import document_bp

    app.register_blueprint(adhikaar_bp, url_prefix="/api")
    app.register_blueprint(predictor_bp, url_prefix="/api")
    app.register_blueprint(document_bp, url_prefix="/api")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
