import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Sparkles,
  MapPin,
  Check,
  X,
  Loader2,
  Users,
  Crown,
  Pencil,
  Trash2,
} from "lucide-react";
import { listFestivals } from "../../api/festival";
import {
  listMyLineups,
  listSharedLineups,
  listInvitations,
  acceptInvitation,
  deleteInvitation,
  deleteLineup,
} from "../../api/lineup";
import CreateLineupModal from "../../modal/CreateLineupModal";
import RenameLineupModal from "../../modal/RenameLineupModal";
import ToastNotifications from "../ToastNotifications";

export default function LineupPlanningSection() {
  const navigate = useNavigate();
  const [myLineups, setMyLineups] = useState([]);
  const [sharedLineups, setSharedLineups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [festivalsById, setFestivalsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renamingLineup, setRenamingLineup] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [toasts, setToasts] = useState([]);
  const triggerToast = (message, type = "info") => {
    const tid = Date.now().toString();
    setToasts((prev) => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== tid)), 4000);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [mine, shared, invites, festivals] = await Promise.all([
          listMyLineups(),
          listSharedLineups(),
          listInvitations(),
          listFestivals(),
        ]);
        if (!active) return;
        setMyLineups(mine);
        setSharedLineups(shared);
        setInvitations(invites);
        const map = {};
        (festivals || []).forEach((f) => {
          map[f.id] = f;
        });
        setFestivalsById(map);
      } catch {
        if (active) triggerToast("Impossible de charger vos lineups.", "error");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleAccept = async (invitation) => {
    setRespondingId(invitation.id);
    try {
      await acceptInvitation(invitation.id);
      triggerToast("Invitation acceptée !", "success");
      setReloadKey((k) => k + 1);
    } catch {
      triggerToast("Erreur lors de l'acceptation.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (invitation) => {
    setRespondingId(invitation.id);
    try {
      await deleteInvitation(invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      triggerToast("Invitation refusée.", "info");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeleteLineup = async (lineup) => {
    if (
      !window.confirm(
        `Supprimer la lineup "${lineup.name || "sans nom"}" ? Cette action est irréversible.`,
      )
    )
      return;
    setDeletingId(lineup.id);
    try {
      await deleteLineup(lineup.id);
      setMyLineups((prev) => prev.filter((l) => l.id !== lineup.id));
      triggerToast("Lineup supprimée.", "success");
    } catch (err) {
      triggerToast(
        err.response?.data?.detail || "Erreur lors de la suppression de la lineup.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const LineupCard = ({ lineup, shared }) => {
    const festival = festivalsById[lineup.festival_id];
    return (
      <div
        onClick={() => navigate(`/lineups/${lineup.id}`)}
        className="group cursor-pointer bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300/40 transition-all duration-300 p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
              shared
                ? "bg-slate-100 text-slate-600"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {shared ? <Users className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
            {shared ? "Partagé avec moi" : "Propriétaire"}
          </span>
          {!shared && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingLineup(lineup);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                title="Renommer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteLineup(lineup);
                }}
                disabled={deletingId === lineup.id}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-50"
                title="Supprimer"
              >
                {deletingId === lineup.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
        <h3 className="text-base font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {lineup.name || festival?.name || "Ma Lineup"}
        </h3>
        {festival && (
          <div className="flex items-center space-x-1.5 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold truncate">
              {festival.name} — {festival.location}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-950 bg-clip-text text-transparent">
            Lineup & Planning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Créez votre programmation pour chaque festival et partagez-la avec vos amis.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Lineup</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          {invitations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Invitations en attente
              </h2>
              <div className="space-y-2">
                {invitations.map((inv) => {
                  const festival = festivalsById[inv.festival_id];
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-3 p-4 bg-white border border-amber-200/60 rounded-2xl shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {inv.lineup_name || festival?.name || "Une lineup"}
                        </p>
                        {festival && (
                          <p className="text-xs text-slate-500 truncate">
                            {festival.name} — {festival.location}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(inv)}
                          disabled={respondingId === inv.id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Accepter
                        </button>
                        <button
                          onClick={() => handleDecline(inv)}
                          disabled={respondingId === inv.id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-bold disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Refuser
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mes Lineups
            </h2>
            {myLineups.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-md border border-slate-200/80 rounded-3xl p-10 text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Aucune lineup pour l'instant
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                  Choisissez un festival et créez votre programmation personnelle.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Créer ma première lineup
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myLineups.map((l) => (
                  <LineupCard key={l.id} lineup={l} shared={false} />
                ))}
              </div>
            )}
          </div>

          {sharedLineups.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Partagé avec moi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedLineups.map((l) => (
                  <LineupCard key={l.id} lineup={l} shared={true} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateLineupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(lineup) => {
            setShowCreateModal(false);
            navigate(`/lineups/${lineup.id}`);
          }}
          triggerToast={triggerToast}
        />
      )}

      {renamingLineup && (
        <RenameLineupModal
          lineup={renamingLineup}
          onClose={() => setRenamingLineup(null)}
          onSaved={(updated) => {
            setMyLineups((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l)),
            );
            setRenamingLineup(null);
          }}
          triggerToast={triggerToast}
        />
      )}

      <ToastNotifications toasts={toasts} />
    </div>
  );
}
