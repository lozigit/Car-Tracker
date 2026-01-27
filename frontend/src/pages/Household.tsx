import React, { useState } from "react";
import { api } from "../lib/api";
import { Button, Card, Input } from "../lib/ui";

export default function Household(props: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api.createHousehold(name);
      props.onCreated();
    } catch (e: any) {
      setErr(e.message ?? "Failed to create household");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Create your household">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label>
          Household name
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <Button disabled={busy} type="submit">{busy ? "Creating..." : "Create household"}</Button>
      </form>
    </Card>
  );
}
