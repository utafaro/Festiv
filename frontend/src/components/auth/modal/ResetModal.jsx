import { useState } from "react";

export default function ResetModal({
    setShowResetModal,
    showToast
}) {
    const [resetEmail, setResetEmail] = useState('');
  
    const handleResetSubmit = (e) => {
        e.preventDefault();
        setShowResetModal(false);
        showToast(`Un email de récupération vient d'être envoyé à ${resetEmail}.`, 'success');
        setResetEmail('');
    };
    return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative mx-4">
        <button
          onClick={() => setShowResetModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 7a2 2 0 012 2m0 9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2m4-4h2a2 2 0 012 2v2m-6 0h6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">
            Récupération de mot de passe
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            Nous vous enverrons un lien d'accès pour configurer un nouveau mot
            de passe.
          </p>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="reset-email"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Adresse email
            </label>
            <input
              type="email"
              id="reset-email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all duration-200 text-sm"
          >
            Envoyer le lien de récupération
          </button>
        </form>
      </div>
    </div>
  );
}
