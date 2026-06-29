import { Award, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "react-router"; // 👈 Changé de Navigate à useNavigate
import { useAuth } from "../context/useAuth";

export default function UserDropdown({ user }) {
    const { logout } = useAuth();
    const navigate = useNavigate(); // 👈 Initialisation du hook de navigation

    async function handleLogout() {
        await logout();
        navigate("/auth", { replace: true }); // 👈 Utilisation correcte ici
    }

    function getInitials(fullName) {
        if (!fullName) return "??"; // Valeur par défaut si l'utilisateur n'a pas de nom chargé
        
        return fullName
            .trim()
            .split(/\s+/) // Sépare correctement même s'il y a plusieurs espaces
            .map(word => word.charAt(0)) 
            .slice(0, 2) // Limite à 2 lettres maximum (ex: "John Doe" -> "JD")
            .join('')                    
            .toUpperCase();              
    }

    return (
        <>
            {/* Dropdown Menu Box - Premium Glassmorphism styling */}
            <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/60 p-2.5 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50">
            
                {/* Account details header section */}
                <div className="p-3 border-b border-slate-100 mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                            {getInitials(user?.full_name)}
                        </div>
                        <div className="text-left">
                            {/* 👈 Rendu dynamique du nom et de l'email de l'user */}
                            <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                                {user?.full_name || "Utilisateur"}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium leading-normal">
                                {user?.email || "pas-demail@festiv.com"}
                            </p>
                            
                        </div>
                    </div>
                </div>

                {/* Main Interactive Items list */}
                <div className="space-y-0.5">
                    <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-200">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Mon Profil</span>
                    </button>
                </div>

                {/* Separation line */}
                <div className="border-t border-slate-100 my-2"></div>

                {/* Destructive actions (Logout) */}
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Se déconnecter</span>
                </button>

            </div>
        </>
    );
}