import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, SectionEyebrow } from "../components/Cards";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAssessment();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      login(res.user, res.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-20">
      <Card className="hover:shadow-xl transition-shadow">
        <SectionEyebrow>Member Access</SectionEyebrow>
        <h1 className="font-display text-3xl text-slate-900 dark:text-slate-100 font-bold mb-2">Log in to AlteraVie</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Access your personal health profile, blood test biomarkers, and daily meal journal.
        </p>

        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Logging in..." : "Log In to Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Don't have an account?{" "}
          <Link to="/register" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
}
