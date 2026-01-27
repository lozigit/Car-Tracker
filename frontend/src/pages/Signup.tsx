import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, Input } from "../lib/ui";

export default function Signup() {
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
      await api.signup(email, password);
      nav("/login");
    } catch (e: any) {
      setErr(e.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Sign up">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>
          Email
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password (min 8 chars)
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} />
        </label>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <Button disabled={busy} type="submit">{busy ? "Creating..." : "Create account"}</Button>
        <div>Already have an account? <Link to="/login">Login</Link></div>
      </form>
    </Card>
  );
}
