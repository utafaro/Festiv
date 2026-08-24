import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { listFriends } from "../api/friend";

export default function FriendPicker({ excludeIds = [], onSelect, placeholder = "Rechercher un ami..." }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listFriends()
      .then(setFriends)
      .finally(() => setLoading(false));
  }, []);

  const excluded = new Set(excludeIds);
  const q = query.trim().toLowerCase();
  const matches = q
    ? friends.filter(
        (f) =>
          !excluded.has(f.user_id) &&
          (f.full_name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)),
      )
    : [];

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={loading ? "Chargement..." : placeholder}
        disabled={loading}
        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
      />
      {q && (
        <ul className="border border-slate-200/85 rounded-2xl shadow-sm max-h-48 overflow-y-auto scrollbar-none">
          {matches.length === 0 ? (
            <li className="px-3.5 py-2.5 text-slate-400 text-xs">
              {friends.length === 0 ? "Ajoutez d'abord des amis." : "Aucun ami correspondant."}
            </li>
          ) : (
            matches.slice(0, 6).map((f) => (
              <li
                key={f.id}
                onClick={() => {
                  onSelect(f);
                  setQuery("");
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{f.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{f.email}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
