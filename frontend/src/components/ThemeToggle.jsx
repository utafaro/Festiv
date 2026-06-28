export default function ThemeToggle() {
  return (
    <button
      onClick={() => document.documentElement.classList.toggle("dark")}
      className="p-2 rounded-xl border"
    >
      🌙
    </button>
  )
}