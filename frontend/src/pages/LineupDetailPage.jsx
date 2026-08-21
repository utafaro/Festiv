import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Loader2,
  UserPlus,
  Trash2,
  Check,
  X,
  LogOut,
  Crown,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { getFestivalById } from "../api/festival";
import {
  getLineup,
  listMembers,
  inviteMember,
  listInvitations,
  acceptInvitation,
  deleteInvitation,
} from "../api/lineup";
import LineupSection from "../components/lineup/LineupSection";
import ToastNotifications from "../components/ToastNotifications";

export default function LineupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lineup, setLineup] = useState(null);
  const [festival, setFestival] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [toasts, setToasts] = useState([]);
  const triggerToast = (message, type = "info") => {
    const tid = Date.now().toString();
    setToasts((prev) => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== tid)), 4000);
  };

  const isOwner = lineup && user && lineup.owner_id === user.id;
  const canEdit =
    isOwner ||
    (user && members.some((m) => m.user_id === user.id && m.status === "accepted"));

  useEffect(() => {
    if (!id || !user) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const lineupData = await getLineup(id);
        if (!active) return;
        setLineup(lineupData);

        const festivalData = await getFestivalById(lineupData.festival_id);
        if (!active) return;
        setFestival(festivalData);

        if (lineupData.owner_id === user.id) {
          const membersData = await listMembers(id);
          if (!active) return;
          setMembers(membersData);
          setPendingInvite(null);
        } else {
          const invitations = await listInvitations();
          const mine = invitations.find((inv) => inv.lineup_id === id);
          if (!active) return;
          if (mine) {
            setPendingInvite(mine);
            setMembers([]);
          } else {
            setPendingInvite(null);
            const membersData = await listMembers(id);
            if (!active) return;
            setMembers(membersData);
          }
        }
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 403 || err.response?.status === 404) {
          setNotFound(true);
        } else {
          triggerToast("Impossible de charger cette lineup.", "error");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, user, reloadKey]);

  const handleAccept = async () => {
    setResponding(true);
    try {
      await acceptInvitation(pendingInvite.id);
      triggerToast("Invitation acceptée !", "success");
      setReloadKey((k) => k + 1);
    } catch {
      triggerToast("Erreur lors de l'acceptation.", "error");
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      await deleteInvitation(pendingInvite.id);
      triggerToast("Invitation refusée.", "info");
      navigate("/lineups");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
      setResponding(false);
    }
  };

  const handleLeave = async () => {
    const myMembership = members.find((m) => m.user_id === user.id);
    if (!myMembership) return;
    if (!window.confirm("Quitter cette lineup ?")) return;
    try {
      await deleteInvitation(myMembership.id);
      triggerToast("Vous avez quitté la lineup.", "info");
      navigate("/lineups");
    } catch {
      triggerToast("Erreur lors de la sortie de la lineup.", "error");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const member = await inviteMember(id, inviteEmail.trim());
      setMembers((prev) => [...prev, member]);
      setInviteEmail("");
      triggerToast(`Invitation envoyée à ${member.email}.`, "success");
    } catch (err) {
      triggerToast(
        err.response?.data?.detail || "Erreur lors de l'invitation.",
        "error",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Retirer cette personne de la lineup ?")) return;
    setRemovingId(memberId);
    try {
      await deleteInvitation(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      triggerToast("Accès retiré.", "success");
    } catch {
      triggerToast("Erreur lors de la suppression.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 py-24">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Chargement de la lineup...</p>
      </div>
    );
  }

  if (notFound || !lineup) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 px-4 py-24 text-center">
        <p className="text-slate-700 font-semibold text-lg mb-4">
          Cette lineup est introuvable ou vous n'y avez pas accès.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-50 overflow-x-hidden pb-12 font-sans antialiased">
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse pointer-events-none"
        style={{ animationDuration: "12s" }}
      />

      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/lineups")}
            className="group inline-flex items-center space-x-2 text-slate-600 hover:text-indigo-600 text-sm font-medium transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Mes Lineups</span>
          </button>
          {festival && (
            <Link
              to={`/festival/${festival.id}`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Voir la page du festival
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 mt-8 relative space-y-8">
        <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            {isOwner && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase">
                <Crown className="w-3 h-3" /> Propriétaire
              </span>
            )}
            {!isOwner && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                Partagé avec vous
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {lineup.name || festival?.name || "Ma Lineup"}
          </h1>
          {festival && (
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {festival.name} — {festival.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Du {formatDate(festival.start_date)} au {formatDate(festival.end_date)}
              </span>
            </div>
          )}
        </div>

        {pendingInvite ? (
          <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <p className="text-sm text-slate-700 font-semibold">
              Vous avez été invité à consulter cette lineup.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleAccept}
                disabled={responding}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Accepter
              </button>
              <button
                onClick={handleDecline}
                disabled={responding}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Refuser
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <LineupSection lineupId={id} readOnly={!canEdit} />
            </div>

            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Membres</span>
                </h2>

                {isOwner && (
                  <form onSubmit={handleInvite} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="email@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={inviting}
                      className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Inviter"}
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {members.length === 0 ? (
                    <p className="text-xs text-slate-400">Aucun membre invité pour l'instant.</p>
                  ) : (
                    members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 bg-slate-100/60 rounded-xl"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {m.full_name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{m.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                              m.status === "accepted"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {m.status === "accepted" ? "Accepté" : "En attente"}
                          </span>
                          {isOwner && (
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              disabled={removingId === m.id}
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-50"
                              title="Retirer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {!isOwner && (
                  <button
                    onClick={handleLeave}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl text-xs font-bold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Quitter la lineup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastNotifications toasts={toasts} />
    </div>
  );
}
