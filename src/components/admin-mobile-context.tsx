'use client'

import { createContext, useContext, useState } from 'react'

interface AdminMobileContextValue {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const AdminMobileContext = createContext<AdminMobileContextValue>({
  mobileOpen: false,
  setMobileOpen: () => {},
})

export function AdminMobileProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <AdminMobileContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </AdminMobileContext.Provider>
  )
}

export function useAdminMobile() {
  return useContext(AdminMobileContext)
}
