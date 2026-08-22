import { useEffect, useState } from "react";
import { UserPlus, Users, Check, X, Trash2, Loader2 } from "lucide-react";
import {
  listFriends,
  listFriendInvitations,
  addFriend,
  acceptFriend,
  deleteFriend,
} from "../api/friend";
import ToastNotifications from "../components/ToastNotifications";

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
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
      try {
        const [friendsData, invitesData] = await Promise.all([listFriends(), listFriendInvitations()]);
        if (!active) return;
        setFriends(friendsData);
        setInvitations(invitesData);
      } catch {
        if (active) triggerToast("Impossible de charger vos amis.", "error");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setAdding(true);
    try {
      await addFriend(value);
      setEmail("");
      triggerToast("Demande d'ami envoyée.", "success");
      setReloadKey((k) => k + 1);
    } catch (err) {
      triggerToast(err.response?.data?.detail || "Erreur lors de l'envoi de la demande.", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (invite) => {
    setRespondingId(invite.id);
    try {
      await acceptFriend(invite.id);
      triggerToast(`${invite.full_name} est maintenant votre ami.`, "success");
      setReloadKey((k) => k + 1);
    } catch {
      triggerToast("Erreur lors de l'acceptation.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (invite) => {
    setRespondingId(invite.id);
    try {
      await deleteFriend(invite.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invite.id));
      triggerToast("Demande refusée.", "info");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const handleRemove = async (friend) => {
    if (!window.confirm("Retirer cet ami ? Il sera aussi retiré de vos lineups et suivis partagés.")) return;
    setRemovingId(friend.id);
    try {
      await deleteFriend(friend.id);
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
      triggerToast("Ami retiré.", "info");
    } catch {
      triggerToast("Erreur lors de la suppression.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Chargement de vos amis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Amis</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ajoutez des amis pour les inviter dans vos lineups et suivis.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-600" />
          <span>Ajouter un ami</span>
        </h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            placeholder="email@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ajouter"}
          </button>
        </form>
      </div>

      {invitations.length > 0 && (
        <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase">Demandes reçues</h2>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-slate-100/60 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{inv.full_name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{inv.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(inv)}
                    disabled={respondingId === inv.id}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDecline(inv)}
                    disabled={respondingId === inv.id}
                    className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-3xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Mes amis ({friends.length})</span>
        </h2>
        {friends.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            Aucun ami pour l'instant. Ajoutez-en un via son email.
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-3 bg-slate-100/60 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{f.full_name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{f.email}</p>
                </div>
                <button
                  onClick={() => handleRemove(f)}
                  disabled={removingId === f.id}
                  className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-50 shrink-0"
                  title="Retirer"
                >
                  {removingId === f.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastNotifications toasts={toasts} />
    </div>
  );
}
