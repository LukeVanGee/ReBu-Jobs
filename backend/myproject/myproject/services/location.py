import requests
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')


def geocode_address(address):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": GOOGLE_API_KEY
    }

    res = requests.get(url, params=params)
    data = res.json()

    if data["status"] != "OK":
        return None

    location = data["results"][0]["geometry"]["location"]
    return location["lat"], location["lng"]


def calculate_eta(origin_lat, origin_lng, dest_lat, dest_lng):
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"

    params = {
        "origins": f"{origin_lat},{origin_lng}",
        "destinations": f"{dest_lat},{dest_lng}",
        "key": GOOGLE_API_KEY
    }

    res = requests.get(url, params=params)
    data = res.json()

    if data["status"] != "OK":
        return None

    element = data["rows"][0]["elements"][0]

    return {
        "distance": element["distance"]["text"],
        "duration": element["duration"]["text"]
    }