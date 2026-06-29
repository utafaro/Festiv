import { useState } from "react";
import PasswordField from "./PasswordField";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router";

export default function AuthForm({ activeTab, setActiveTab, showToast, setShowResetModal}) {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    terms: false,
    rememberMe: false,
  });
  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
   
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        if (activeTab === "login") {
          await login(formData.email, formData.password, formData.rememberMe);
          showToast(`Ravi de vous revoir ! Authentification réussie.`, "success");
          navigate("/");

        } else {
          if (!formData.terms) {
            showToast("Veuillez accepter les conditions d'utilisation.", "error");
            return;
          }
          await register(formData.email, formData.password, formData.fullname);
          showToast(`Compte créé avec succès ! Bienvenue, ${formData.fullname}.`, "success");
          navigate("/");
        }

      } catch (err) {
        const detail = err.response?.data?.detail;
        showToast(detail || "Une erreur est survenue.", "error");

      } finally {
        setLoading(false);
      }
  };


  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* Fullname input (Visible only on Sign Up mode) */}
      {activeTab === "signup" && (
        <div className="space-y-2 transition-all duration-300 animate-fadeIn">
          <label
            htmlFor="fullname"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Nom complet
          </label>
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
            <input
              type="text"
              id="fullname"
              required={activeTab === "signup"}
              value={formData.fullname}
              onChange={handleInputChange}
              placeholder="Arthur Pendragon"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
            />
          </div>
        </div>
      )}

      {/* Email Input Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          Adresse email
        </label>
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
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
              />
            </svg>
          </span>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            placeholder="vous@exemple.com"
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
          />
        </div>
      </div>

      <PasswordField 
        setShowResetModal={setShowResetModal}
        activeTab={activeTab}
        handleInputChange={handleInputChange}
        formData={formData}


      />

      {}
      {/* Remember me (Only Login Mode) */}
      {activeTab === "login" && (
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2.5 cursor-pointer group">
            <input
              type="checkbox"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-900 transition-all"
            />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              Se souvenir de moi
            </span>
          </label>
        </div>
      )}

      {/* Terms and Conditions (Only Sign Up Mode) */}
      {activeTab === "signup" && (
        <div className="flex items-start space-x-2.5 cursor-pointer group animate-fadeIn">
          <input
            type="checkbox"
            id="terms"
            checked={formData.terms}
            onChange={handleInputChange}
            className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-900 transition-all"
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            J'accepte les{" "}
            <a
              href="#"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Conditions d'Utilisation
            </a>{" "}
            et la{" "}
            <a
              href="#"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Politique de Confidentialité
            </a>
            .
          </span>
        </div>
      )}

      {/* Submit Button Dynamic States */}
      <button
        type="submit"
        disabled={loading}
        className="w-full relative overflow-hidden group py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transform active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 disabled:opacity-50"
      >
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
        ></div>
        <span>
          {activeTab === "login" ? "Se connecter" : "Commencer l'aventure"}
        </span>
        {loading && (
          <svg
            className="animate-spin h-5 w-5 text-white ml-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
      </button>
    </form>
  );
}
