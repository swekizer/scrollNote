import React from "react";
import { Link } from "react-router-dom";
import {
  MousePointer2,
  Image as ImageIcon,
  Search,
  Zap,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      <nav className="border-b border-slate-200/50 bg-white/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center text-xl font-black tracking-tighter text-blue-600">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center mr-2 text-lg shadow-sm">
              S
            </div>
            ScrollNote
          </div>
          <div className="flex items-center space-x-4 text-sm font-medium">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-all shadow-sm hover:shadow"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-all shadow-sm hover:shadow"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-32 overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-50 -z-10"></div>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
            Highlight it. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              Save it forever.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The cleanest way to capture text and screenshots across the web.
            Organized beautifully in a bento-style dashboard, instantly
            searchable via your own private cloud.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center group w-full sm:w-auto justify-center"
            >
              {user ? "Go to Dashboard" : "Add to Chrome - It's Free"}
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="mt-20 relative mx-auto max-w-4xl lg:mt-24">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center justify-start space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="ml-4 bg-white px-3 py-1 rounded-md text-xs text-slate-400 border border-slate-200 flex-1 max-w-md mx-auto text-center font-mono">
                  scrollnote.app/dashboard
                </div>
              </div>
              <div className="aspect-video bg-slate-50 p-8 flex gap-6">
                <div className="w-48 bg-white rounded-xl shadow-sm border border-slate-200 p-4 hidden md:block">
                  <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-blue-100 rounded"></div>
                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="h-24 bg-slate-100"></div>
                      <div className="p-3 space-y-2 flex-1">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-slate-600">
              Built for speed, reading comfort, and finding your thoughts
              instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <MousePointer2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Select & Save
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Just highlight text on any webpage, right click, and save it
                directly to your dashboard.
              </p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Auto-Screenshots
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Every snippet is saved alongside a visual screenshot of exactly
                how it looked on the page.
              </p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Instant Search
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Find exactly what you're looking for across thousands of notes
                instantly.
              </p>
            </div>
            <div className="md:col-span-2 bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="relative z-10 w-full md:w-2/3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Secure by design</h3>
                <p className="text-slate-300 leading-relaxed text-lg mb-6">
                  Your notes are fully isolated. Built with strict CORS, JWT
                  authentication, and sanitized postgREST querying to ensure
                  only you read your clips.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mb-20"></div>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Lightning Fast
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Rendered with React and optimized with paginated limit/range
                APIs so it never bloats.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
