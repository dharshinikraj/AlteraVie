from fastapi import APIRouter, HTTPException
import json
import math
import urllib.parse
import urllib.request
from urllib.error import URLError, HTTPError

router = APIRouter(prefix="/specialists", tags=["Module 7 - Live Specialist Finder"])

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
]
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "AlteraVie/2.2 healthcare-finder"


def calculate_haversine(lat1, lon1, lat2, lon2):
    r = 3958.8
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


def _read_json(req, timeout=25):
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def geocode_place(query: str):
    params = urllib.parse.urlencode({"q": query, "format": "jsonv2", "limit": 1, "addressdetails": 1})
    req = urllib.request.Request(
        f"{NOMINATIM_URL}?{params}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    data = _read_json(req, timeout=20)
    if not data:
        raise HTTPException(status_code=404, detail="Location not found. Try a city, locality, or pincode.")
    item = data[0]
    return {
        "latitude": float(item["lat"]),
        "longitude": float(item["lon"]),
        "display_name": item.get("display_name", query),
    }



def fetch_nominatim_healthcare(lat: float, lng: float, radius_km: int = 20):
    """Fallback live POI lookup using Nominatim when Overpass is unavailable.

    Nominatim is queried conservatively for a few healthcare categories and results
    are deduplicated. This keeps the app on real OSM data without a static directory.
    """
    # Approximate degree span for a local bounded search.
    lat_span = max(radius_km / 111.0, 0.02)
    lon_scale = max(math.cos(math.radians(lat)), 0.2)
    lon_span = max(radius_km / (111.0 * lon_scale), 0.02)
    viewbox = f"{lng-lon_span},{lat+lat_span},{lng+lon_span},{lat-lat_span}"
    queries = ["hospital", "clinic", "doctor"]
    out, seen = [], set()
    for term in queries:
        params = urllib.parse.urlencode({
            "q": term, "format": "jsonv2", "limit": 12,
            "addressdetails": 1, "namedetails": 1,
            "bounded": 1, "viewbox": viewbox,
        })
        req = urllib.request.Request(
            f"{NOMINATIM_URL}?{params}",
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        )
        try:
            data = _read_json(req, timeout=18)
        except Exception:
            continue
        for item in data or []:
            try:
                la, lo = float(item["lat"]), float(item["lon"])
            except Exception:
                continue
            display = item.get("display_name") or "Healthcare facility"
            named = item.get("namedetails") or {}
            name = named.get("name") or display.split(",")[0]
            key = (name.strip().lower(), round(la, 5), round(lo, 5))
            if key in seen:
                continue
            seen.add(key)
            distance = calculate_haversine(lat, lng, la, lo)
            if distance > radius_km * 0.621371 + 2:
                continue
            out.append({
                "id": f'nominatim-{item.get("osm_type", "osm")}-{item.get("osm_id", len(out))}',
                "name": name,
                "credentials": "OpenStreetMap listed healthcare facility",
                "specialties": (item.get("type") or item.get("category") or term).replace("_", " " ).title(),
                "latitude": la, "longitude": lo,
                "phone": None, "email": None,
                "address": display,
                "distance_miles": distance,
                "source": "OpenStreetMap / Nominatim",
                "website": None,
            })
    return sorted(out, key=lambda x: x["distance_miles"])

def fetch_overpass_specialists(lat: float, lng: float, radius_meters: int = 20000):
    # Include common OSM healthcare tagging variants. Named results only are displayed.
    query = f'''[out:json][timeout:20];(
      node["amenity"="hospital"](around:{radius_meters},{lat},{lng});
      node["amenity"="clinic"](around:{radius_meters},{lat},{lng});
      node["amenity"="doctors"](around:{radius_meters},{lat},{lng});
      node["healthcare"="doctor"](around:{radius_meters},{lat},{lng});
      node["healthcare"="dietitian"](around:{radius_meters},{lat},{lng});
      node["healthcare"="nutritionist"](around:{radius_meters},{lat},{lng});
      way["amenity"="hospital"](around:{radius_meters},{lat},{lng});
      way["amenity"="clinic"](around:{radius_meters},{lat},{lng});
      way["amenity"="doctors"](around:{radius_meters},{lat},{lng});
      way["healthcare"="doctor"](around:{radius_meters},{lat},{lng});
      relation["amenity"="hospital"](around:{radius_meters},{lat},{lng});
      relation["amenity"="clinic"](around:{radius_meters},{lat},{lng});
    );out center tags 120;'''

    payload = urllib.parse.urlencode({"data": query}).encode()
    last_error = None
    data = None
    for endpoint in OVERPASS_ENDPOINTS:
        try:
            req = urllib.request.Request(
                endpoint,
                data=payload,
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            )
            data = _read_json(req, timeout=28)
            break
        except (URLError, HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            continue

    if data is None:
        raise RuntimeError(f"OpenStreetMap live service unavailable: {last_error}")

    out = []
    seen = set()
    for e in data.get("elements", []):
        tags = e.get("tags", {})
        la = e.get("lat") or e.get("center", {}).get("lat")
        lo = e.get("lon") or e.get("center", {}).get("lon")
        if la is None or lo is None:
            continue
        name = tags.get("name") or tags.get("official_name") or tags.get("operator")
        if not name:
            continue
        key = (name.strip().lower(), round(float(la), 5), round(float(lo), 5))
        if key in seen:
            continue
        seen.add(key)

        specialty = (
            tags.get("healthcare:speciality")
            or tags.get("healthcare")
            or tags.get("amenity")
            or "healthcare facility"
        )
        address_parts = [
            tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:suburb"),
            tags.get("addr:city"), tags.get("addr:postcode")
        ]
        address = ", ".join(str(x) for x in address_parts if x)
        out.append({
            "id": f'{e.get("type", "osm")}-{e.get("id")}',
            "name": name,
            "credentials": "OpenStreetMap listed healthcare facility",
            "specialties": specialty.replace("_", " ").title(),
            "latitude": float(la),
            "longitude": float(lo),
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "email": tags.get("email") or tags.get("contact:email"),
            "address": address or None,
            "distance_miles": calculate_haversine(lat, lng, float(la), float(lo)),
            "source": "OpenStreetMap / Overpass",
            "website": tags.get("website") or tags.get("contact:website"),
        })

    return sorted(out, key=lambda x: x["distance_miles"])


@router.get("/search")
def search_specialists(lat: float, lng: float, radius_km: int = 20):
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates.")
    radius_km = min(max(radius_km, 2), 50)
    overpass_error = None
    try:
        results = fetch_overpass_specialists(lat, lng, radius_km * 1000)
        if results:
            return results
    except Exception as exc:
        overpass_error = exc

    try:
        results = fetch_nominatim_healthcare(lat, lng, radius_km)
        if results:
            return results
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Both live OpenStreetMap providers are unavailable. Overpass: {overpass_error}; Nominatim: {exc}",
        )

    if overpass_error:
        raise HTTPException(status_code=503, detail=f"Live OpenStreetMap lookup failed: {overpass_error}")
    return []


@router.get("/search-place")
def search_specialists_by_place(q: str, radius_km: int = 20):
    q = (q or "").strip()
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Enter a city, locality, or pincode.")
    try:
        location = geocode_place(q)
        bounded_radius = min(max(radius_km, 2), 50)
        try:
            places = fetch_overpass_specialists(
                location["latitude"], location["longitude"], bounded_radius * 1000
            )
        except Exception:
            places = fetch_nominatim_healthcare(location["latitude"], location["longitude"], bounded_radius)
        if not places:
            places = fetch_nominatim_healthcare(location["latitude"], location["longitude"], bounded_radius)
        return {"location": location, "places": places}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Live location search is temporarily unavailable. {exc}",
        )


@router.get("/places")
def places_notice(city: str | None = None):
    # Kept only for backwards compatibility. Static clinic directories are intentionally not used.
    return []
