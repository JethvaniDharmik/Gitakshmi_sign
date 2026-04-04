import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const routeByRole = (role) => {
    if (role === ROLES.SUPERADMIN) return "/super-admin";
    if ([ROLES.ADMIN, ROLES.HR].includes(role)) return "/company-admin";
    return "/my-documents";
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user: loggedInUser } = await login(form);
      navigate(routeByRole(loggedInUser.role));
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return <Navigate to={routeByRole(user.role)} replace />;
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.2),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_100%)]" />

      <div className="sf-card sf-fade-in relative w-full max-w-md overflow-hidden p-8 md:p-9">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-sky-100/80 blur-2xl" />
        <div className="absolute -left-10 -bottom-14 h-40 w-40 rounded-full bg-indigo-100/80 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SignFlow Platform</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Securely manage document workflows and signatures.</p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="sf-input"
                placeholder="name@company.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="sf-input"
                placeholder="Enter your password"
              />
            </label>

            {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            <button type="submit" disabled={loading} className="sf-btn-primary w-full py-2.5">
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
