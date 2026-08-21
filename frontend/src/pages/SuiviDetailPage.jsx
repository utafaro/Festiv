import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  UserPlus,
  Trash2,
  Check,
  X,
  LogOut,
  Crown,
  Radar,
  Navigation,
  Users,
  Compass,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { getFestivalById } from "../api/festival";
import {
  getSuivi,
  listSuiviMembers,
  inviteSuiviMember,
  listSuiviInvitations,
  acceptSuiviInvitation,
  deleteSuiviInvitation,
  listSuiviSets,
  listPositions,
  clearPosition,
  clearGeo,
} from "../api/suivi";
import { useSuiviSocket } from "../hooks/useSuiviSocket";
import PositionFormModal from "../modal/PositionFormModal";
import GeoPingModal from "../modal/GeoPingModal";
import CompassModal from "../modal/CompassModal";
import ToastNotifications from "../components/ToastNotifications";

function formatGeoAgo(iso) {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.round(diffMin / 60)} h`;
}

export default function SuiviDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [suivi, setSuivi] = useState(null);
  const [festival, setFestival] = useState(null);
  const [members, setMembers] = useState([]);
  const [sets, setSets] = useState([]);
  const [positions, setPositions] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [clearingPosition, setClearingPosition] = useState(false);
  const [clearingGeo, setClearingGeo] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showGeoModal, setShowGeoModal] = useState(false);
  const [compassTargetId, setCompassTargetId] = useState(null);
  const [quickTarget, setQuickTarget] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [toasts, setToasts] = useState([]);
  const triggerToast = (message, type = "info") => {
    const tid = Date.now().toString();
    setToasts((prev) => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== tid)), 4000);
  };

  const isOwner = suivi && user && suivi.owner_id === user.id;

  useEffect(() => {
    if (!id || !user) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const suiviData = await getSuivi(id);
        if (!active) return;
        setSuivi(suiviData);

        const festivalData = await getFestivalById(suiviData.festival_id);
        if (!active) return;
        setFestival(festivalData);

        if (suiviData.owner_id === user.id) {
          setPendingInvite(null);
          const [membersData, setsData, positionsData] = await Promise.all([
            listSuiviMembers(id),
            listSuiviSets(id),
            listPositions(id),
          ]);
          if (!active) return;
          setMembers(membersData);
          setSets(setsData);
          setPositions(positionsData);
        } else {
          const invitations = await listSuiviInvitations();
          const mine = invitations.find((inv) => inv.suivi_id === id);
          if (!active) return;
          if (mine) {
            setPendingInvite(mine);
          } else {
            setPendingInvite(null);
            const [membersData, setsData, positionsData] = await Promise.all([
              listSuiviMembers(id),
              listSuiviSets(id),
              listPositions(id),
            ]);
            if (!active) return;
            setMembers(membersData);
            setSets(setsData);
            setPositions(positionsData);
          }
        }
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 403 || err.response?.status === 404) {
          setNotFound(true);
        } else {
          triggerToast("Impossible de charger ce suivi.", "error");
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

  const refreshLive = async () => {
    try {
      const positionsData = await listPositions(id);
      setPositions(positionsData);
    } catch {
      // silencieux : la prochaine mise à jour socket ou le prochain reload rattrapera l'état
    }
  };

  useSuiviSocket(suivi && !pendingInvite ? id : null, refreshLive);

  const handleAccept = async () => {
    setResponding(true);
    try {
      await acceptSuiviInvitation(pendingInvite.id);
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
      await deleteSuiviInvitation(pendingInvite.id);
      triggerToast("Invitation refusée.", "info");
      navigate("/suivis");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
      setResponding(false);
    }
  };

  const handleLeave = async () => {
    const myMembership = members.find((m) => m.user_id === user.id);
    if (!myMembership) return;
    if (!window.confirm("Quitter ce suivi ?")) return;
    try {
      await deleteSuiviInvitation(myMembership.id);
      triggerToast("Vous avez quitté le suivi.", "info");
      navigate("/suivis");
    } catch {
      triggerToast("Erreur lors de la sortie du suivi.", "error");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const member = await inviteSuiviMember(id, inviteEmail.trim());
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
    if (!window.confirm("Retirer cette personne du suivi ?")) return;
    setRemovingId(memberId);
    try {
      await deleteSuiviInvitation(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      triggerToast("Accès retiré.", "success");
    } catch {
      triggerToast("Erreur lors de la suppression.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handlePositionSaved = (saved) => {
    setPositions((prev) => {
      const exists = prev.some((p) => p.user_id === saved.user_id);
      return exists
        ? prev.map((p) => (p.user_id === saved.user_id ? saved : p))
        : [...prev, saved];
    });
  };

  const handleQuickJoin = (isCustom, targetId, people) => {
    setQuickTarget({
      target_type: isCustom ? "custom" : "set",
      set_id: isCustom ? null : targetId,
      custom_label: isCustom ? targetId : null,
      note: "",
      grouped_with: people
        .filter((p) => p.user_id !== user.id)
        .map((p) => p.user_id),
    });
    setShowPositionModal(true);
  };

  const handleClearPosition = async () => {
    setClearingPosition(true);
    try {
      await clearPosition(id);
      setPositions((prev) =>
        prev
          .map((p) =>
            p.user_id === user.id
              ? { ...p, target_type: null, set_id: null, custom_label: null, note: null, grouped_with: [] }
              : p,
          )
          .filter((p) => p.user_id !== user.id || p.lat != null),
      );
      triggerToast("Position retirée.", "info");
    } catch {
      triggerToast("Erreur lors de la suppression de votre position.", "error");
    } finally {
      setClearingPosition(false);
    }
  };

  const handleClearGeo = async () => {
    setClearingGeo(true);
    try {
      await clearGeo(id);
      setPositions((prev) =>
        prev
          .map((p) => (p.user_id === user.id ? { ...p, lat: null, lng: null, geo_updated_at: null } : p))
          .filter((p) => p.user_id !== user.id || p.target_type),
      );
      triggerToast("Partage de position GPS arrêté.", "info");
    } catch {
      triggerToast("Erreur lors de l'arrêt du partage.", "error");
    } finally {
      setClearingGeo(false);
    }
  };

  const handleGeoSaved = (saved) => {
    setPositions((prev) => {
      const exists = prev.some((p) => p.user_id === saved.user_id);
      return exists
        ? prev.map((p) => (p.user_id === saved.user_id ? saved : p))
        : [...prev, saved];
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 py-24">
        <Loader2 className="w-10 h-10 text-fuchsia-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Chargement du suivi...</p>
      </div>
    );
  }

  if (notFound || !suivi) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 px-4 py-24 text-center">
        <p className="text-slate-700 font-semibold text-lg mb-4">
          Ce suivi est introuvable ou vous n'y avez pas accès.
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

  const myPosition = positions.find((p) => p.user_id === user.id && p.target_type);
  const myGeo = positions.find((p) => p.user_id === user.id && p.lat != null);
  const geoPeople = positions.filter((p) => p.lat != null);
  const compassTarget = compassTargetId ? positions.find((p) => p.user_id === compassTargetId) : null;
  const otherPositions = positions.filter((p) => p.user_id !== user.id);

  const setById = Object.fromEntries(sets.map((s) => [s.id, s]));
  const nameByUserId = Object.fromEntries(positions.map((p) => [p.user_id, p.full_name]));

  const groups = positions
    .filter((p) => p.target_type)
    .reduce((acc, p) => {
      const key =
        p.target_type === "set"
          ? `set:${p.set_id}`
          : `custom:${(p.custom_label || "").trim().toLowerCase()}`;
      (acc[key] ||= []).push(p);
      return acc;
    }, {});

  return (
    <div className="relative bg-slate-50 overflow-x-hidden pb-12 font-sans antialiased">
      <div
        className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-200/30 blur-[100px] animate-pulse pointer-events-none"
        style={{ animationDuration: "12s" }}
      />

      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/suivis")}
            className="group inline-flex items-center space-x-2 text-slate-600 hover:text-fuchsia-600 text-sm font-medium transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Amis & Live</span>
          </button>
          {festival && (
            <Link
              to={`/festival/${festival.id}`}
              className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700"
            >
              Voir la page du festival
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 mt-8 relative space-y-8">
        <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-fuchsia-50 text-fuchsia-600 rounded-lg text-[10px] font-bold uppercase">
              <Radar className="w-3 h-3" /> Suivi live
            </span>
            {isOwner ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase">
                <Crown className="w-3 h-3" /> Propriétaire
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                Partagé avec vous
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {suivi.name || festival?.name || "Notre Suivi"}
          </h1>
          {festival && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5" /> {festival.name} — {festival.location}
            </div>
          )}
        </div>

        {pendingInvite ? (
          <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <p className="text-sm text-slate-700 font-semibold">
              Vous avez été invité à rejoindre ce suivi live.
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
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Scènes actives</h2>
                  </div>

                  {myPosition ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setQuickTarget(null);
                          setShowPositionModal(true);
                        }}
                        className="px-3 py-2 bg-slate-100/80 border border-slate-200/60 rounded-xl text-slate-600 hover:bg-white hover:text-indigo-600 transition text-[11px] font-bold"
                      >
                        Modifier ma position
                      </button>
                      <button
                        onClick={handleClearPosition}
                        disabled={clearingPosition}
                        className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition text-[11px] font-bold disabled:opacity-50"
                      >
                        Je ne suis plus là
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setQuickTarget(null);
                        setShowPositionModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Indiquer ma position
                    </button>
                  )}
                </div>

                {Object.keys(groups).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    Personne ne pointe sa position pour l'instant.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(groups).map(([key, people]) => {
                      const isCustom = key.startsWith("custom:");
                      const target = isCustom ? null : setById[people[0].set_id];
                      const title = isCustom
                        ? people[0].custom_label || "Lieu personnalisé"
                        : target?.name ||
                          (target?.artists?.length
                            ? target.artists.map((a) => a.name).join(" B2B ")
                            : "Set");

                      const targetId = isCustom ? people[0].custom_label : people[0].set_id;
                      const iAmHere = people.some((p) => p.user_id === user.id);

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleQuickJoin(isCustom, targetId, people)}
                          className={`text-left p-4 rounded-2xl border shadow-sm space-y-3 cursor-pointer transition hover:shadow-md ${
                            isCustom
                              ? "bg-fuchsia-50/60 border-fuchsia-200/60 hover:border-fuchsia-300"
                              : "bg-slate-100/60 border-slate-200/40 hover:border-indigo-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
                            {isCustom ? (
                              <span className="shrink-0 px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 rounded-md text-[9px] font-bold uppercase">
                                Lieu perso
                              </span>
                            ) : (
                              target && (target.stage || target.start_time) && (
                                <span className="shrink-0 bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium">
                                  {[
                                    target.stage?.name,
                                    target.start_time?.slice(11, 16),
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </span>
                              )
                            )}
                          </div>

                          <div className="space-y-2">
                            {people.map((p) => (
                              <div key={p.user_id} className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {p.full_name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate">
                                    {p.full_name}
                                    {p.grouped_with?.length > 0 && (
                                      <span className="text-slate-400 font-normal">
                                        {" "}
                                        avec{" "}
                                        {p.grouped_with
                                          .map((uid) => nameByUserId[uid] || "quelqu'un")
                                          .join(", ")}
                                      </span>
                                    )}
                                  </p>
                                  {p.note && (
                                    <p className="text-[11px] text-slate-500 truncate">{p.note}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <p className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-600/80">
                            {iAmHere ? "Modifier ma position ici" : "Cliquer pour me placer ici"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Localisation live</h2>
                  </div>

                  {myGeo ? (
                    <button
                      onClick={handleClearGeo}
                      disabled={clearingGeo}
                      className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition text-[11px] font-bold disabled:opacity-50"
                    >
                      Arrêter le partage
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowGeoModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Partager ma position
                    </button>
                  )}
                </div>

                {geoPeople.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    Personne ne partage sa position GPS pour l'instant.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {geoPeople.map((p) => (
                      <div
                        key={p.user_id}
                        className="flex items-center justify-between p-3 bg-slate-100/60 rounded-xl"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {p.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {p.user_id === user.id ? "Vous" : p.full_name}
                            </p>
                            <p className="text-[10px] text-slate-500">{formatGeoAgo(p.geo_updated_at)}</p>
                          </div>
                        </div>
                        {p.user_id !== user.id && (
                          <button
                            onClick={() => setCompassTargetId(p.user_id)}
                            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition"
                          >
                            <Compass className="w-3.5 h-3.5" /> Boussole
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-fuchsia-600" />
                  <span>Membres</span>
                </h2>

                {isOwner && (
                  <form onSubmit={handleInvite} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="email@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-fuchsia-500"
                    />
                    <button
                      type="submit"
                      disabled={inviting}
                      className="px-3.5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
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
                    <LogOut className="w-3.5 h-3.5" /> Quitter le suivi
                  </button>
                )}
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>En ce moment ({positions.length})</span>
                </h2>
                {positions.length === 0 ? (
                  <p className="text-xs text-slate-400">Personne ne partage sa position.</p>
                ) : (
                  <div className="space-y-1.5">
                    {positions.map((p) => (
                      <div key={p.user_id} className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                          {p.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-slate-700 truncate">{p.full_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {showPositionModal && (
        <PositionFormModal
          suiviId={id}
          sets={sets}
          otherPositions={otherPositions}
          initialPosition={quickTarget || myPosition}
          onClose={() => {
            setShowPositionModal(false);
            setQuickTarget(null);
          }}
          onSaved={handlePositionSaved}
          triggerToast={triggerToast}
        />
      )}

      {showGeoModal && (
        <GeoPingModal
          suiviId={id}
          onClose={() => setShowGeoModal(false)}
          onSaved={handleGeoSaved}
          triggerToast={triggerToast}
        />
      )}

      {compassTargetId && (
        <CompassModal target={compassTarget} onClose={() => setCompassTargetId(null)} />
      )}

      <ToastNotifications toasts={toasts} />
    </div>
  );
}
