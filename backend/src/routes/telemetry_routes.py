from flask import Blueprint, render_template, jsonify, request, send_file
from src.services.telemetry_service import get_all_telemetry, get_last_telemetry, filter_telemetry, export_csv
import io

telemetry_bp = Blueprint("telemetry", __name__)

@telemetry_bp.route("/", methods=["GET"])
def dashboard():
    return render_template("dashboard.html")

@telemetry_bp.route("/api/all", methods=["GET"])
def all_data():
    return jsonify(get_all_telemetry())

@telemetry_bp.route("/api/last", methods=["GET"])
def last_data():
    return jsonify(get_last_telemetry())

@telemetry_bp.route("/api/filter", methods=["GET"])
def filter_data():
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    return jsonify(filter_telemetry(from_date, to_date))

@telemetry_bp.route("/api/export", methods=["GET"])
def export_data():
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    csv = export_csv(from_date, to_date)
    return send_file(
        io.BytesIO(csv),
        as_attachment=True,
        download_name="telemetria.csv",
        mimetype="text/csv"
    )
