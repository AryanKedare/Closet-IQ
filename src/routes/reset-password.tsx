import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(Boolean(data.session));
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true);
        setChecking(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function sendResetEmail(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) setError(resetError.message);
    else setMessage("Check your email for the password reset link.");
    setLoading(false);
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated. Redirecting to your account…");
    window.setTimeout(() => window.location.assign("/"), 700);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="card-surface w-full max-w-md p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {hasRecoverySession ? <KeyRound className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {hasRecoverySession ? "Choose a new password" : "Reset your password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasRecoverySession
            ? "Enter a new password for your ClosetIQ account."
            : "Enter your account email and we’ll send you a secure reset link."}
        </p>

        {checking ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking recovery link…
          </div>
        ) : hasRecoverySession ? (
          <form onSubmit={updatePassword} className="mt-6 space-y-4">
            <PasswordField label="New password" value={password} onChange={setPassword} visible={showPassword} toggle={() => setShowPassword((value) => !value)} />
            <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} visible={showPassword} toggle={() => setShowPassword((value) => !value)} />
            <Status error={error} message={message} />
            <SubmitButton loading={loading}>Update password</SubmitButton>
          </form>
        ) : (
          <form onSubmit={sendResetEmail} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 outline-none focus:border-primary"
                placeholder="you@example.com"
              />
            </label>
            <Status error={error} message={message} />
            <SubmitButton loading={loading}>Send reset link</SubmitButton>
          </form>
        )}

        {!hasRecoverySession && (
          <Link to="/login" className="mt-5 block text-center text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        )}
      </div>
    </main>
  );
}

function PasswordField({ label, value, onChange, visible, toggle }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; toggle: () => void }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="relative mt-1.5">
        <input type={visible ? "text" : "password"} required minLength={6} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" className="w-full rounded-md border border-border bg-card px-3 py-2.5 pr-10 outline-none focus:border-primary" />
        <button type="button" onClick={toggle} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function Status({ error, message }: { error: string | null; message: string | null }) {
  if (error) return <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>;
  if (message) return <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>;
  return null;
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
