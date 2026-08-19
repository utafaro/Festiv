export default function AuthLayout({ children }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col justify-between overflow-x-hidden font-sans transition-colors duration-300 relative">
      {/* ORBS BACKGROUND (Géré uniquement ici maintenant) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[80px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-pink-400/20 dark:bg-pink-600/10 blur-[80px] animate-pulse"></div>
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-400/10 dark:bg-violet-900/5 blur-[80px] animate-pulse"></div>
      </div>

      {/* Contenu dynamique (Header + Main + Formulaire) */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen w-full">
        {children}
      </div>
    </div>
  );
}
