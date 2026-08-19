import { useState } from "react";
import { X, RefreshCw, MapPin, Music, Plus, Users } from "lucide-react";
import { setPosition, createSpot } from "../api/suivi";

export default function PositionFormModal({
  suiviId,
  sets,
  spots,
  setSpots,
  otherPositions,
  initialPosition,
  onClose,
  onSaved,
  triggerToast,
}) {
  const [mode, setMode] = useState(initialPosition?.target_type || "set");
  const [setId, setSetId] = useState(initialPosition?.set_id || "");
  const [customSpotId, setCustomSpotId] = useState(initialPosition?.custom_spot_id || "");
  const [newSpotLabel, setNewSpotLabel] = useState("");
  const [creatingSpot, setCreatingSpot] = useState(false);
  const [note, setNote] = useState(initialPosition?.note || "");
  const [groupedWith, setGroupedWith] = useState(initialPosition?.grouped_with || []);
  const [submitting, setSubmitting] = useState(false);

  const toggleGrouped = (userId) => {
    setGroupedWith((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId],
    );
  };

  const handleCreateSpot = async () => {
    const label = newSpotLabel.trim();
    if (!label) return;
    setCreatingSpot(true);
    try {
      const spot = await createSpot(suiviId, label);
      setSpots((prev) => (prev.some((s) => s.id === spot.id) ? prev : [...prev, spot]));
      setCustomSpotId(spot.id);
      setNewSpotLabel("");
    } catch {
      triggerToast("Erreur lors de la création du lieu personnalisé.", "error");
    } finally {
      setCreatingSpot(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "set" && !setId) {
      triggerToast("Sélectionnez le set sur lequel vous vous trouvez.", "warning");
      return;
    }
    if (mode === "custom" && !customSpotId) {
      triggerToast("Sélectionnez ou créez un lieu personnalisé.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        target_type: mode,
        set_id: mode === "set" ? setId : null,
        custom_spot_id: mode === "custom" ? customSpotId : null,
        note: note.trim() || null,
        grouped_with: groupedWith,
      };
      const saved = await setPosition(suiviId, payload);
      onSaved(saved);
      triggerToast("Position mise à jour !", "success");
      onClose();
    } catch (err) {
      triggerToast(
        err.response?.data?.detail || "Erreur lors de la mise à jour de votre position.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-extrabold text-slate-800">Où êtes-vous ?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Indiquez votre position pour que vos amis vous retrouvent.
          </p>
        </div>

        <div className="flex gap-2 mb-5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("set")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
              mode === "set" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
            }`}
          >
            Sur un set
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
              mode === "custom" ? "bg-white text-fuchsia-600 shadow-sm" : "text-slate-500"
            }`}
          >
            Ailleurs
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "set" ? (
            <div className="space-y-1">
              <label className="text-slate-500 font-bold flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-500" /> Set * :
              </label>
              {sets.length === 0 ? (
                <p className="text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  Aucun set programmé dans les lineups de ce suivi.
                </p>
              ) : (
                <select
                  value={setId}
                  onChange={(e) => setSetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Sélectionner un set</option>
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.artists.map((a) => a.name).join(" B2B ") || "Set"} —{" "}
                      {s.stage.name} — {s.start_time.slice(11, 16)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-slate-500 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-fuchsia-500" /> Lieu personnalisé * :
              </label>
              {spots.length > 0 && (
                <select
                  value={customSpotId}
                  onChange={(e) => setCustomSpotId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="">Sélectionner un lieu existant</option>
                  {spots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="ex: Devant les foodtrucks"
                  value={newSpotLabel}
                  onChange={(e) => setNewSpotLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateSpot();
                    }
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-fuchsia-500"
                />
                <button
                  type="button"
                  disabled={creatingSpot}
                  onClick={handleCreateSpot}
                  className="px-3.5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {creatingSpot ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Créer
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-slate-500 font-bold">Note (optionnel) :</label>
            <input
              type="text"
              placeholder="ex: Devant la barrière côté droit"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {otherPositions.length > 0 && (
            <div className="space-y-1">
              <label className="text-slate-500 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> Vous êtes avec :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {otherPositions.map((p) => {
                  const selected = groupedWith.includes(p.user_id);
                  return (
                    <button
                      type="button"
                      key={p.user_id}
                      onClick={() => toggleGrouped(p.user_id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                        selected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {p.full_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r cursor-pointer from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider shadow-md shadow-fuchsia-500/10 active:scale-[0.98] transform flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>Valider ma position</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
