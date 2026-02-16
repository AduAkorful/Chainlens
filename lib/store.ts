import { create } from "zustand"

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  addSourceModalOpen: boolean
  setAddSourceModalOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  addSourceModalOpen: false,
  setAddSourceModalOpen: (open) => set({ addSourceModalOpen: open }),
}))
