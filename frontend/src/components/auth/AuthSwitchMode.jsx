export default function AuthSwitchMode({
    activeTab,
    setActiveTab
}){
    return (
      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        {activeTab === "login" ? (
          <>
            Nouveau sur Festiv ?{" "}
            <button
              onClick={() => setActiveTab("signup")}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Inscrivez-vous gratuitement
            </button>
          </>
        ) : (
          <>
            Vous possédez déjà un compte ?{" "}
            <button
              onClick={() => setActiveTab("login")}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Connectez-vous
            </button>
          </>
        )}
      </div>
    );
}