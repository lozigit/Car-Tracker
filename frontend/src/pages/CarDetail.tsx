import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, Car, RenewalCreate, RenewalKind, RenewalOut } from "../lib/api";
import { Button, Card, Input, Pill, Textarea } from "../lib/ui";

const kinds: RenewalKind[] = ["INSURANCE", "MOT", "TAX"];

function labelFor(k: RenewalKind) {
  if (k === "MOT") return "MOT";
  if (k === "TAX") return "Vehicle tax";
  return "Insurance";
}

function iso(d: Date) {
  // YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function statusForKind(rows: RenewalOut[]) {
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const current = rows.find((r) => {
    const from = parseDate(r.valid_from);
    const to = parseDate(r.valid_to);
    if (!from || !to) return false;
    return from <= t && t <= to;
  });
  if (current) {
    const to = parseDate(current.valid_to)!;
    const days = Math.ceil((to.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
    const tone = days <= 7 ? "warn" : "good";
    return { text: `Current (${days}d left)`, tone } as const;
  }
  const mostRecent = rows[0];
  if (mostRecent) {
    const to = parseDate(mostRecent.valid_to);
    if (to && to < t) {
      const days = Math.ceil((t.getTime() - to.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `Expired (${days}d ago)`, tone: "bad" } as const;
    }
  }
  return { text: "Missing", tone: "bad" } as const;
}

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState<Car | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [vrm, setVrm] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const [renewals, setRenewals] = useState<Record<RenewalKind, RenewalOut[]>>({
    INSURANCE: [],
    MOT: [],
    TAX: [],
  });

  const [forms, setForms] = useState<Record<RenewalKind, RenewalCreate>>({
    INSURANCE: { kind: "INSURANCE", valid_from: iso(new Date()), valid_to: iso(new Date()), provider: null, reference: null, cost_pence: null, notes: null },
    MOT: { kind: "MOT", valid_from: iso(new Date()), valid_to: iso(new Date()), provider: null, reference: null, cost_pence: null, notes: null },
    TAX: { kind: "TAX", valid_from: iso(new Date()), valid_to: iso(new Date()), provider: null, reference: null, cost_pence: null, notes: null },
  });

  async function load() {
    if (!id) return;
    setErr(null);
    try {
      const c = await api.getCar(id);
      setCar(c);
      setVrm(c.registration_number);
      setMake(c.make ?? "");
      setModel(c.model ?? "");

      const lists = await Promise.all(kinds.map((k) => api.listRenewals(id, k).catch(() => [] as RenewalOut[])));
      const next: Record<RenewalKind, RenewalOut[]> = { INSURANCE: lists[0], MOT: lists[1], TAX: lists[2] };
      setRenewals(next);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load car");
    }
  }

  useEffect(() => { load(); }, [id]);

  const status = useMemo(() => {
    return {
      INSURANCE: statusForKind(renewals.INSURANCE),
      MOT: statusForKind(renewals.MOT),
      TAX: statusForKind(renewals.TAX),
    };
  }, [renewals]);

  async function saveCar(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    setErr(null);
    try {
      const updated = await api.updateCar(id, {
        registration_number: vrm,
        make: make || null,
        model: model || null,
      });
      setCar(updated);
    } catch (e: any) {
      setErr(e.message ?? "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function toggleArchive() {
    if (!id || !car) return;
    setBusy(true);
    setErr(null);
    try {
      const updated = car.is_archived ? await api.unarchiveCar(id) : await api.archiveCar(id);
      setCar(updated);
    } catch (e: any) {
      setErr(e.message ?? "Failed to update archive status");
    } finally {
      setBusy(false);
    }
  }

  async function addRenewal(kind: RenewalKind) {
    if (!id) return;
    setBusy(true);
    setErr(null);
    try {
      await api.createRenewal(id, forms[kind]);
      const rows = await api.listRenewals(id, kind);
      setRenewals({ ...renewals, [kind]: rows });
    } catch (e: any) {
      setErr(e.message ?? "Failed to add renewal");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRenewal(kind: RenewalKind, renewalId: string) {
    if (!id) return;
    setBusy(true);
    setErr(null);
    try {
      await api.deleteRenewal(renewalId);
      const rows = await api.listRenewals(id, kind);
      setRenewals({ ...renewals, [kind]: rows });
    } catch (e: any) {
      setErr(e.message ?? "Failed to delete renewal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card title="Car detail">
        <div style={{ marginBottom: 12 }}><Link to="/">&larr; Back to dashboard</Link></div>
        {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
        {!car ? (
          <div>Loading...</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <div>Status: <b>{car.is_archived ? "Archived" : "Active"}</b></div>
              <Pill text={status.INSURANCE.text} tone={status.INSURANCE.tone} />
              <Pill text={status.MOT.text} tone={status.MOT.tone} />
              <Pill text={status.TAX.text} tone={status.TAX.tone} />
            </div>

            <form onSubmit={saveCar} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
              <label>
                VRM
                <Input value={vrm} onChange={(e) => setVrm(e.target.value)} required />
              </label>
              <label>
                Make
                <Input value={make} onChange={(e) => setMake(e.target.value)} />
              </label>
              <label>
                Model
                <Input value={model} onChange={(e) => setModel(e.target.value)} />
              </label>

              <div style={{ display: "flex", gap: 12 }}>
                <Button disabled={busy} type="submit">{busy ? "Saving..." : "Save"}</Button>
                <Button disabled={busy} type="button" onClick={toggleArchive}>
                  {car.is_archived ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>

      <Card title="Renewals">
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          Add renewal records over time. The app will treat the record whose date range includes today as the <b>current</b> one.
        </p>

        {kinds.map((k) => (
          <div key={k} style={{ borderTop: "1px solid #eee", paddingTop: 12, marginTop: 12 }}>
            <h3 style={{ margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: 10 }}>
              {labelFor(k)} <Pill text={status[k].text} tone={status[k].tone} />
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 720 }}>
              <label>
                Valid from
                <Input type="date" value={forms[k].valid_from} onChange={(e) => setForms({ ...forms, [k]: { ...forms[k], valid_from: e.target.value } })} />
              </label>
              <label>
                Valid to
                <Input type="date" value={forms[k].valid_to} onChange={(e) => setForms({ ...forms, [k]: { ...forms[k], valid_to: e.target.value } })} />
              </label>
              <label>
                Provider (optional)
                <Input value={forms[k].provider ?? ""} onChange={(e) => setForms({ ...forms, [k]: { ...forms[k], provider: e.target.value || null } })} />
              </label>
              <label>
                Reference (optional)
                <Input value={forms[k].reference ?? ""} onChange={(e) => setForms({ ...forms, [k]: { ...forms[k], reference: e.target.value || null } })} />
              </label>
              <label>
                Cost (pence, optional)
                <Input
                  inputMode="numeric"
                  value={forms[k].cost_pence?.toString() ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setForms({ ...forms, [k]: { ...forms[k], cost_pence: v ? Number(v) : null } });
                  }}
                />
              </label>
              <div />
              <label style={{ gridColumn: "1 / -1" }}>
                Notes (optional)
                <Textarea value={forms[k].notes ?? ""} onChange={(e) => setForms({ ...forms, [k]: { ...forms[k], notes: e.target.value || null } })} />
              </label>

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center" }}>
                <Button disabled={busy} type="button" onClick={() => addRenewal(k)}>
                  {busy ? "Working..." : "Add renewal"}
                </Button>
                <span style={{ opacity: 0.7, fontSize: 12 }}>Tip: for one-year policies, set valid_to 12 months after valid_from.</span>
              </div>
            </div>

            {renewals[k].length === 0 ? (
              <div style={{ marginTop: 8, opacity: 0.8 }}>No records yet.</div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>History</div>
                <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                  {renewals[k].map((r) => (
                    <li key={r.id} style={{ marginBottom: 6 }}>
                      {r.valid_from} → {r.valid_to}
                      {r.provider ? ` — ${r.provider}` : ""}
                      {typeof r.cost_pence === "number" ? ` — £${(r.cost_pence / 100).toFixed(2)}` : ""}
                      <Button
                        disabled={busy}
                        type="button"
                        onClick={() => deleteRenewal(k, r.id)}
                        style={{ marginLeft: 8, opacity: 0.8 }}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </Card>
    </>
  );
}
