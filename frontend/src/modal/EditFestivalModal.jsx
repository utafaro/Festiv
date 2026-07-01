import {
  ChevronRight,
  Image,
  MapPin,
  Music,
  Save,
  RefreshCw,
  Tag,
  Trash2,
  X,
  Link,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { updateFestival } from "../api/festival";

export default function EditFestivalModal({
  festival, // Le festival complet à modifier passé par le parent
  setShowEditModal,
  triggerToast,
  setFestivals,
}) {
  // On formate les dates de l'API (ISO) au format "YYYY-MM-DD" pour les inputs HTML type="date"
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const [editFest, setEditFest] = useState({
    name: festival.name || "",
    location: festival.location || "",
    genres: festival.genres ? festival.genres.join(", ") : "", // Reconvertit le tableau en string séparée par des virgules
    tags: festival.tags ? festival.tags.join(", ") : "", // Idem
    start_date: formatDateForInput(festival.start_date),
    end_date: formatDateForInput(festival.end_date),
    main_page_url: festival.main_page_url || "",
    ticket_office_url: festival.ticket_office_url || "",
    akkros_url: festival.akkros_url || "",
    merch_url: festival.merch_url || "",
    cover_image_url: festival.cover_image_url
      ? `http://localhost:8000${festival.cover_image_url}`
      : "",
  });

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [locationQuery, setLocationQuery] = useState(festival.location || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceRef = useRef(null);

  // Nettoyage de l'URL blob créée si le composant est démonté brutalement
  useEffect(() => {
    return () => {
      if (
        editFest.cover_image_url &&
        editFest.cover_image_url.startsWith("blob:")
      ) {
        URL.revokeObjectURL(editFest.cover_image_url);
      }
    };
  }, [editFest.cover_image_url]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);
    setEditFest((prev) => ({ ...prev, location: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&featuretype=settlement&addressdetails=1&limit=5&accept-language=fr`;
        const response = await fetch(url, {
          headers: { "User-Agent": "MonAppReact/1.0" },
        });
        const data = await response.json();

        const formattedCities = data.map((item) => {
          const city =
            item.address.city ||
            item.address.town ||
            item.address.village ||
            item.display_name.split(",")[0];
          const country = item.address.country;
          return { id: item.place_id, label: `${city}, ${country}` };
        });

        setSuggestions(
          formattedCities.filter(
            (v, i, a) => a.findIndex((t) => t.label === v.label) === i,
          ),
        );
      } catch (error) {
        console.error("Erreur géo-détection :", error);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("L'image dépasse la limite autorisée de 5 Mo.", "warning");
        return;
      }

      if (
        editFest.cover_image_url &&
        editFest.cover_image_url.startsWith("blob:")
      ) {
        URL.revokeObjectURL(editFest.cover_image_url);
      }

      const localBlobUrl = URL.createObjectURL(file);
      setEditFest((prev) => ({ ...prev, cover_image_url: localBlobUrl }));
      setSelectedImageFile(file);
      triggerToast(`Nouvelle image mise en attente.`, "success");
    }
  };

  const handleRemoveUploadedImage = () => {
    if (
      editFest.cover_image_url &&
      editFest.cover_image_url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(editFest.cover_image_url);
    }
    setEditFest((prev) => ({ ...prev, cover_image_url: "" }));
    setSelectedImageFile(null);
    triggerToast(
      "Image supprimée du formulaire (sera vidée à l'enregistrement).",
      "info",
    );
  };

  const handleSelect = (city) => {
    setLocationQuery(city.label);
    setEditFest((prev) => ({ ...prev, location: city.label }));
    setSuggestions([]);
  };

  const handleEditFestival = async (e) => {
    e.preventDefault();
    if (
      !editFest.name ||
      !editFest.location ||
      !editFest.start_date ||
      !editFest.end_date
    ) {
      triggerToast(
        "Veuillez remplir au moins le nom, le lieu et les dates.",
        "warning",
      );
      return;
    }

    setIsSubmitting(true);

    const genresArray = editFest.genres
      ? editFest.genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [];
    const tagsArray = editFest.tags
      ? editFest.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const festivalTextData = {
      name: editFest.name,
      location: editFest.location,
      genres: genresArray,
      tags: tagsArray,
      start_date: new Date(editFest.start_date).toISOString(),
      end_date: new Date(editFest.end_date).toISOString(),
      main_page_url: editFest.main_page_url || null,
      ticket_office_url: editFest.ticket_office_url || null,
      akkros_url: editFest.akkros_url || null,
      merch_url: editFest.merch_url || null,
      set_ids: festival.set_ids || [], // On conserve les sets existants du festival
      cover_image_url: selectedImageFile
        ? null
        : editFest.cover_image_url
          ? festival.cover_image_url
          : null,
    };

    try {
      const response = await updateFestival(
        festival.id,
        festivalTextData,
        selectedImageFile,
      );

      // Mise à jour de la liste locale des festivals dans l'état du parent
      setFestivals((prev) =>
        prev.map((f) => (f.id === festival.id ? response : f)),
      );

      setIsSubmitting(false);
      setShowEditModal(false);
      triggerToast(
        `"${festivalTextData.name}" modifié avec succès !`,
        "success",
      );
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      triggerToast("Erreur lors de la modification du festival", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
        <button
          onClick={() => setShowEditModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-extrabold text-slate-800">
            Modifier le Festival
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mettez à jour les informations de l'événement et enregistrez vos
            changements.
          </p>
        </div>

        <form onSubmit={handleEditFestival} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-500 font-bold">
              Nom du Festival * :
            </label>
            <input
              type="text"
              required
              value={editFest.name}
              onChange={(e) =>
                setEditFest({ ...editFest, name: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="relative space-y-1">
            <label className="text-slate-500 font-bold">
              Lieu / Destination * :
            </label>
            <input
              type="text"
              required
              value={locationQuery}
              onChange={handleInputChange}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            />
            {loading && (
              <div className="absolute right-3.5 top-9 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
              </div>
            )}

            {suggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white/95 backdrop-blur-md mt-2 border border-slate-200/85 rounded-2xl shadow-xl p-2 max-h-60 overflow-y-auto scrollbar-none">
                {suggestions.map((city) => (
                  <li
                    key={city.id}
                    className="group flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer text-xs"
                    onClick={() => handleSelect(city)}
                  >
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-indigo-500" />
                    <span className="flex-1 truncate">{city.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold">
                Date de Début * :
              </label>
              <input
                type="date"
                required
                value={editFest.start_date}
                onChange={(e) =>
                  setEditFest({ ...editFest, start_date: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold">
                Date de Fin * :
              </label>
              <input
                type="date"
                required
                value={editFest.end_date}
                onChange={(e) =>
                  setEditFest({ ...editFest, end_date: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-500 font-bold block">
              Image de couverture :
            </label>

            {editFest.cover_image_url ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-32 group">
                <img
                  src={editFest.cover_image_url}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveUploadedImage}
                    className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md cursor-pointer"
                    title="Supprimer l'image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-50/10 transition-all">
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer space-y-2">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Image className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-slate-700 block">
                      Remplacer l'image
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG ou WEBP jusqu'à 5 Mo
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold flex items-center space-x-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-500" />
                <span>Genres (séparés par virgule) :</span>
              </label>
              <input
                type="text"
                value={editFest.genres}
                onChange={(e) =>
                  setEditFest({ ...editFest, genres: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tags (séparés par virgule) :</span>
              </label>
              <input
                type="text"
                value={editFest.tags}
                onChange={(e) =>
                  setEditFest({ ...editFest, tags: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              className="w-full px-4 py-3 text-left font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <Link className="w-4 h-4 text-indigo-500" />
                <span>Modifier les Liens de l'événement</span>
              </span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showAdvancedFields ? "rotate-90" : ""}`}
              />
            </button>

            {showAdvancedFields && (
              <div className="p-4 space-y-3.5 border-t border-slate-100 bg-white">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">
                    Lien page principale :
                  </label>
                  <input
                    type="url"
                    value={editFest.main_page_url}
                    onChange={(e) =>
                      setEditFest({
                        ...editFest,
                        main_page_url: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">
                    Lien Billetterie :
                  </label>
                  <input
                    type="url"
                    value={editFest.ticket_office_url}
                    onChange={(e) =>
                      setEditFest({
                        ...editFest,
                        ticket_office_url: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">
                    Lien Akkros :
                  </label>
                  <input
                    type="url"
                    value={editFest.akkros_url}
                    onChange={(e) =>
                      setEditFest({ ...editFest, akkros_url: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">
                    Lien Boutique Merch :
                  </label>
                  <input
                    type="url"
                    value={editFest.merch_url}
                    onChange={(e) =>
                      setEditFest({ ...editFest, merch_url: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r cursor-pointer from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl transition-all uppercase tracking-wider shadow-md shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center space-x-2 text-xs"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
