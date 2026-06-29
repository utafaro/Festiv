Act en tant qu'expert Front-End React & Tailwind CSS. Je souhaite que tu génères une nouvelle page/composant en reprenant STRICTEMENT la charte graphique et le design system "Festiv Light Premium" décrit ci-dessous.

### 1. Palette de Couleurs & Thème (Light UI)
* Arrière-plan global : `bg-slate-50` avec des halos lumineux diffus en arrière-plan (`bg-gradient-to-tr from-indigo-100/40 via-purple-50/30 to-pink-100/40`).
* Typographie principale : Textes importants en `text-slate-900` (sans-serif moderne), textes secondaires en `text-slate-600` ou `text-slate-500`.
* Couleurs d'accentuation :
  - Indigo Premium : `text-indigo-600`, `bg-indigo-600`, au survol `hover:bg-indigo-700`
  - Fuchsia (Énergie/Live) : `text-fuchsia-600`, `bg-fuchsia-600`
  - Émeraude (Succès/Acheté) : `bg-emerald-50 text-emerald-700 border-emerald-200`
  - Ambre (Alerte/Conflit/Wishlist) : `bg-amber-50 text-amber-700 border-amber-200`

### 2. Design System & Composants (Glassmorphism Light)
* Cartes / Panneaux : Fond blanc semi-translucide avec flou d'arrière-plan, bordure fine blanche et ombre douce.
  -> Classes Tailwind : `bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-100/50 rounded-2xl`
* Header / Barre de navigation : Doit être fixé en haut de page en mode sticky, transparent mais lisible au défilement.
  -> Classes Tailwind : `sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100`
* Boutons principaux : Coins arrondis (`rounded-xl`), ombres légères, transition fluide au survol.
  -> Classes Tailwind : `bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md`
* Boutons secondaires / Inputs : `bg-slate-100/80 border border-slate-200/60 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 rounded-xl`

### 3. Structure Technique Obligatoire
* Technologie : React (JSX), composants fonctionnels, gestion des états via `useState` et `useEffect`.
* Style : Uniquement des classes utilitaires Tailwind CSS (pas de CSS personnalisé).
* Icônes : Utilise la bibliothèque `lucide-react`.
* Expérience utilisateur : Mobile-first mais parfaitement responsive (adapté aux tablettes et ordinateurs). Intégrer des transitions fluides (`transition-all duration-300`) sur les changements d'états, les onglets et les survols.

### 4. Ta Mission actuelle
Génère le composant suivant en respectant cette identité visuelle épurée, lumineuse et moderne :
[Insère ici la description de la nouvelle page ou fonctionnalité que tu veux créer, ex: "La page de profil utilisateur", "Le tunnel d'achat de billets", etc.]