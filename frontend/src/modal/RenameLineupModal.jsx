import { useState } from "react";
import { X, RefreshCw, Pencil } from "lucide-react";
import { updateLineup } from "../api/lineup";

export default function RenameLineupModal({ lineup, onClose, onSaved, triggerToast }) {
  const [name, setName] = useState(lineup.name || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateLineup(lineup.id, name.trim());
      triggerToast("Lineup renommée.", "success");
      onSaved(updated);
    } catch (err) {
      triggerToast(
        err.response?.data?.detail || "Erreur lors du renommage de la lineup.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-sm shadow-2xl relative max-h-[90dvh] overflow-y-auto scrollbar-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Pencil className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">Renommer la lineup</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-500 font-bold">Nom de la lineup :</label>
            <input
              type="text"
              autoFocus
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
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>Enregistrer</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
