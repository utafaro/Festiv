import { useNavigate } from "react-router"
import { useAuth } from "../context/useAuth"
import Header from "../components/Header"

export default function Home(){
    const { logout } = useAuth()
    const navigate = useNavigate()

    const { user } = useAuth()

    async function handleLogout() {
        await logout()
        navigate("/auth", { replace: true })
    }

    return(
        <div className="bg-slate-50 text-slate-800 min-h-screen font-sans antialiased overflow-x-hidden relative flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300">
             {/* Light Ambient Decorative Gradient Orbs (matches Aura's login look) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-200/30 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }}></div>
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-200/20 blur-[120px]" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
            </div>
            <Header user={user}/>
            <button onClick={handleLogout}>
                Se déconnecter
            </button>
        </div>
    )
}