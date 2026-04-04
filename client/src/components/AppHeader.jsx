import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLabelMap = {
  superadmin: "Super Admin",
  admin: "Admin",
  hr: "HR",
  employee: "Employee",
};

const AppHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-semibold text-slate-900">
          SignFlow
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-slate-800">{user.name}</p>
              <p className="text-slate-500">{roleLabelMap[user.role] || user.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default AppHeader;
