import { useEffect, useState } from "react";
import { X, RefreshCw, Radar, Check } from "lucide-react";
import { listFestivals } from "../api/festival";
import { listMyLineups, listSharedLineups } from "../api/lineup";
import { createSuivi } from "../api/suivi";

export default function CreateSuiviModal({ onClose, onCreated, triggerToast }) {
  const [festivals, setFestivals] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [festivalId, setFestivalId] = useState("");
  const [lineupIds, setLineupIds] = useState([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listFestivals(), listMyLineups(), listSharedLineups()])
      .then(([festivalsData, mine, shared]) => {
        if (!active) return;
        setFestivals(Array.isArray(festivalsData) ? festivalsData : []);
        setLineups([...(mine || []), ...(shared || [])]);
      })
      .catch(() => {
        if (active) triggerToast("Impossible de charger vos lineups.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableLineups = lineups.filter((l) => l.festival_id === festivalId);

  const toggleLineup = (id) => {
    setLineupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleFestivalChange = (value) => {
    setFestivalId(value);
    setLineupIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!festivalId) {
      triggerToast("Merci de sélectionner un festival.", "warning");
      return;
    }
    if (lineupIds.length === 0) {
      triggerToast("Merci de sélectionner au moins une lineup.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const suivi = await createSuivi(festivalId, lineupIds, name.trim());
      triggerToast("Suivi créé avec succès !", "success");
      onCreated(suivi);
    } catch (err) {
      triggerToast(
        err.response?.data?.detail || "Erreur lors de la création du suivi.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mx-auto mb-3">
            <Radar className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">Nouveau Suivi</h3>
          <p className="text-xs text-slate-500 mt-1">
            Repérez-vous en direct avec vos amis pendant le festival.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold">Festival * :</label>
              <select
                required
                value={festivalId}
                onChange={(e) => handleFestivalChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Sélectionner un festival</option>
                {festivals.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.location}
                  </option>
                ))}
              </select>
            </div>

            {festivalId && (
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">
                  Lineup(s) à suivre * :
                </label>
                {availableLineups.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    Aucune lineup disponible pour ce festival. Créez-en une
                    d'abord depuis l'onglet Lineup & Planning.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-none">
                    {availableLineups.map((l) => {
                      const selected = lineupIds.includes(l.id);
                      return (
                        <button
                          type="button"
                          key={l.id}
                          onClick={() => toggleLineup(l.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition ${
                            selected
                              ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                          }`}
                        >
                          <span className="font-semibold truncate">
                            {l.name || "Lineup sans nom"}
                          </span>
                          {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-slate-500 font-bold">Nom du suivi (optionnel) :</label>
              <input
                type="text"
                placeholder="ex: Notre weekend"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r cursor-pointer from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider shadow-md shadow-fuchsia-500/10 active:scale-[0.98] transform flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <span>Créer le suivi</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
