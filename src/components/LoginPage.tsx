import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/useAuth";

type Mode = "login" | "signup";

export function LoginPage() {
  const { login, signup, guest } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (mode === "signup" && name.trim().length < 2) return false;
    if (!email.trim()) return false;
    if (password.length < 6) return false;
    return true;
  }, [busy, email, mode, name, password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setBusy(true);
      if (mode === "login") {
        await login({ email, password });
        toast.success("Welcome back!");
      } else {
        await signup({ name: name.trim(), email, password });
        toast.success("Account created!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const onGuest = async () => {
    try {
      setBusy(true);
      await guest();
      toast.success("Signed in as guest");
    } catch (err: any) {
      toast.error(err?.message || "Guest login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-24 w-[560px] h-[560px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-120px] left-1/3 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-[170px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            Local-First Secure Access
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
            Axiom Finance
            <span className="block text-primary italic">Neon Dashboard</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
            Sign in to unlock your analytics, goals, transactions, and simulations. Runs fully on your machine — no external dependency.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <div className="text-xs text-slate-400">Security</div>
              <div className="text-white font-semibold mt-1">http Only session cookie</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-slate-400">Storage</div>
              <div className="text-white font-semibold mt-1">Local file database</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-white text-xl font-bold">
                {mode === "login" ? "Sign in" : "Create account"}
              </div>
              <div className="text-slate-400 text-sm mt-1">
                {mode === "login" ? "Use email/password or continue as guest" : "Create your local profile"}
              </div>
            </div>

            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  mode === "login" ? "bg-primary text-black" : "text-slate-300 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  mode === "signup" ? "bg-primary text-black" : "text-slate-300 hover:text-white"
                }`}
              >
                Signup
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              void onSubmit(e);
            }}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div>
                <label className="block text-xs text-slate-400 mb-2">Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input pl-11"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-11"
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-11 pr-11"
                  placeholder="Minimum 6 characters"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button disabled={!canSubmit} className={`auth-button ${!canSubmit ? "opacity-60 cursor-not-allowed" : ""}`}>
              {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-white/10 flex-1" />
              <div className="text-xs text-slate-500">or</div>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <button
              type="button"
              onClick={() => {
                void onGuest();
              }}
              className="btn-secondary w-full"
            >
              Continue as Guest
            </button>

            <div className="text-xs text-slate-500 leading-relaxed">
              Tip: Guest mode creates a local temporary profile. You can later create a real account to keep your data separated.
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
