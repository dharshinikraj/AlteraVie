import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { MapPin, Navigation, Phone, Stethoscope, Database, Search, AlertCircle, ExternalLink } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function DoctorFinder() {
  const [places, setPlaces] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Search by city, locality or pincode, or use your current location.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    mapObj.current = L.map(mapRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapObj.current);
    return () => {
      mapObj.current?.remove();
      mapObj.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapObj.current) return;
    if (layer.current) layer.current.clearLayers();
    layer.current = L.layerGroup().addTo(mapObj.current);
    const bounds = [];
    places.forEach((p) => {
      if (typeof p.latitude !== "number" || typeof p.longitude !== "number") return;
      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
      const popup = document.createElement("div");
      popup.innerHTML = `<strong>${escapeHtml(p.name || "Healthcare facility")}</strong><br/>${escapeHtml(p.specialties || "Healthcare")}<br/>${Number(p.distance_miles || 0).toFixed(1)} mi<br/><a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="color:#278657;font-weight:bold;font-size:11px;display:inline-block;margin-top:4px;">📍 Open in Google Maps</a>`;
      L.marker([p.latitude, p.longitude]).bindPopup(popup).addTo(layer.current);
      bounds.push([p.latitude, p.longitude]);
    });
    if (bounds.length) mapObj.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [places]);

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
  }

  async function runCoordinateSearch(lat, lng) {
    setLoading(true);
    setError("");
    setStatus("Searching live OpenStreetMap healthcare listings…");
    try {
      const r = await api.searchSpecialists(lat, lng);
      const list = Array.isArray(r) ? r : [];
      setPlaces(list);
      setStatus(list.length ? `${list.length} live healthcare listings found nearby.` : "No named healthcare listings were found in the selected radius.");
      if (!list.length) setError("Try a nearby city/locality search below or broaden the area.");
    } catch (e) {
      setPlaces([]);
      setError(e.message || "Live healthcare lookup failed.");
      setStatus("Could not complete the live search.");
    } finally {
      setLoading(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("This browser does not provide geolocation. Search by city or pincode instead.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      (pos) => runCoordinateSearch(pos.coords.latitude, pos.coords.longitude),
      (geoError) => {
        setLoading(false);
        const insecure = window.location.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(window.location.hostname);
        setStatus("Location could not be used.");
        setError(
          insecure
            ? "Phone browsers block GPS on plain HTTP. Use the city/pincode search now; GPS will work once the app is served over HTTPS or packaged natively."
            : geoError.code === 1
              ? "Location permission was denied. Search by city/locality/pincode instead."
              : "Your location could not be determined. Search manually instead."
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 }
    );
  }

  async function searchPlace(e) {
    e?.preventDefault();
    const value = query.trim();
    if (value.length < 2) {
      setError("Enter a city, locality, or pincode.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus(`Searching healthcare listings around ${value}…`);
    try {
      const r = await api.searchSpecialistsByPlace(value);
      const list = Array.isArray(r?.places) ? r.places : [];
      setPlaces(list);
      if (r?.location && mapObj.current) {
        mapObj.current.setView([r.location.latitude, r.location.longitude], 12);
      }
      setStatus(list.length ? `${list.length} live healthcare listings found around ${r?.location?.display_name || value}.` : `No named healthcare listings were returned around ${value}.`);
      if (!list.length) setError("Try a broader nearby place name (for example, the nearest city) rather than a very small locality.");
    } catch (e) {
      setPlaces([]);
      setError(e.message || "Place search failed.");
      setStatus("Could not complete the live search.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-0 sm:px-6 py-0 sm:py-7">
      <section className="px-4 sm:px-0 pt-5 sm:pt-0 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.16em] font-extrabold text-emerald-600 dark:text-emerald-300">Nearby care</p>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-950 dark:text-white mt-1">Find a specialist</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{status}</p>
          </div>
          <span className="source-pill hidden sm:inline-flex"><Database className="w-3.5 h-3.5" /> OpenStreetMap live</span>
        </div>

        <form onSubmit={searchPlace} className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City, locality or pincode"
              className="w-full min-h-11 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <button type="submit" disabled={loading} className="app-primary-button disabled:opacity-60">
            <Search className="w-4 h-4" /> Search place
          </button>
          <button type="button" onClick={locate} disabled={loading} className="min-h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60">
            <Navigation className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} /> Use GPS
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}
      </section>

      <section className="relative">
        <div ref={mapRef} className="h-[46dvh] min-h-[330px] sm:h-[460px] sm:rounded-3xl overflow-hidden border-y sm:border border-slate-200 dark:border-slate-700" />
        <div className="sm:hidden absolute top-3 right-3 source-pill shadow-sm"><Database className="w-3.5 h-3.5" /> OSM live</div>
      </section>

      <section className="specialist-sheet">
        <div className="specialist-sheet-handle sm:hidden" />
        <div className="flex items-center justify-between gap-3 mb-4">
          <div><p className="text-[10px] uppercase tracking-[.14em] font-extrabold text-emerald-600">Results</p><h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Nearby healthcare</h2></div>
          {places.length > 0 && <span className="text-xs font-bold text-slate-400">{places.length} places</span>}
        </div>
        {places.length === 0 ? (
          <div className="data-state-card"><MapPin className="w-5 h-5 text-emerald-600 mb-2" />No live results loaded yet. Search a place above or use GPS.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {places.map((p) => {
              const gmapsUrl = (typeof p.latitude === "number" && typeof p.longitude === "number")
                ? `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.name || "") + " " + (p.address || ""))}`;

              return (
                <article
                  key={`${p.id}-${p.name}`}
                  className="specialist-result-card group cursor-pointer hover:border-emerald-500/50 transition-all"
                  onClick={(e) => {
                    if (e.target.closest("a")) return;
                    window.open(gmapsUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        📍 Google Maps
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.specialties || "Healthcare facility"}</p>
                    {p.address && <p className="text-[11px] text-slate-400 mt-1">{p.address}</p>}
                    <p className="text-[11px] text-slate-400 mt-1.5">{p.distance_miles} miles · {p.source || "OpenStreetMap"}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <a
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                        href={gmapsUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Open in Google Maps
                      </a>
                      {p.phone && <a className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline" href={`tel:${p.phone}`}><Phone className="w-3.5 h-3.5" /> Call</a>}
                      {p.website && <a className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline" href={p.website} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /> Website</a>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
