import { useEffect, useRef, useState } from "react";
import { X, Navigation, MapPinOff, Compass as CompassIcon } from "lucide-react";

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function bearingBetween(from, to) {
  const y = Math.sin(toRad(to.lng - from.lng)) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lng - from.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceBetween(from, to) {
  const R = 6371000;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatAgo(iso) {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.round(diffMin / 60)} h`;
}

const geoSupported = typeof navigator !== "undefined" && !!navigator.geolocation;

const hasOrientationPermissionGate =
  typeof window !== "undefined" &&
  typeof window.DeviceOrientationEvent !== "undefined" &&
  typeof window.DeviceOrientationEvent.requestPermission === "function";

export default function CompassModal({ target, onClose }) {
  const [myCoords, setMyCoords] = useState(null);
  const [geoError, setGeoError] = useState(
    geoSupported ? "" : "Votre navigateur ne supporte pas la géolocalisation.",
  );
  const [heading, setHeading] = useState(null);
  const [orientationDenied, setOrientationDenied] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!geoSupported) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError("Autorisez l'accès à votre position pour utiliser la boussole."),
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

  const requestOrientationPermission = async () => {
    try {
      const result = await window.DeviceOrientationEvent.requestPermission();
      if (result !== "granted") setOrientationDenied(true);
    } catch {
      setOrientationDenied(true);
    }
  };

  const targetCoords = target ? { lat: target.lat, lng: target.lng } : null;
  const bearing = myCoords && targetCoords ? bearingBetween(myCoords, targetCoords) : null;
  const distance = myCoords && targetCoords ? distanceBetween(myCoords, targetCoords) : null;
  const isLive = heading != null;
  const arrowRotation = bearing == null ? 0 : isLive ? (bearing - heading + 360) % 360 : bearing;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
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
            <p className="text-sm text-slate-300">
              {geoError || "Localisation en cours..."}
            </p>
          </div>
        ) : !targetCoords ? (
          <div className="py-16 px-6 flex flex-col items-center gap-3 text-center">
            <MapPinOff className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-300">
              {target?.full_name || "Cette personne"} ne partage plus sa position.
            </p>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center gap-6">
            <div
              className="w-56 h-56 rounded-full border-2 border-white/15 flex items-center justify-center relative"
              style={{
                transform: `rotate(${arrowRotation}deg)`,
                transition: "transform 150ms linear",
              }}
            >
              <Navigation className="w-16 h-16 text-fuchsia-500" fill="currentColor" />
            </div>

            <div className="text-center space-y-1">
              <p className="text-white text-2xl font-extrabold">{formatDistance(distance)}</p>
              <p className="text-slate-400 text-xs font-semibold">
                position {formatAgo(target.geo_updated_at)}
              </p>
            </div>

            {!isLive && (
              <div className="text-center px-6 space-y-2">
                <p className="text-slate-500 text-[11px]">
                  Flèche orientée par rapport au nord (pas de boussole détectée sur cet appareil).
                </p>
                {hasOrientationPermissionGate && !orientationDenied && (
                  <button
                    onClick={requestOrientationPermission}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold transition"
                  >
                    <CompassIcon className="w-3.5 h-3.5" /> Activer la boussole
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
