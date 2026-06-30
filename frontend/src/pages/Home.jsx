import { useNavigate } from "react-router"
import { useAuth } from "../context/useAuth"
import Header from "../components/Header"
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { Plus, Calendar, MapPin, Music, Tag, ArrowUpRight, ImageIcon } from "lucide-react";
import AddFestivalModal from "../modal/AddFestivalModal";
import ToastNotifications from "../components/ToastNotifications";
import axios from "axios"; // Assurez-vous d'avoir configuré vos appels API ou d'importer une fonction dédiée

export default function Home(){
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [festivals, setFestivals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useAuth();
    const [toasts, setToasts] = useState([]);

    const triggerToast = (message, type = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    // Charger les festivals depuis le backend FastAPI au démarrage
    useEffect(() => {
        const fetchFestivals = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get("http://localhost:8000/festivals");
                // On s'assure de stocker un tableau propre pour éviter les erreurs d'itérations futures
                setFestivals(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Erreur lors de la récupération des festivals:", error);
                triggerToast("Impossible de charger la liste des festivals", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFestivals();
    }, []);

    // Formatteur de date pour l'affichage de la carte (ex: "15 Juil. 2026")
    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return(
        <div className="bg-slate-50 text-slate-800 min-h-screen font-sans antialiased overflow-x-hidden relative flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300">
            {/* Light Ambient Decorative Gradient Orbs (matches Aura's login look) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-200/30 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }}></div>
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-200/20 blur-[120px]" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
            </div>

            <Header user={user}/>
            
            <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-8 flex flex-col gap-6">
                <NavBar activeTab={activeTab} setActiveTab={setActiveTab}/>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-950 bg-clip-text text-transparent">
                            Mon Agenda Festivals
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Planifiez, trackez vos tickets et visualisez vos budgets pour l'été 2026.
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-indigo-500/10 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter un Festival</span>
                    </button>
                </div>

                {/* Section d'affichage des festivals */}
                <div className="mt-4">
                    {isLoading ? (
                        /* Squelette de chargement (Shimmer Effect) */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="bg-white/60 border border-slate-200/60 rounded-3xl p-4 h-80 animate-pulse flex flex-col justify-between">
                                    <div className="bg-slate-200 rounded-2xl h-40 w-full mb-4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : festivals.length === 0 ? (
                        /* État vide si aucun festival n'est enregistré */
                        <div className="bg-white/40 backdrop-blur-md border border-slate-200/80 rounded-3xl p-12 text-center max-w-xl mx-auto mt-6 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Aucun festival programmé</h3>
                            <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
                                Votre agenda est vide pour le moment. Commencez à planifier votre été 2026 dès maintenant !
                            </p>
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                            >
                                Créer mon premier festival
                            </button>
                        </div>
                    ) : (
                        /* Grille de cartes Design */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {festivals.map((festival) => (
                                <div 
                                    key={festival.id} 
                                    className="group bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300/40 transition-all duration-300 flex flex-col"
                                >
                                    {/* Image Container */}
                                    <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
                                        {festival.cover_image_url ? (
                                            <img 
                                                src={`http://localhost:8000${festival.cover_image_url}`} 
                                                alt={festival.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.target.onerror = null; 
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.classList.add('flex-col', 'justify-center', 'items-center');
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50 text-indigo-300">
                                                <ImageIcon className="w-8 h-8 opacity-60" />
                                            </div>
                                        )}
                                        
                                        {/* Badge de date flottant */}
                                        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm text-[10px] font-bold text-slate-700 flex items-center space-x-1.5">
                                            <Calendar className="w-3 h-3 text-indigo-500" />
                                            <span>{formatDate(festival.start_date).split(' ')[0]} {formatDate(festival.start_date).split(' ')[1]}</span>
                                        </div>
                                    </div>

                                    {/* Content Container */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-base font-extrabold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                    {festival.name}
                                                </h3>
                                                {festival.main_page_url && (
                                                    <a 
                                                        href={festival.main_page_url} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 rounded-lg transition-all"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Localisation */}
                                            <div className="flex items-center space-x-1.5 text-slate-500">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="text-xs font-semibold truncate">{festival.location}</span>
                                            </div>
                                        </div>

                                        {/* Genres & Tags */}
                                        <div className="space-y-2 pt-1">
                                            {/* Genres */}
                                            {festival.genres && festival.genres.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {festival.genres.slice(0, 3).map((genre, idx) => (
                                                        <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-[10px]">
                                                            <Music className="w-2.5 h-2.5 opacity-75" />
                                                            <span>{genre}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {festival.tags && festival.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {festival.tags.slice(0, 3).map((tag, idx) => (
                                                        <span key={idx} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-lg text-[10px]">
                                                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                                                            <span>{tag}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer de la carte */}
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                            <span>Du {formatDate(festival.start_date)}</span>
                                            <span>Au {formatDate(festival.end_date)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            
            <ToastNotifications toasts={toasts} />
            
            {showAddModal && (
                <AddFestivalModal 
                    setShowAddModal={setShowAddModal} 
                    triggerToast={triggerToast} 
                    setFestivals={setFestivals} 
                />
            )}
        </div>
    )
}