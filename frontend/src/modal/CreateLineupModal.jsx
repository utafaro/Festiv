import { useEffect, useState } from "react";
import { X, RefreshCw, Sparkles } from "lucide-react";
import { listFestivals } from "../api/festival";
import { createLineup } from "../api/lineup";

export default function CreateLineupModal({
  defaultFestivalId,
  defaultFestivalLabel,
  onClose,
  onCreated,
  triggerToast,
}) {
  const [festivals, setFestivals] = useState([]);
  const [loadingFestivals, setLoadingFestivals] = useState(!defaultFestivalId);
  const [festivalId, setFestivalId] = useState(defaultFestivalId || "");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultFestivalId) return;
    let active = true;
    listFestivals()
      .then((data) => {
        if (active) setFestivals(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) triggerToast("Impossible de charger la liste des festivals.", "error");
      })
      .finally(() => {
        if (active) setLoadingFestivals(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFestivalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!festivalId) {
      triggerToast("Merci de sélectionner un festival.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const lineup = await createLineup(festivalId, name.trim());
      triggerToast("Lineup créée avec succès !", "success");
      onCreated(lineup);
    } catch (err) {
      triggerToast(
        err.response?.data?.detail || "Erreur lors de la création de la lineup.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative max-h-[90dvh] overflow-y-auto scrollbar-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">
            Nouvelle Lineup
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Créez votre programmation personnelle pour un festival, à partager avec qui vous voulez.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-500 font-bold">Festival * :</label>
            {defaultFestivalId ? (
              <div className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-slate-700 font-semibold">
                {defaultFestivalLabel}
              </div>
            ) : (
              <select
                required
                value={festivalId}
                onChange={(e) => setFestivalId(e.target.value)}
                disabled={loadingFestivals}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">
                  {loadingFestivals ? "Chargement..." : "Sélectionner un festival"}
                </option>
                {festivals.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.location}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold">Nom de la lineup (optionnel) :</label>
            <input
              type="text"
              placeholder="ex: Ma programmation weekend"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r cursor-pointer from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider shadow-md shadow-indigo-500/10 active:scale-[0.98] transform flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Création...</span>
              </>
            ) : (
              <span>Créer la lineup</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
