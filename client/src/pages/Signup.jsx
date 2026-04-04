import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
      <h1 className="text-3xl font-extrabold text-ink">Create Account</h1>
      <p className="mt-2 text-sm text-slate-600">Start sending secure sign requests today.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          required
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
        />
        <input
          type="password"
          placeholder="Password"
          minLength={6}
          required
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
        />
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-accent px-4 py-2.5 font-semibold text-white"
        >
          {loading ? "Creating account..." : "Signup"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-accent">
          Login
        </Link>
      </p>
    </section>
  );
};

export default Signup;
