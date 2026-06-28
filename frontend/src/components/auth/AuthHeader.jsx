import { useState } from "react";

export default function AuthHeader({
  theme,
  setTheme,
  showToast
}){

    
      // Custom interactive notification state
    
    return (
        <>
        
        {/* Header navigation bar */}
        <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold font-sans tracking-tight text-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              FESTIV<span className="text-indigo-600 dark:text-indigo-400">.</span>
            </span>
          </div>

          {/* Theme Switch Action Trigger */}
          <button 
            onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé !`, 'info');
            }} 
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            aria-label="Changer de thème"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 2.293a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm4 5.707a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM14 15.707a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zm-7 0a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zm-4-5.707a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm2.293-5.707a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 7a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </header>
        </>
        
    )
}