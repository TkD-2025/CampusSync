import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { logout } from '../services/authService'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-[#e7dfcf] bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e4d7bc] bg-[#f7f2e7] hover:bg-[#f0e8db] transition-colors lg:hidden"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg
                  className="h-5 w-5 text-slate-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 7H20" strokeLinecap="round" />
                  <path d="M4 12H20" strokeLinecap="round" />
                  <path d="M4 17H20" strokeLinecap="round" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">CampusSync</h1>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <div className="mx-auto max-w-[1400px] rounded-2xl border border-[#e7dfcf] bg-white p-4 shadow-lg md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
