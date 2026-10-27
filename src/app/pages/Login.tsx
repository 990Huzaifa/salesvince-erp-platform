import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Layers3,
  LockKeyhole,
  Mail,
  Server,
  Shield,
  Sparkles,
} from "lucide-react";
import { APP_NAME, APP_URL } from "../utils";
import { buildApiUrl } from "../utils/helper";
import { getAuthSession, setAuthSession } from "../utils/auth";

type LoginFormState = {
  email: string;
  password: string;
};

const demoCredentials: LoginFormState = {
  email: "admin@erp.com",
  password: "demo9090",
};

export default function MasterLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<LoginFormState>(demoCredentials);

  const existingSession = getAuthSession();

  useEffect(() => {
    document.title = `${APP_NAME} | Master Login`;
  }, []);

  if (existingSession?.accessToken) {
    return <Navigate to="/master" replace />;
  }

  const handleChange = (field: keyof LoginFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("platform/auth/signin"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Unable to sign in.");
      }

      if (!data?.access_token || !data?.user) {
        throw new Error("Invalid login response.");
      }

      setAuthSession({
        accessToken: data.access_token,
        user: data.user,
        signedInAt: new Date().toISOString(),
      });

      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/master";
      navigate(fromPath, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-stretch overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(172, 209, 253, 0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(149, 140, 232, 0.18), transparent 32%), linear-gradient(135deg, #0b1020 0%, #111827 48%, #161d35 100%)",
      }}
    >
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between p-10 text-white relative">
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute -top-20 -left-20 size-72 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(149, 140, 232, 0.3)" }}
          />
          <div
            className="absolute bottom-10 right-0 size-96 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(172, 209, 253, 0.18)" }}
          />
        </div>

        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm"
            style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <Sparkles className="size-4" />
            Master control access
          </div>

          <div className="mt-10 max-w-xl">
            <h1 className="text-5xl font-semibold leading-tight text-white">
              Sign in to the {APP_NAME} control plane
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7" style={{ color: "rgba(255,255,255,0.72)" }}>
              Manage tenants, modules, billing, and platform settings from a single authenticated entry point backed by your API.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {[
              { label: "API", value: "platform/auth/signin", icon: Server },
              { label: "Role", value: "SUPER_ADMIN", icon: Shield },
              { label: "Access", value: "Centralized", icon: Layers3 },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border p-4 backdrop-blur-sm"
                  style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <Icon className="size-5 text-white" />
                  <p className="mt-4 text-xs uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white break-words">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          <p>Protected entry for platform administrators.</p>
          <p className="mt-1">Current app URL: {APP_URL}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden text-white">
            <div className="size-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(149, 140, 232, 0.2)" }}>
              <Shield className="size-5" />
            </div>
            <div>
              <div className="font-semibold">{APP_NAME}</div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>Master Login</div>
            </div>
          </div>

          <div
            className="rounded-3xl border bg-white/95 p-8 shadow-2xl backdrop-blur-xl"
            style={{ borderColor: "rgba(255,255,255,0.18)" }}
          >
            <div className="mb-8">
              <div
                className="inline-flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(149, 140, 232, 0.12)", color: "#958CE8" }}
              >
                <LockKeyhole className="size-6" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold" style={{ color: "#21222D" }}>
                Master login
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "#6B6C7E" }}>
                Use your platform admin credentials to access the dashboard.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: "#21222D" }}>
                  Email
                </span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: "#6B6C7E" }} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    autoComplete="email"
                    className="w-full rounded-2xl border bg-white px-10 py-3.5 text-sm outline-none transition-all"
                    style={{ borderColor: "rgba(219, 219, 229, 0.9)", color: "#21222D" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#958CE8";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(149, 140, 232, 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(219, 219, 229, 0.9)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: "#21222D" }}>
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    autoComplete="current-password"
                    className="w-full rounded-2xl border bg-white px-4 py-3.5 pr-12 text-sm outline-none transition-all"
                    style={{ borderColor: "rgba(219, 219, 229, 0.9)", color: "#21222D" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#958CE8";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(149, 140, 232, 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(219, 219, 229, 0.9)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5 transition-colors"
                    style={{ color: "#6B6C7E" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              {errorMessage ? (
                <div
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: "rgba(239, 68, 68, 0.25)", backgroundColor: "rgba(239, 68, 68, 0.07)", color: "#B91C1C" }}
                >
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "#958CE8" }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = "#8479D9";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(149, 140, 232, 0.28)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#958CE8";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="mt-6 rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(172, 209, 253, 0.5)", backgroundColor: "rgba(172, 209, 253, 0.12)" }}>
              <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: "#4B5563" }}>
                Demo credentials
              </p>
              <p className="mt-2 text-sm" style={{ color: "#21222D" }}>
                <span className="font-medium">Email:</span> admin@erp.com
              </p>
              <p className="text-sm" style={{ color: "#21222D" }}>
                <span className="font-medium">Password:</span> demo9090
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
