import { Radio } from "lucide-react";
import UserDropdown from "./UserDropdown";



export default function Header({ user }){
    return(
        
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/85 bg-white/80 backdrop-blur-md px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-[0_4px_15px_rgba(99,102,241,0.25)]">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tighter bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-950 bg-clip-text text-transparent">
                FESTIV
              </span>
              <span className="text-indigo-600 font-extrabold text-2xl leading-none">.</span>
            </div>
          </div>

          {/* Quick Stats or Spotify Connection Widget */}
          <div className="relative flex items-center gap-3 group py-2">
            <span className="text-xs text-slate-700 font-semibold">{user?.full_name}</span>
            {/* Profile Avatar mockup */}
            <button className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm hover:ring-2 hover:ring-indigo-500/25 hover:border-indigo-500/40 transition-all duration-300 focus:outline-none">
                <img src={user?.avatar} alt="Avatar User" className="w-full h-full object-cover" />
            </button>
            <UserDropdown user={user} />
          </div>
        </div>
      </header>

    )
}