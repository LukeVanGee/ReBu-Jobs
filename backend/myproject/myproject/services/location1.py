import googlemaps
from datetime import datetime
import os

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))


def geocode_address(address):
    result = gmaps.geocode(address)
    if not result:
        return None
    location = result[0]['geometry']['location']
    return location['lat'], location['lng']


def calculate_eta(origin_address, destination_address):
    now = datetime.now()

    directions = gmaps.directions(
        origin_address,
        destination_address,
        mode="driving",
        departure_time=now
    )

    if not directions:
        return None

    leg = directions[0]['legs'][0]
    return {
        "distance": leg['distance']['text'],
        "duration": leg['duration']['text']
    }