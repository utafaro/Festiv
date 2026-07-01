import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { Plus } from "lucide-react";
import AddFestivalModal from "../modal/AddFestivalModal";
import ToastNotifications from "../components/ToastNotifications";
import axios from "axios"; // Assurez-vous d'avoir configuré vos appels API ou d'importer une fonction dédiée
import FestivalCard from "../components/FestivalCard";
import EditFestivalModal from "../modal/EditFestivalModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [festivals, setFestivals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);

  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);

  const triggerToast = (message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
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

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans antialiased overflow-x-hidden relative flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Light Ambient Decorative Gradient Orbs (matches Aura's login look) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-200/30 blur-[100px] animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-200/20 blur-[120px]"
          style={{ animationDuration: "15s", animationDelay: "2s" }}
        ></div>
      </div>

      <Header user={user} />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-8 flex flex-col gap-6">
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-950 bg-clip-text text-transparent">
              Mon Agenda Festivals
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Planifiez, trackez vos tickets et visualisez vos budgets pour
              l'été 2026.
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
          <FestivalCard
            festivals={festivals}
            setShowAddModal={setShowAddModal}
            setShowEditModal={setShowEditModal}
            setSelectedFestival={setSelectedFestival}
            isLoading={isLoading}
          />
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

      {showEditModal && selectedFestival && (
        <EditFestivalModal
          festival={selectedFestival}
          setShowEditModal={setShowEditModal}
          triggerToast={triggerToast}
          setFestivals={setFestivals}
        />
      )}
    </div>
  );
}
