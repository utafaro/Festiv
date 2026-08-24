export function getInitials(fullName) {
  if (!fullName) return "??";
  return fullName
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
