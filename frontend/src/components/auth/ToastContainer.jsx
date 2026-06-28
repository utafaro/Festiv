export default function ToastContainer({
  toasts,
  removeToast
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
          { toasts && toasts.map((toast) => (
            <div 
              key={toast.id} 
              className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl pointer-events-auto transform transition-all duration-300 hover:scale-[1.02] animate-fadeIn"
            >
              <div className={`p-2 rounded-xl ${
                toast.type === 'success' 
                  ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' 
                  : toast.type === 'error' 
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' 
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
              }`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : toast.type === 'error' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {toast.message}
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
  )
}