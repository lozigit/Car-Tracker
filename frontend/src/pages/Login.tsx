import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../lib/api";
import { Button, Card, Input } from "../lib/ui";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const tok = await api.login(email, password);
      setToken(tok.access_token);
      nav("/");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Login">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>
          Email
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <Button disabled={busy} type="submit">{busy ? "Signing in..." : "Sign in"}</Button>
        <div>No account? <Link to="/signup">Sign up</Link></div>
      </form>
    </Card>
  );
}
