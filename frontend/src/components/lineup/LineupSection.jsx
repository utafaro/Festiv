import { useEffect, useState } from "react";
import { Radio, Plus, Pencil, Trash2, Share2, Check, Loader2 } from "lucide-react";
import { listStages, listSets, deleteSet } from "../../api/lineup";
import { listArtists } from "../../api/artist";
import SetFormModal from "../../modal/SetFormModal";
import ToastNotifications from "../ToastNotifications";

export default function LineupSection({ lineupId, readOnly = false }) {
  const [stages, setStages] = useState([]);
  const [artists, setArtists] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);

  const triggerToast = (message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [stagesData, setsData, artistsData] = await Promise.all([
          listStages(lineupId),
          listSets(lineupId),
          listArtists(),
        ]);
        if (!active) return;
        setStages(stagesData);
        setSets(sortSets(setsData));
        setArtists(artistsData);
      } catch {
        if (active) triggerToast("Impossible de charger le line-up.", "error");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [lineupId]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      triggerToast("Impossible de copier le lien.", "error");
    }
  };

  const sortSets = (list) =>
    [...list].sort((a, b) => {
      if (a.date !== b.date) {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      }
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });

  const isSetFinished = (s) => {
    const end = s.end_time || s.date;
    if (!end) return false;
    return new Date(end).getTime() < Date.now();
  };

  const handleSaved = (saved) => {
    setSets((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      const next = exists
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [...prev, saved];
      return sortSets(next);
    });
  };

  const handleDelete = async (setId) => {
    if (!window.confirm("Supprimer ce set du line-up ?")) return;
    setDeletingId(setId);
    try {
      await deleteSet(lineupId, setId);
      setSets((prev) => prev.filter((s) => s.id !== setId));
      triggerToast("Set supprimé.", "success");
    } catch {
      triggerToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const UNSCHEDULED_KEY = "sans-date";

  const formatDay = (dateStr) =>
    dateStr === UNSCHEDULED_KEY
      ? "Sans date"
      : new Date(dateStr).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

  const groups = sets.reduce((acc, s) => {
    const key = s.date ? s.date.slice(0, 10) : UNSCHEDULED_KEY;
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const orderedDates = Object.keys(groups)
    .filter((k) => k !== UNSCHEDULED_KEY)
    .sort();
  if (groups[UNSCHEDULED_KEY]) orderedDates.push(UNSCHEDULED_KEY);

  return (
    <>
      <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
            <Radio className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Line-up & Programmation
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100/80 border border-slate-200/60 rounded-xl text-slate-600 hover:bg-white hover:text-indigo-600 transition text-[11px] font-bold"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Lien copié !" : "Partager"}</span>
          </button>
          {!readOnly && (
            <button
              onClick={() => {
                setEditingSet(null);
                setShowModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un set</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : orderedDates.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          {readOnly
            ? "Aucun set programmé pour l'instant."
            : "Aucun set programmé pour l'instant. Ajoutez le premier set du line-up."}
        </div>
      ) : (
        <div className="space-y-6">
          {orderedDates.map((dateKey) => (
            <div key={dateKey}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 capitalize">
                {formatDay(dateKey)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups[dateKey].map((s) => (
                  <div
                    key={s.id}
                    className={`group p-4 bg-slate-100/60 border border-slate-200/40 rounded-2xl hover:bg-white hover:border-indigo-100 transition shadow-sm hover:shadow-md ${
                      isSetFinished(s) ? "opacity-50 grayscale" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">
                          {s.name ||
                            (s.artists.length
                              ? s.artists.map((a) => a.name).join(" B2B ")
                              : "Set")}
                        </h4>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500">
                          {s.stage && (
                            <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                              {s.stage.name}
                            </span>
                          )}
                          {s.stage && s.start_time && s.end_time && <span>•</span>}
                          {s.start_time && s.end_time && (
                            <span>
                              {s.start_time.slice(11, 16)} - {s.end_time.slice(11, 16)}
                            </span>
                          )}
                          {!s.stage && !s.start_time && (
                            <span className="italic text-slate-400">
                              Horaires et scène à définir
                            </span>
                          )}
                        </div>
                        {s.name && s.artists.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {s.artists.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-[10px] uppercase tracking-wide"
                              >
                                {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {!readOnly && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => {
                              setEditingSet(s);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-50"
                          >
                            {deletingId === s.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {showModal && !readOnly && (
        <SetFormModal
          lineupId={lineupId}
          stages={stages}
          setStages={setStages}
          artists={artists}
          setArtists={setArtists}
          initialSet={editingSet}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
          triggerToast={triggerToast}
        />
      )}

      <ToastNotifications toasts={toasts} />
    </>
  );
}
