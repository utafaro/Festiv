import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Radar, MapPin, Check, X, Loader2, Users, Crown } from "lucide-react";
import { listFestivals } from "../../api/festival";
import {
  listMySuivis,
  listSharedSuivis,
  listSuiviInvitations,
  acceptSuiviInvitation,
  deleteSuiviInvitation,
} from "../../api/suivi";
import CreateSuiviModal from "../../modal/CreateSuiviModal";
import ToastNotifications from "../ToastNotifications";

export default function SuiviPlanningSection() {
  const navigate = useNavigate();
  const [mySuivis, setMySuivis] = useState([]);
  const [sharedSuivis, setSharedSuivis] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [festivalsById, setFestivalsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
          listMySuivis(),
          listSharedSuivis(),
          listSuiviInvitations(),
          listFestivals(),
        ]);
        if (!active) return;
        setMySuivis(mine);
        setSharedSuivis(shared);
        setInvitations(invites);
        const map = {};
        (festivals || []).forEach((f) => {
          map[f.id] = f;
        });
        setFestivalsById(map);
      } catch {
        if (active) triggerToast("Impossible de charger vos suivis.", "error");
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
      await acceptSuiviInvitation(invitation.id);
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
      await deleteSuiviInvitation(invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      triggerToast("Invitation refusée.", "info");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const SuiviCard = ({ suivi, shared }) => {
    const festival = festivalsById[suivi.festival_id];
    return (
      <div
        onClick={() => navigate(`/suivis/${suivi.id}`)}
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-fuchsia-50 text-fuchsia-600 rounded-lg text-[9px] font-bold uppercase">
            <Radar className="w-3 h-3" /> Live
          </span>
        </div>
        <h3 className="text-base font-extrabold text-slate-800 group-hover:text-fuchsia-600 transition-colors line-clamp-1">
          {suivi.name || festival?.name || "Mon Suivi"}
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-fuchsia-950 bg-clip-text text-transparent">
            Amis & Live
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Repérez-vous en temps réel avec vos amis pendant le festival.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-fuchsia-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Suivi</span>
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
                          {inv.suivi_name || festival?.name || "Un suivi"}
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
              Mes Suivis
            </h2>
            {mySuivis.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-md border border-slate-200/80 rounded-3xl p-10 text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mx-auto mb-4">
                  <Radar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Aucun suivi pour l'instant
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                  Choisissez un festival et une (ou plusieurs) lineup pour vous
                  repérer en direct avec vos amis.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Créer mon premier suivi
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySuivis.map((s) => (
                  <SuiviCard key={s.id} suivi={s} shared={false} />
                ))}
              </div>
            )}
          </div>

          {sharedSuivis.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Partagé avec moi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedSuivis.map((s) => (
                  <SuiviCard key={s.id} suivi={s} shared={true} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateSuiviModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(suivi) => {
            setShowCreateModal(false);
            navigate(`/suivis/${suivi.id}`);
          }}
          triggerToast={triggerToast}
        />
      )}

      <ToastNotifications toasts={toasts} />
    </div>
  );
}
