import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItemClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 font-medium transition ${
      isActive
        ? "bg-indigo-100 text-indigo-700"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-500 text-xs font-bold text-white shadow-md shadow-indigo-200">
            G
          </span>
          <span className="text-[34px] leading-none font-extrabold tracking-tight text-slate-900 [font-size:clamp(1.35rem,2.2vw,2.1rem)]">
            GitakshmiSign
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 text-sm">
            <NavLink to="/" className={navItemClass}>
              Dashboard
            </NavLink>
            <NavLink to="/upload" className={navItemClass}>
              Upload
            </NavLink>
            <span className="hidden max-w-[260px] truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 lg:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <NavLink to="/login" className={navItemClass}>
              Login
            </NavLink>
            <NavLink
              to="/signup"
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-500 hover:to-blue-500"
            >
              Signup
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
