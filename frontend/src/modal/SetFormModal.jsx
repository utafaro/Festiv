import { useState } from "react";
import { X, Plus, RefreshCw, Layers, Music } from "lucide-react";
import { createStage, createSet, updateSet } from "../api/lineup";
import { createArtist } from "../api/artist";

const toDate = (iso) => (iso ? iso.slice(0, 10) : "");
const toTime = (iso) => (iso ? iso.slice(11, 16) : "");

export default function SetFormModal({
  lineupId,
  stages,
  setStages,
  artists,
  setArtists,
  initialSet,
  onClose,
  onSaved,
  triggerToast,
}) {
  const [form, setForm] = useState(
    initialSet
      ? {
          name: initialSet.name || "",
          date: toDate(initialSet.date),
          start_time: toTime(initialSet.start_time),
          end_time: toTime(initialSet.end_time),
          stage_id: initialSet.stage.id,
          artist_ids: initialSet.artists.map((a) => a.id),
        }
      : {
          name: "",
          date: "",
          start_time: "",
          end_time: "",
          stage_id: "",
          artist_ids: [],
        },
  );

  const [addingStage, setAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [creatingStage, setCreatingStage] = useState(false);

  const [artistQuery, setArtistQuery] = useState("");
  const [creatingArtist, setCreatingArtist] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const selectedArtists = form.artist_ids
    .map((id) => artists.find((a) => a.id === id))
    .filter(Boolean);

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(artistQuery.trim().toLowerCase()) &&
      !form.artist_ids.includes(a.id),
  );

  const toggleArtist = (id) => {
    setForm((prev) => ({
      ...prev,
      artist_ids: prev.artist_ids.includes(id)
        ? prev.artist_ids.filter((x) => x !== id)
        : [...prev.artist_ids, id],
    }));
  };

  const handleCreateStage = async () => {
    const name = newStageName.trim();
    if (!name) return;
    setCreatingStage(true);
    try {
      const stage = await createStage(lineupId, name);
      setStages((prev) =>
        prev.some((s) => s.id === stage.id) ? prev : [...prev, stage],
      );
      setForm((prev) => ({ ...prev, stage_id: stage.id }));
      setNewStageName("");
      setAddingStage(false);
    } catch {
      triggerToast("Erreur lors de la création de la scène.", "error");
    } finally {
      setCreatingStage(false);
    }
  };

  const handleCreateArtist = async () => {
    const name = artistQuery.trim();
    if (!name) return;
    setCreatingArtist(true);
    try {
      const artist = await createArtist({ name, genres: [] });
      setArtists((prev) => [...prev, artist]);
      setForm((prev) => ({
        ...prev,
        artist_ids: [...prev.artist_ids, artist.id],
      }));
      setArtistQuery("");
    } catch (err) {
      triggerToast(
        err.response?.data?.detail || "Erreur lors de la création de l'artiste.",
        "error",
      );
    } finally {
      setCreatingArtist(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.start_time || !form.end_time || !form.stage_id) {
      triggerToast(
        "Merci de renseigner la date, les horaires et la scène.",
        "warning",
      );
      return;
    }
    if (form.end_time <= form.start_time) {
      triggerToast("L'heure de fin doit être après l'heure de début.", "warning");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim() || null,
      artist_ids: form.artist_ids,
      stage_id: form.stage_id,
      start_time: `${form.date}T${form.start_time}:00`,
      end_time: `${form.date}T${form.end_time}:00`,
      date: `${form.date}T00:00:00`,
    };

    try {
      const saved = initialSet
        ? await updateSet(lineupId, initialSet.id, payload)
        : await createSet(lineupId, payload);
      onSaved(saved);
      triggerToast(
        initialSet ? "Set modifié avec succès." : "Set ajouté au line-up.",
        "success",
      );
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      triggerToast(
        Array.isArray(detail) ? detail[0]?.msg : detail || "Erreur lors de l'enregistrement du set.",
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
          <h3 className="text-xl font-extrabold text-slate-800">
            {initialSet ? "Modifier le set" : "Ajouter un set"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Date, horaires et scène du passage. Les scènes créées sont réutilisables pour tout le line-up.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-500 font-bold">
              Nom du set (optionnel) :
            </label>
            <input
              type="text"
              placeholder="ex: Closing Set"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold">Date * :</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-bold">Heure début * :</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-bold">Heure fin * :</label>
              <input
                type="time"
                required
                value={form.end_time}
                onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Scène / Lieu * :</span>
            </label>
            <select
              required
              value={form.stage_id}
              onChange={(e) => setForm((prev) => ({ ...prev, stage_id: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Sélectionner une scène</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {addingStage ? (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nom de la nouvelle scène"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateStage();
                    }
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  disabled={creatingStage}
                  onClick={handleCreateStage}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {creatingStage ? <RefreshCw className="w-4 h-4 animate-spin" /> : "OK"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingStage(false);
                    setNewStageName("");
                  }}
                  className="px-3 py-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingStage(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" /> Nouvelle scène
              </button>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold flex items-center space-x-1.5">
              <Music className="w-3.5 h-3.5 text-indigo-500" />
              <span>Artistes :</span>
            </label>

            {selectedArtists.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedArtists.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-[10px]"
                  >
                    {a.name}
                    <button
                      type="button"
                      onClick={() => toggleArtist(a.id)}
                      className="hover:text-indigo-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="Rechercher ou créer un artiste"
              value={artistQuery}
              onChange={(e) => setArtistQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
            />

            {artistQuery.trim() && (
              <ul className="mt-2 border border-slate-200/85 rounded-2xl shadow-sm max-h-40 overflow-y-auto scrollbar-none">
                {filteredArtists.map((a) => (
                  <li
                    key={a.id}
                    onClick={() => {
                      toggleArtist(a.id);
                      setArtistQuery("");
                    }}
                    className="px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer font-semibold"
                  >
                    {a.name}
                  </li>
                ))}
                <li
                  onClick={handleCreateArtist}
                  className="px-3.5 py-2.5 text-indigo-600 hover:bg-indigo-50 cursor-pointer font-bold flex items-center gap-1.5"
                >
                  {creatingArtist ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Créer l'artiste "{artistQuery.trim()}"
                </li>
              </ul>
            )}
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
              <span>{initialSet ? "Enregistrer les modifications" : "Ajouter au line-up"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
