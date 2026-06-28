import { useState } from "react";

export default function PasswordField(
  {
    setShowResetModal,
    activeTab,
    handleInputChange,
    formData
  }
) {

  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          Mot de passe
        </label>
        {activeTab === "login" && (
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
          >
            Mot de passe oublié ?
          </button>
        )}
      </div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </span>
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          required
          value={formData.password}
          onChange={handleInputChange}
          placeholder="••••••••••••"
          className="w-full pl-11 pr-11 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
        />

        {/* Password Visibility Switcher */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
        >
          {showPassword ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13.828 10.172a4 4 0 00-5.656 5.656m11.022-1.428m0 0a17.927 17.927 0 001.373-3.237a11.954 11.954 0 00-11.022-8.525C6.182 2.628 3.513 5.4 2.182 8.525A11.955 11.955 0 003.555 12a12.012 12.012 0 01-1.373 3.237L13.828 10.172z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3l18 18"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
