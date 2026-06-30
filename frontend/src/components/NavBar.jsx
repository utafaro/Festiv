import { Award, Calendar, Compass, Users, Zap } from "lucide-react";

export default function NavBar({
    activeTab,
    setActiveTab
}){
    return (
        <nav className="flex w-fit mx-auto items-center justify-center overflow-x-auto bg-white/70 p-1.5 rounded-2xl border border-slate-200/80 z-30 backdrop-blur-md gap-1 sm:gap-2 shadow-md scrollbar-none">
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm font-bold whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-50 border-b-2 sm:border-b-0 sm:border-l-4 border-indigo-600 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Mon Tableau</span>
          </button>

          <button 
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm font-bold whitespace-nowrap ${
              activeTab === 'schedule' 
                ? 'bg-indigo-50 border-b-2 sm:border-b-0 sm:border-l-4 border-indigo-600 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>Lineup & Planning</span>
          </button>

          <button 
            onClick={() => setActiveTab('discovery')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm font-bold whitespace-nowrap ${
              activeTab === 'discovery' 
                ? 'bg-indigo-50 border-b-2 sm:border-b-0 sm:border-l-4 border-indigo-600 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Découverte</span>
          </button>

          <button 
            onClick={() => setActiveTab('social')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm font-bold whitespace-nowrap ${
              activeTab === 'social' 
                ? 'bg-indigo-50 border-b-2 sm:border-b-0 sm:border-l-4 border-indigo-600 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Amis & Live</span>
          </button>

          <button 
            onClick={() => setActiveTab('wrapped')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm font-bold whitespace-nowrap ${
              activeTab === 'wrapped' 
                ? 'bg-indigo-50 border-b-2 sm:border-b-0 sm:border-l-4 border-indigo-600 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Souvenirs Wrapped</span>
          </button>

        </nav>
    )
}