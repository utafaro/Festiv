import { Zap } from "lucide-react";

export default function ToastNotifications({
    toasts
}){
    return(
        <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="flex items-center space-x-3 p-4 bg-white/95 border border-slate-200/80 rounded-2xl shadow-xl pointer-events-auto transform translate-y-2 animate-fadeIn hover:scale-[1.02] transition-all"
          >
            <div className={`p-2 rounded-xl ${
              toast.type === 'success' 
                ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' 
                : toast.type === 'warning' 
                  ? 'text-rose-600 bg-rose-50 border border-rose-100' 
                  : 'text-indigo-600 bg-indigo-50 border border-indigo-100'
            }`}>
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 text-xs font-semibold text-slate-700">
              {toast.message}
            </div>
          </div>
        ))}
      </div>
    )
}