import { Link } from "react-router";

export default function Marketing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-6">
      <div className="max-w-2xl text-center">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
          Salevince control plane
        </div>
        <h1 className="mt-6 text-5xl font-bold text-white sm:text-6xl">Welcome</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Marketing website coming soon. Use the master login to access the platform dashboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/master/login"
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: "#958CE8" }}
          >
            Master Login
          </Link>
          <Link
            to="/master"
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/85 transition-all hover:bg-white/5"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
