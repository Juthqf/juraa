import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin sign-in | Juraa" },
      { name: "description", content: "Restricted administrator access for Juraa data management." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin sign-in | Juraa" },
      { property: "og:description", content: "Restricted administrator access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string | undefined } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  async function refresh() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    if (data.user) {
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setIsAdmin(Boolean(ok));
    } else setIsAdmin(null);
  }

  useEffect(() => {
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") void refresh();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setMsg(error ? error.message : "Check your email and open the confirmation link, then sign in here.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  }

  return (
    <main dir="ltr" className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Juraa administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">Restricted area. Not part of the app.</p>

        {user ? (
          <div className="mt-6 space-y-3 text-sm">
            <p>Signed in as <strong>{user.email}</strong></p>
            <p>
              Admin role:{" "}
              <strong>{isAdmin === null ? "checking…" : isAdmin ? "granted" : "not granted"}</strong>
            </p>
            {isAdmin === false && (
              <p className="text-muted-foreground">
                The admin role can only be granted by the project owner through a server-side process. It cannot be requested or assigned here.
              </p>
            )}
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{mode === "signup" ? "Create account" : "Sign in"}</Button>
            <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg(null); }}>
              {mode === "signup" ? "Have an account? Sign in" : "Need an account? Create one"}
            </button>
            {msg && <p role="status" className="text-sm">{msg}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
