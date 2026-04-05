import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Lock, Mail, ArrowRight, Loader2, Check, X } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRequirements = useMemo(
    () => [
      { label: "At least 8 characters", test: (p) => p.length >= 8 },
      { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
      { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
      { label: "One number", test: (p) => /\d/.test(p) },
      {
        label: "One special character",
        test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
      },
    ],
    [],
  );

  const passwordChecks = useMemo(() => {
    if (isLogin) return [];
    return passwordRequirements.map((req) => ({
      label: req.label,
      met: req.test(password),
    }));
  }, [password, passwordRequirements, isLogin]);

  const isPasswordValid = passwordChecks.every((check) => check.met);

  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLogin && !isPasswordValid) {
      toast("Password does not meet all requirements", "warning");
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message);
      }
    } catch (err) {
      toast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-xl font-black tracking-tighter text-blue-600 mb-6"
          >
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center mr-2 text-lg shadow-sm">
              S
            </div>
            ScrollNote
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-slate-500 text-sm">
            {isLogin
              ? "Enter your details to access your dashboard"
              : "Sign up to start saving your snippets"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {!isLogin && password.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs">
                {passwordChecks.map((check) => (
                  <li
                    key={check.label}
                    className={`flex items-center gap-2 transition-colors ${check.met ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {check.met ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {check.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (!isLogin && !isPasswordValid)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Sign Up"}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
