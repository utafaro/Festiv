import { useEffect, useRef, useState } from "react";
import { X, MapPinOff } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const TargetIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const OwnIcon = L.divIcon({
  html: `<div class="follow-map-own-inner" style="width:34px;height:34px;border-radius:17px;background:rgba(79,70,229,0.18);display:flex;align-items:center;justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#4f46e5" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L19 21L12 17L5 21L12 2Z" />
    </svg>
  </div>`,
  className: "follow-map-own-marker",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const geoSupported = typeof navigator !== "undefined" && !!navigator.geolocation;

function formatAgo(iso) {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.round(diffMin / 60)} h`;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(points, { padding: [60, 60] });
  }, [points, map]);
  return null;
}

export default function FollowMapModal({ target, onClose }) {
  const [myCoords, setMyCoords] = useState(null);
  const [heading, setHeading] = useState(0);
  const [geoError, setGeoError] = useState(
    geoSupported ? "" : "Votre navigateur ne supporte pas la géolocalisation.",
  );
  const ownMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!geoSupported) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setMyCoords([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoError("Autorisez l'accès à votre position pour utiliser la carte."),
      { enableHighAccuracy: true, maximumAge: 2000 },
    );

    const handleOrientation = (e) => {
      if (e.webkitCompassHeading != null) {
        setHeading(e.webkitCompassHeading);
      } else if (e.absolute && e.alpha != null) {
        setHeading((360 - e.alpha) % 360);
      }
    };
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  useEffect(() => {
    const inner = ownMarkerRef.current?.getElement?.()?.querySelector(".follow-map-own-inner");
    if (inner) inner.style.transform = `rotate(${heading}deg)`;
  }, [heading, myCoords]);

  const targetCoords = target && target.lat != null ? [target.lat, target.lng] : null;
  const points = myCoords && targetCoords ? [myCoords, targetCoords] : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-[1000]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-8 pb-2 text-center">
          <h3 className="text-white text-lg font-extrabold">{target?.full_name || "Retrouver"}</h3>
        </div>

        {!geoSupported ? (
          <div className="py-16 px-6 flex flex-col items-center gap-3 text-center">
            <MapPinOff className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-300">{geoError}</p>
          </div>
        ) : !myCoords ? (
          <div className="py-16 px-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-slate-300">{geoError || "Localisation en cours..."}</p>
          </div>
        ) : !targetCoords ? (
          <div className="py-16 px-6 flex flex-col items-center gap-3 text-center">
            <MapPinOff className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-300">
              {target?.full_name || "Cette personne"} ne partage plus sa position.
            </p>
          </div>
        ) : (
          <div className="h-[60vh] relative">
            <MapContainer center={myCoords} zoom={15} scrollWheelZoom className="w-full h-full">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker ref={ownMarkerRef} position={myCoords} icon={OwnIcon} />
              <Marker position={targetCoords} icon={TargetIcon} />
              <FitBounds points={points} />
            </MapContainer>

            <div className="absolute left-4 right-4 bottom-4 bg-slate-900/90 rounded-2xl px-4 py-3 z-[1000]">
              <p className="text-white text-sm font-bold">{target?.full_name || "Cette personne"}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">
                position {formatAgo(target.geo_updated_at)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
