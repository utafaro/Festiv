import { ChevronRight, Image, MapPin, Music, Plus, RefreshCw, Tag, Trash2, X, Link } from "lucide-react";
import { useRef, useState } from "react";
import { createFestival } from "../api/festival";

export default function AddFestivalModal({
  setShowAddModal,
  triggerToast,
  setFestivals
}){
  // Backend Model-Compliant State matching FestivalCreateRequest
  const [newFest, setNewFest] = useState({
    name: '',
    location: '', // Sera mis à jour à la sélection de la ville
    genres: '', // Input as comma separated string -> mapped to list
    tags: '',   // Input as comma separated string -> mapped to list
    start_date: '',
    end_date: '',
    main_page_url: '',
    ticket_office_url: '',
    akkros_url: '',
    merch_url: '',
    cover_image_url: '' // Preview URL (Blob URL)
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [locationQuery, setLocationQuery] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);

    // Mettre également à jour la location brute dans l'objet au cas où l'utilisateur n'utilise pas la suggestion
    setNewFest(prev => ({ ...prev, location: value }));

    // 1. Nettoyer le timeout précédent dès que l'utilisateur tape une nouvelle lettre
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 2. Si le texte est trop court, on vide immédiatement les suggestions
    if (value.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // 3. Déclencher le debounce pour l'appel API
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&featuretype=settlement&addressdetails=1&limit=5&accept-language=fr`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': 'MonAppReact/1.0' }
        });
        const data = await response.json();
        
        const formattedCities = data.map(item => {
          const city = item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0];
          const country = item.address.country;
          return {
            id: item.place_id,
            label: `${city}, ${country}`,
          };
        });

        const uniqueCities = formattedCities.filter((v, i, a) => a.findIndex(t => t.label === v.label) === i);
        
        setSuggestions(uniqueCities);
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms d'attente
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("L'image dépasse la limite autorisée de 5 Mo.", "warning");
        return;
      }
      
      // Cleanup previous preview URL to prevent memory leaks
      if (newFest.cover_image_url && newFest.cover_image_url.startsWith('blob:')) {
        URL.revokeObjectURL(newFest.cover_image_url);
      }
      
      const localBlobUrl = URL.createObjectURL(file);
      setNewFest(prev => ({ ...prev, cover_image_url: localBlobUrl }));
      setSelectedImageFile(file); // Hold original File object for FormData payload
      triggerToast(`Fichier "${file.name}" importé avec succès !`, "success");
    }
  };

  // Reset the uploaded image state cleanly
  const handleRemoveUploadedImage = () => {
    if (newFest.cover_image_url && newFest.cover_image_url.startsWith('blob:')) {
      URL.revokeObjectURL(newFest.cover_image_url);
    }
    setNewFest(prev => ({ ...prev, cover_image_url: '' }));
    setSelectedImageFile(null);
    triggerToast("Image supprimée.", "info");
  };

  const handleSelect = (city) => {
    setLocationQuery(city.label);
    setNewFest(prev => ({ ...prev, location: city.label })); // Enregistre la ville sélectionnée dans le modèle
    setSuggestions([]);
  };
  

  // Handle addition of custom Festival & format it to FastAPI schemas compatibility
  const handleAddFestival = async (e) => {
    e.preventDefault();
    if (!newFest.name || !newFest.location || !newFest.start_date || !newFest.end_date) {
      triggerToast("Veuillez remplir au moins le nom, le lieu et les dates.", "warning");
      return;
    }

    setIsSubmitting(true);

    // Convert comma-separated string back to typed string arrays (List[str])
    const genresArray = newFest.genres 
      ? newFest.genres.split(',').map(g => g.trim()).filter(Boolean) 
      : [];
    const tagsArray = newFest.tags 
      ? newFest.tags.split(',').map(t => t.trim()).filter(Boolean) 
      : [];

    // Build the exact text payload matching the FastAPI schemas
    const festivalTextData = {
      name: newFest.name,
      location: newFest.location,
      genres: genresArray,
      tags: tagsArray,
      start_date: new Date(newFest.start_date).toISOString(),
      end_date: new Date(newFest.end_date).toISOString(),
      main_page_url: newFest.main_page_url || null,
      ticket_office_url: newFest.ticket_office_url || null,
      akkros_url: newFest.akkros_url || null,
      merch_url: newFest.merch_url || null,
      set_ids: [] // Ajout du tableau vide par défaut requis par votre modèle backend
    };
     
    try {
      const response = await createFestival(festivalTextData, selectedImageFile);
      setFestivals(prev => [...(prev || []), response]);
      setIsSubmitting(false);
      setShowAddModal(false);
      
      // Reset de l'état complet
      setNewFest({
        name: '',
        location: '',
        genres: '',
        tags: '',
        start_date: '',
        end_date: '',
        main_page_url: '',
        ticket_office_url: '',
        akkros_url: '',
        merch_url: '',
        cover_image_url: ''
      });
      setSelectedImageFile(null);
      setLocationQuery('');
      setSuggestions([]);
      setShowAdvancedFields(false);
      triggerToast(`"${festivalTextData.name}" créé avec succès !`, "success");
        
    } catch (e) { 
      console.error(e);
      setIsSubmitting(false);
      triggerToast("Erreur lors de la création du festival", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
        <button 
          onClick={() => setShowAddModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-extrabold text-slate-800">Nouveau Festival</h3>
          <p className="text-xs text-slate-500 mt-1">Saisissez les informations de votre futur festival pour l'enregistrer dans votre tableau de bord.</p>
        </div>

        <form onSubmit={handleAddFestival} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-slate-500 font-bold">Nom du Festival * :</label>
            <input 
              type="text" 
              required
              placeholder="ex: We Love Green" 
              value={newFest.name}
              onChange={(e) => setNewFest({ ...newFest, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="relative space-y-1">
            <label className="text-slate-500 font-bold">Lieu / Destination * :</label>
            <input 
              type="text" 
              required
              placeholder="ex: Paris, France" 
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
              <ul className="absolute z-50 w-full bg-white/95 backdrop-blur-md mt-2 border border-slate-200/85 rounded-2xl shadow-xl shadow-slate-200/60 p-2 max-h-60 overflow-y-auto scrollbar-none transition-all duration-300 transform origin-top">
                {suggestions.map((city) => (
                  <li 
                    key={city.id} 
                    className="group flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-all duration-200"  
                    onClick={() => handleSelect(city)}
                  >
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-200" />
                    <span className="flex-1 truncate">{city.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold">Date de Début * :</label>
              <input 
                type="date" 
                required
                value={newFest.start_date}
                onChange={(e) => setNewFest({ ...newFest, start_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold">Date de Fin * :</label>
              <input 
                type="date" 
                required
                value={newFest.end_date}
                onChange={(e) => setNewFest({ ...newFest, end_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-500 font-bold block">Image de couverture (Sera stockée sur static/uploads/) :</label>
            
            {newFest.cover_image_url ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-32 group">
                <img src={newFest.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button 
                    type="button"
                    onClick={handleRemoveUploadedImage}
                    className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-md"
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
                    <span className="font-bold text-slate-700 block">Importer une image</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG ou WEBP jusqu'à 5 Mo</span>
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
                <span>Genres (séparer par virgule) :</span>
              </label>
              <input 
                type="text" 
                placeholder="ex: Electronic, Pop, Rock" 
                value={newFest.genres}
                onChange={(e) => setNewFest({ ...newFest, genres: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tags (séparer par virgule) :</span>
              </label>
              <input 
                type="text" 
                placeholder="ex: Camping, Eco, Beach" 
                value={newFest.tags}
                onChange={(e) => setNewFest({ ...newFest, tags: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              className="w-full px-4 py-3 text-left font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center"
            >
              <span className="flex items-center space-x-2">
                <Link className="w-4 h-4 text-indigo-500" />
                <span>Options & Liens du backend (FastAPI)</span>
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showAdvancedFields ? 'rotate-90' : ''}`} />
            </button>

            {showAdvancedFields && (
              <div className="p-4 space-y-3.5 border-t border-slate-100 bg-white">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">Lien page principale (main_page_url) :</label>
                  <input 
                    type="url" 
                    placeholder="https://festival.com" 
                    value={newFest.main_page_url}
                    onChange={(e) => setNewFest({ ...newFest, main_page_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">Lien Billetterie (ticket_office_url) :</label>
                  <input 
                    type="url" 
                    placeholder="https://tickets.festival.com" 
                    value={newFest.ticket_office_url}
                    onChange={(e) => setNewFest({ ...newFest, ticket_office_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">Lien Akkros (akkros_url) :</label>
                  <input 
                    type="url" 
                    placeholder="https://akkros.com/festival" 
                    value={newFest.akkros_url}
                    onChange={(e) => setNewFest({ ...newFest, akkros_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">Lien Boutique Merch (merch_url) :</label>
                  <input 
                    type="url" 
                    placeholder="https://merch.festival.com" 
                    value={newFest.merch_url}
                    onChange={(e) => setNewFest({ ...newFest, merch_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r cursor-pointer from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider shadow-md shadow-indigo-500/10 active:scale-[0.98] transform flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Création du festival en cours...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Créer le festival</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}