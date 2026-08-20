import { createContext, useContext, useMemo, useState } from "react";

const SettingsSheetContext = createContext(null);

export function SettingsSheetProvider({ children }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, show: () => setOpen(true), hide: () => setOpen(false) }), [open]);

  return <SettingsSheetContext.Provider value={value}>{children}</SettingsSheetContext.Provider>;
}

export const useSettingsSheet = () => useContext(SettingsSheetContext);
