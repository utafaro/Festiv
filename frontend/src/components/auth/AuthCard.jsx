import { useEffect, useState } from "react";
import AuthHeader from "./AuthHeader";
import AuthTabs from "./AuthTabs";
import SocialButtons from "./SocialButtons";
import AuthForm from "./AuthForm";
import AuthSwitchMode from "./AuthSwitchMode";
import ResetModal from "./modal/ResetModal";
import ToastContainer from "./ToastContainer";

export default function AuthCard() {
    const [activeTab, setActiveTab] = useState('login');
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('color-theme');
          if (savedTheme) return savedTheme;
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
          return 'dark';
    });

    // Custom interactive notification state
    const [toasts, setToasts] = useState([]);

    const [showResetModal, setShowResetModal] = useState(false);

    useEffect(() => {
    // Reflect theme updates on local storage
      localStorage.setItem('color-theme', theme);
    }, [theme]);

    // Toast dispatch utility
    const showToast = (message, type = 'info') => {
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      
      // Auto-discard toasts
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    };

    const removeToast = (id) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };


  
    return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
        <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 min-h-screen flex flex-col justify-between overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 orb-blur-1 animate-pulse-slow"></div>

                <div
                className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-pink-400/20 dark:bg-pink-600/10 orb-blur-1 animate-pulse-slow"
                style={{ animationDelay: "1.5s" }}
                ></div>

                <div 
                className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-400/10 dark:bg-violet-900/5 orb-blur-1 animate-pulse-slow"
                style={{ animationDelay: "3s" }}
                ></div>
            </div>
            <AuthHeader theme={theme} setTheme={setTheme} showToast={showToast}/>
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="lg:col-span-7 flex justify-center w-full">
                  <div className="w-full max-w-md bg-white/45 dark:bg-slate-900/45 backdrop-blur-md border border-white/25 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300">

                      {/* Visual Glow Gradient Accent */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                      {/* Card Title Content */}
                      <div className="mb-8 text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          {activeTab === 'login' ? 'Ravi de vous revoir' : 'Créer un compte Aura'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                          {activeTab === 'login' 
                            ? 'Entrez vos identifiants pour accéder à votre espace de travail.' 
                            : 'Prêt à transformer vos idées ? Rejoignez-nous en quelques secondes.'
                          }
                        </p>
                      </div>

                      <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                      <SocialButtons showToast={showToast} />

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
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            {/* Dynamic Interactive Toasts Container */}
            {
              showResetModal && 
                <ResetModal setShowResetModal={setShowResetModal} showToast={showToast} />
              
            }

        </div>
    </div>
    );
}