import { Calendar, Zap, UserPlus, Radar } from "lucide-react";
import { Link, useLocation } from "react-router";

const TABS = [
  { path: "/", label: "Mon Tableau", icon: Calendar },
  { path: "/lineups", label: "Lineup & Planning", icon: Zap },
  { path: "/amis", label: "Amis", icon: UserPlus },
  { path: "/suivis", label: "Live", icon: Radar },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:py-6 md:pr-6">
        <nav className="flex flex-col gap-1.5 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 shadow-sm sticky top-24">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-bold text-left ${
                  active
                    ? "bg-indigo-50 border-l-4 border-indigo-600 text-indigo-600 shadow-sm pl-3"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/60 border-l-4 border-transparent pl-3"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Barre de navigation mobile (bas d'écran) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200/80 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
                  active ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="leading-none">{tab.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
