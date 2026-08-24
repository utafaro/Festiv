import { useCallback, useState } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const triggerToast = useCallback((message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return [toasts, triggerToast];
}
