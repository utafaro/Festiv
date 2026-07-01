import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router"; // Remplacement des props par les hooks de routage
import {
  Calendar,
  MapPin,
  Music,
  Tag,
  ArrowLeft,
  ExternalLink,
  Ticket,
  Radio,
  Layers,
  Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { getFestivalById } from "../api/festival";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function FestivalDetailPage() {
  const { id } = useParams(); // Récupère le paramètre :id de l'URL
  const navigate = useNavigate(); // Permet le retour à la page précédente

  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState([46.603354, 1.888334]);
  const [mapLoading, setMapLoading] = useState(true);

  // 1. Récupérer les données du festival depuis l'API globale
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Appel direct à votre fonction fournie
        const data = await getFestivalById(id);
        setFestival(data);
      } catch (err) {
        console.error("Erreur attrapée dans le composant :", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  // 2. Géocodage de la localisation pour la carte OpenStreetMap
  useEffect(() => {
    if (!festival?.location) return;

    const fetchCoords = async () => {
      try {
        setMapLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(festival.location)}&limit=1`;
        const response = await fetch(url, {
          headers: { "User-Agent": "FestivLightApp/1.0" },
        });
        const data = await response.json();
        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (error) {
        console.error("Erreur de géocodage pour la carte :", error);
      } finally {
        setMapLoading(false);
      }
    };

    fetchCoords();
  }, [festival?.location]);

  // Formatteur de date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // État de chargement initial (Données de l'API)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">
          Chargement des informations du festival...
        </p>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <p className="text-slate-700 font-semibold text-lg mb-4">
          Le festival demandé est introuvable.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>
      </div>
    );
  }

  // Mock-up d'artistes de secours si la table n'est pas encore implémentée au complet dans votre bdd
  const artistsList = festival.artists || [
    {
      name: "Headliner Act",
      genre: festival.genres?.[0] || "Live Electronic",
      time: "22:00 - 23:30",
      stage: "Main Stage",
    },
    {
      name: "Rising Star",
      genre: festival.genres?.[1] || festival.genres?.[0] || "Techno",
      time: "20:30 - 21:45",
      stage: "The Lab",
    },
    {
      name: "Local Hero",
      genre: festival.tags?.[0] || "House",
      time: "19:00 - 20:15",
      stage: "Alternative Stage",
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-x-hidden pb-12 font-sans antialiased">
      {/* Halos lumineux d'ambiance de la charte "Festiv Light Premium" */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse pointer-events-none"
        style={{ animationDuration: "12s" }}
      />
      <div
        className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-200/20 blur-[120px] animate-pulse pointer-events-none"
        style={{ animationDuration: "15s", animationDelay: "1s" }}
      />

      {/* Header avec bouton Retour géré par react-router */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")} // Utilise l'historique du routeur
            className="group inline-flex items-center space-x-2 text-slate-600 hover:text-indigo-600 text-sm font-medium transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Retour aux festivals</span>
          </button>

          <div className="flex items-center space-x-3">
            {festival.ticket_office_url && (
              <a
                href={festival.ticket_office_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl shadow-sm transition-all text-xs sm:text-sm"
              >
                <Ticket className="w-4 h-4" />
                <span>Billetterie</span>
              </a>
            )}
            {festival.main_page_url && (
              <a
                href={festival.main_page_url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 text-slate-500 bg-slate-100/80 border border-slate-200/60 rounded-xl hover:text-indigo-600 hover:bg-white transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Grid Principal */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Gauche & Centre */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image de couverture */}
          <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl overflow-hidden relative">
            <div className="h-64 sm:h-96 w-full relative bg-slate-200">
              {festival.cover_image_url ? (
                <img
                  src={
                    festival.cover_image_url.startsWith("http")
                      ? festival.cover_image_url
                      : `http://localhost:8000${festival.cover_image_url}`
                  }
                  alt={festival.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
                  <Music className="w-16 h-16 stroke-[1.5]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">
                  {festival.name}
                </h1>
                <span className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm w-fit px-3 py-1 rounded-full text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{festival.location}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section Artistes */}
          <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                <Radio className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Line-up & Artistes
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {artistsList.map((artist, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-100/60 border border-slate-200/40 rounded-2xl hover:bg-white hover:border-indigo-100 transition shadow-sm hover:shadow-md group"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {artist.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                      <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {artist.stage}
                      </span>
                      <span>•</span>
                      <span>{artist.time}</span>
                    </div>
                  </div>
                  <span className="inline-flex px-2.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-[10px] uppercase tracking-wide">
                    {artist.genre}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Métadonnées & Carte */}
        <div className="space-y-8">
          <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informations
            </h2>

            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dates
                </h4>
                <p className="text-sm font-medium text-slate-800 mt-0.5">
                  Du {formatDate(festival.start_date)}
                </p>
                <p className="text-sm font-medium text-slate-800">
                  Au {formatDate(festival.end_date)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Localisation
                </h4>
                <p className="text-sm font-medium text-slate-800 mt-0.5">
                  {festival.location}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              {festival.genres && festival.genres.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-indigo-500" /> Genres
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {festival.genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-[10px]"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Interactive OpenStreetMap */}
          <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-4 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Plan d'accès</span>
            </h2>
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-100 relative z-0">
              {mapLoading ? (
                <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                  Chargement de la carte...
                </div>
              ) : (
                <MapContainer
                  center={coordinates}
                  zoom={13}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={coordinates}>
                    <Popup>
                      <div className="text-xs font-sans">
                        <strong className="text-slate-900">
                          {festival.name}
                        </strong>
                        <p className="text-slate-600 mt-0.5">
                          {festival.location}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
