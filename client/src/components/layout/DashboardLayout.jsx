import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";

const roleConfig = {
  [ROLES.SUPERADMIN]: {
    label: "Super Admin",
    nav: [{ label: "Dashboard", to: "/super-admin" }],
  },
  [ROLES.ADMIN]: {
    label: "Company Admin",
    nav: [
      { label: "Dashboard", to: "/company-admin" },
      { label: "History", to: "/history" },
    ],
  },
  [ROLES.HR]: {
    label: "HR",
    nav: [
      { label: "Dashboard", to: "/company-admin" },
      { label: "My Queue", to: "/my-documents" },
      { label: "History", to: "/history" },
    ],
  },
  [ROLES.EMPLOYEE]: {
    label: "Employee",
    nav: [{ label: "My Queue", to: "/my-documents" }],
  },
};

const DashboardLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const config = useMemo(() => roleConfig[user?.role] || roleConfig[ROLES.EMPLOYEE], [user?.role]);

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[290px] border-r border-slate-200/70 bg-white/95 px-5 py-6 shadow-2xl shadow-slate-200/70 backdrop-blur-xl lg:static lg:block lg:min-h-screen lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300`}
        >
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SignFlow</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Workspace</h2>
            <p className="mt-1 text-sm text-slate-500">{config.label} Console</p>
          </div>

          <nav className="space-y-1.5">
            {config.nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Signed in as</p>
            <p className="mt-1 font-semibold text-slate-900">{user?.name}</p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          />
        ) : null}

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  ≡
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
                  <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 sm:inline-flex">
                  Production Workspace
                </span>
                <button type="button" onClick={logout} className="sf-btn-primary px-4 py-2">
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="sf-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
