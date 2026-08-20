import { useEffect, useState } from "react";
import { X, RefreshCw, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { pingGeo } from "../api/suivi";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const geoSupported = typeof navigator !== "undefined" && !!navigator.geolocation;

export default function GeoPingModal({ suiviId, onClose, onSaved, triggerToast }) {
  const [loading, setLoading] = useState(geoSupported);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(
    geoSupported ? "" : "Votre navigateur ne supporte pas la géolocalisation.",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!geoSupported) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        setError("Autorisez l'accès à votre position pour la partager.");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  const handleConfirm = async () => {
    if (!coords) return;
    setSubmitting(true);
    setError("");
    try {
      const saved = await pingGeo(suiviId, { lat: coords[0], lng: coords[1] });
      onSaved(saved);
      triggerToast("Position partagée !", "success");
      onClose();
    } catch {
      setError("Erreur lors du partage de votre position.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90dvh] overflow-y-auto scrollbar-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-extrabold text-slate-800">Ma position</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ajustez le repère si besoin, puis partagez votre position avec le suivi.
          </p>
        </div>

        {loading ? (
          <div className="h-72 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
            Localisation en cours...
          </div>
        ) : !coords ? (
          <div className="h-72 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-center px-6">
            <MapPin className="w-6 h-6 text-slate-400" />
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        ) : (
          <div className="h-72 rounded-2xl overflow-hidden border border-slate-100 relative z-0 mb-4">
            <MapContainer center={coords} zoom={15} scrollWheelZoom={false} className="w-full h-full">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={coords}
                icon={DefaultIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    setCoords([lat, lng]);
                  },
                }}
              />
            </MapContainer>
          </div>
        )}

        {error && coords ? <p className="text-rose-600 text-xs font-semibold mb-3">{error}</p> : null}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || !coords}
          className="w-full py-4 bg-gradient-to-r cursor-pointer from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider shadow-md shadow-fuchsia-500/10 active:scale-[0.98] transform flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Partage...</span>
            </>
          ) : (
            <span>Partager ma position</span>
          )}
        </button>
      </div>
    </div>
  );
}
