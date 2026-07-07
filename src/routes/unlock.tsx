import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { ACCESS_PASSWORD, isUnlocked, unlock } from "@/lib/access";

export const Route = createFileRoute("/unlock")({
  component: UnlockPage,
  head: () => ({
    meta: [
      { title: "Masuk — 4D Macau Strategi BESAR" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function UnlockPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isUnlocked()) navigate({ to: "/" });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value === ACCESS_PASSWORD) {
      unlock();
      navigate({ to: "/" });
    } else {
      setError(true);
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-primary opacity-10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl shadow-primary/40">
              <span className="text-2xl font-black text-primary-foreground">4D</span>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">4D Macau</h1>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-primary">
              Strategi BESAR
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm"
          style={shake ? { animation: "gate-shake 0.4s ease-in-out" } : undefined}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-semibold">Masukkan sandi akses</span>
          </div>

          <div className="relative">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Sandi akses..."
              autoComplete="current-password"
              className={`w-full rounded-xl border bg-muted px-4 py-3.5 pr-12 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-2 ${
                error
                  ? "border-destructive/70 focus:ring-destructive/30"
                  : "border-border focus:border-primary focus:ring-primary/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="-mt-2 pl-1 text-xs font-semibold text-destructive">
              Sandi salah. Coba lagi.
            </p>
          )}

          <button
            type="submit"
            disabled={!value}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/70 py-3.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Masuk
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground/70">🔒 Akses terbatas</p>
      </div>

      <style>{`
        @keyframes gate-shake {
          0%, 100% { transform: translateX(0); }
          15%  { transform: translateX(-6px); }
          30%  { transform: translateX(6px); }
          45%  { transform: translateX(-4px); }
          60%  { transform: translateX(4px); }
          75%  { transform: translateX(-2px); }
          90%  { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}