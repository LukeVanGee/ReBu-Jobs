import requests
import os
import googlemaps

GOOGLE_API_KEY = 'AIzaSyD41T8-udWW_CdsrhRPZgU8jkbzy5jnF04'

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

# print(calculate_eta(40.7404549, -73.7802131, 40.759987, -73.9912338))
# print(geocode_address('194-16b 64th Ave, Fresh Meadows, NY 11365'))

# (40.7404549, -73.7802131)
# (40.759987, -73.9912338)