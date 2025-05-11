import requests
from src.utils.config import BASE_URL

def get_all_telemetry():
    try:
        res = requests.get(f"{BASE_URL}/all-data")
        return res.json()
    except Exception as e:
        return {"error": str(e)}

def get_last_telemetry():
    try:
        res = requests.get(f"{BASE_URL}/last-data")
        return res.json()
    except Exception as e:
        return {"error": str(e)}

def filter_telemetry(from_date, to_date):
    try:
        res = requests.get(f"{BASE_URL}/data", params={"from": from_date, "to": to_date})
        return res.json()
    except Exception as e:
        return {"error": str(e)}

def export_csv(from_date, to_date):
    try:
        res = requests.get(f"{BASE_URL}/export", params={"from": from_date, "to": to_date})
        return res.content
    except Exception as e:
        raise Exception("No se pudo exportar el CSV: " + str(e))
