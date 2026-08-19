import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/useAuth";
import AuthHeader from "./AuthHeader";
import AuthTabs from "./AuthTabs";
import SocialButtons from "./SocialButtons";
import AuthForm from "./AuthForm";
import AuthSwitchMode from "./AuthSwitchMode";
import ResetModal from "./modal/ResetModal";

export default function AuthCard() {
  const [activeTab, setActiveTab] = useState("login");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("color-theme");
      if (savedTheme) return savedTheme;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  });

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading]);

  const [toasts, setToasts] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);

  // Injection de la classe sur l'élément HTML racine
  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem("color-theme", theme);
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  return (
    <>
      {/* 1. Navbar */}
      <AuthHeader theme={theme} setTheme={setTheme} showToast={showToast} />

      {/* 2. Formulaire Centralisé */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:col-span-7 flex justify-center w-full">
          <div className="w-full max-w-md bg-white/45 dark:bg-slate-900/45 backdrop-blur-md border border-white/25 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold dark:text-white tracking-tight">
                {activeTab === "login"
                  ? "Ravi de vous revoir"
                  : "Créer un compte Aura"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {activeTab === "login"
                  ? "Entrez vos identifiants pour accéder à votre espace de travail."
                  : "Prêt à transformer vos idées ? Rejoignez-nous en quelques secondes."}
              </p>
            </div>

            <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <SocialButtons />
            <AuthForm
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showToast={showToast}
              setShowResetModal={setShowResetModal}
            />
            <AuthSwitchMode activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </main>

      {showResetModal && (
        <ResetModal
          setShowResetModal={setShowResetModal}
          showToast={showToast}
        />
      )}
    </>
  );
}
