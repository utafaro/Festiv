import { X } from "lucide-react";
import { useState } from "react";

export default function AddFestivalModal({
    setShowAddModal,
    triggerToast,
    setFestivals
}){
 const [newFest, setNewFest] = useState({ name: '', location: '', dates: '', ticketStatus: 'wishlist' });
    // Handle addition of custom Festival
  const handleAddFestival = (e) => {
        e.preventDefault();
        if (!newFest.name || !newFest.dates) {
        triggerToast("Veuillez remplir au moins le nom et les dates.", "warning");
        return;
        }
        const created = {
        id: `f-${Date.now()}`,
        name: newFest.name,
        location: newFest.location || 'Inconnu',
        dates: newFest.dates,
        coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600',
        ticketStatus: newFest.ticketStatus,
        statusLabel: newFest.ticketStatus === 'bought' ? 'Ticket Acheté' : newFest.ticketStatus === 'waiting' ? 'Sur Liste d\'attente' : 'Recherche revente',
        budget: {
            ticket: { est: 150, act: 0 },
            transport: { est: 100, act: 0 },
            camping: { est: 50, act: 0 },
            merch: { est: 30, act: 0 }
        },
        stages: ['Stage 1', 'Stage 2']
        };
        setFestivals(prev => [...prev, created]);
        setShowAddModal(false);
        setNewFest({ name: '', location: '', dates: '', ticketStatus: 'wishlist' });
        triggerToast(`${created.name} ajouté à votre tableau de bord !`, "success");
    };
    return(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
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

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Lieu / Destination :</label>
                <input 
                  type="text" 
                  placeholder="ex: Paris, France" 
                  value={newFest.location}
                  onChange={(e) => setNewFest({ ...newFest, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Dates de l'événement * :</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: 31 Mai - 02 Juin 2026" 
                  value={newFest.dates}
                  onChange={(e) => setNewFest({ ...newFest, dates: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">État de votre Ticket :</label>
                <select 
                  value={newFest.ticketStatus}
                  onChange={(e) => setNewFest({ ...newFest, ticketStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-indigo-600 font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="bought">Ticket Acheté</option>
                  <option value="waiting">Sur liste d'attente</option>
                  <option value="resale">En recherche / Revente</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all text-xs"
              >
                Créer l'événement
              </button>

            </form>
          </div>
        </div>
    )
}