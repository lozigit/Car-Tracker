import React, { useEffect, useState } from "react";
import { api, ReminderPreferences, RenewalKind } from "../lib/api";
import { Button, Card, Input } from "../lib/ui";

const kinds: RenewalKind[] = ["INSURANCE", "MOT", "TAX"];

function labelFor(k: RenewalKind) {
  if (k === "MOT") return "MOT";
  if (k === "TAX") return "Vehicle tax";
  return "Insurance";
}

function parseOffsets(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0) throw new Error("Offsets must be numbers >= 0");
      return Math.floor(n);
    });
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [raw, setRaw] = useState<Record<RenewalKind, string>>({
    INSURANCE: "",
    MOT: "",
    TAX: "",
  });

  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const prefs = await api.getReminderPreferences();
      const next: Record<RenewalKind, string> = { ...raw };
      for (const k of kinds) {
        next[k] = (prefs.preferences?.[k] ?? []).join(", ");
      }
      setRaw(next);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const preferences = {
        INSURANCE: parseOffsets(raw.INSURANCE),
        MOT: parseOffsets(raw.MOT),
        TAX: parseOffsets(raw.TAX),
      } as ReminderPreferences["preferences"];

      const payload: ReminderPreferences = { preferences };
      await api.saveReminderPreferences(payload);
      setOk("Saved.");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Settings">
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Reminder offsets are the number of days before expiry when you want to be reminded (for example: <b>30, 7, 1</b>).
      </p>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={save} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          {kinds.map((k) => (
            <label key={k}>
              {labelFor(k)} offsets (days)
              <Input value={raw[k]} onChange={(e) => setRaw({ ...raw, [k]: e.target.value })} placeholder="e.g. 30, 7, 1" />
            </label>
          ))}

          {err && <div style={{ color: "crimson" }}>{err}</div>}
          {ok && <div style={{ color: "green" }}>{ok}</div>}
          <Button disabled={busy} type="submit">
            {busy ? "Saving..." : "Save"}
          </Button>
        </form>
      )}

      <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
        Phase 2 note: these settings are stored per-user. Per-car overrides come later.
      </div>
    </Card>
  );
}
