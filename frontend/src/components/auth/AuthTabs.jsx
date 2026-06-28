

export default function AuthTabs({
  activeTab,
  setActiveTab
}) {
  return (
    <div className="flex p-1 bg-slate-100/80 dark:bg-slate-950/80 rounded-2xl mb-8 border border-slate-200/20">
      <button 
        onClick={() => setActiveTab('login')}
        className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer transition-all duration-300 ${
          activeTab === 'login' 
            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Connexion
      </button>
      <button 
        onClick={() => setActiveTab('signup')}
        className={`flex-1 py-2.5 text-xs sm:text-sm cursor-pointer font-semibold rounded-xl transition-all duration-300 ${
          activeTab === 'signup' 
            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Créer un compte
      </button>
    </div>
  )
}