import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, RenewalKind, RenewalOut } from "../lib/api";
import { Button, Card, Input, Pill } from "../lib/ui";

type Car = {
  id: string;
  registration_number: string;
  make?: string | null;
  model?: string | null;
  is_archived: boolean;
};

const KINDS: RenewalKind[] = ["INSURANCE", "MOT", "TAX"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCurrent(r: RenewalOut): boolean {
  const t = todayISO();
  return r.valid_from <= t && t <= r.valid_to;
}

function fmtMoneyPence(p?: number | null): string {
  if (p == null) return "";
  return `£${(p / 100).toFixed(2)}`;
}

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState<Car | null>(null);
  const [renewals, setRenewals] = useState<RenewalOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [vrm, setVrm] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  // per-kind add form state
  const [form, setForm] = useState<Record<string, any>>({
    INSURANCE: { valid_from: "", valid_to: "", provider: "", reference: "", cost_pence: "", notes: "" },
    MOT: { valid_from: "", valid_to: "", provider: "", reference: "", cost_pence: "", notes: "" },
    TAX: { valid_from: "", valid_to: "", provider: "", reference: "", cost_pence: "", notes: "" },
  });

  async function load() {
    if (!id) return;
    setErr(null);
    try {
      const c = (await api.getCar(id)) as Car;
      setCar(c);
      setVrm(c.registration_number);
      setMake(c.make ?? "");
      setModel(c.model ?? "");

      const rs = await api.listRenewals(id);
      setRenewals(rs);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load car");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveCar(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    setErr(null);
    try {
      const updated = (await api.updateCar(id, {
        registration_number: vrm,
        make: make || null,
        model: model || null,
      })) as Car;
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
      const updated = (car.is_archived ? await api.unarchiveCar(id) : await api.archiveCar(id)) as Car;
      setCar(updated);
    } catch (e: any) {
      setErr(e.message ?? "Failed to update archive status");
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const g: Record<string, RenewalOut[]> = { INSURANCE: [], MOT: [], TAX: [] };
    for (const r of renewals) g[r.kind].push(r);
    for (const k of KINDS) g[k].sort((a, b) => (a.valid_to < b.valid_to ? 1 : -1));
    return g;
  }, [renewals]);

  function currentFor(kind: RenewalKind): RenewalOut | null {
    const rs = grouped[kind].filter(isCurrent);
    if (rs.length === 0) return null;
    return rs.sort((a, b) => (a.valid_to < b.valid_to ? 1 : -1))[0];
    // max valid_to
  }

  async function deleteRenewal(rid: string) {
    setBusy(true);
    setErr(null);
    try {
      await api.deleteRenewal(rid);
      if (id) setRenewals(await api.listRenewals(id));
    } catch (e: any) {
      setErr(e.message ?? "Failed to delete renewal");
    } finally {
      setBusy(false);
    }
  }

  async function addRenewal(kind: RenewalKind) {
    if (!id) return;
    setBusy(true);
    setErr(null);
    try {
      const f = form[kind];
      const payload: any = {
        kind,
        valid_from: f.valid_from,
        valid_to: f.valid_to,
        provider: f.provider || null,
        reference: f.reference || null,
        notes: f.notes || null,
      };
      if (f.cost_pence) payload.cost_pence = Math.round(Number(f.cost_pence) * 100);

      await api.createRenewal(id, payload);

      // clear form
      setForm({
        ...form,
        [kind]: { valid_from: "", valid_to: "", provider: "", reference: "", cost_pence: "", notes: "" },
      });

      setRenewals(await api.listRenewals(id));
    } catch (e: any) {
      setErr(e.message ?? "Failed to add renewal");
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
            <div style={{ marginBottom: 12 }}>
              Status: <b>{car.is_archived ? "Archived" : "Active"}</b>
            </div>

            <form onSubmit={saveCar} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
              <label>VRM
                <Input value={vrm} onChange={(e) => setVrm(e.target.value)} required />
              </label>
              <label>Make
                <Input value={make} onChange={(e) => setMake(e.target.value)} />
              </label>
              <label>Model
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
        {!car ? (
          <div>Loading...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {KINDS.map((k) => {
              const cur = currentFor(k);
              return (
                <div key={k} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>{k}</h3>
                    {cur ? (
                      <Pill title={`Valid from ${cur.valid_from}`}>Current until {cur.valid_to}</Pill>
                    ) : (
                      <Pill>Missing</Pill>
                    )}
                  </div>

                  {grouped[k].length === 0 ? (
                    <div style={{ opacity: 0.7, marginTop: 8 }}>No records yet.</div>
                  ) : (
                    <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                      {grouped[k].map((r) => (
                        <li key={r.id} style={{ marginBottom: 6 }}>
                          <b>{r.valid_from}</b> → <b>{r.valid_to}</b>{" "}
                          {r.provider ? ` • ${r.provider}` : ""}{" "}
                          {r.reference ? ` • ${r.reference}` : ""}{" "}
                          {r.cost_pence != null ? ` • ${fmtMoneyPence(r.cost_pence)}` : ""}{" "}
                          {isCurrent(r) ? <Pill>Current</Pill> : <span />}
                          <Button
                            style={{ marginLeft: 10 }}
                            disabled={busy}
                            type="button"
                            onClick={() => deleteRenewal(r.id)}
                          >
                            Delete
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: "pointer" }}>Add {k} record</summary>
                    <div style={{ display: "grid", gap: 10, marginTop: 10, maxWidth: 520 }}>
                      <label>Valid from (YYYY-MM-DD)
                        <Input value={form[k].valid_from} onChange={(e) => setForm({ ...form, [k]: { ...form[k], valid_from: e.target.value } })} />
                      </label>
                      <label>Valid to (YYYY-MM-DD)
                        <Input value={form[k].valid_to} onChange={(e) => setForm({ ...form, [k]: { ...form[k], valid_to: e.target.value } })} />
                      </label>
                      <label>Provider (optional)
                        <Input value={form[k].provider} onChange={(e) => setForm({ ...form, [k]: { ...form[k], provider: e.target.value } })} />
                      </label>
                      <label>Reference / policy (optional)
                        <Input value={form[k].reference} onChange={(e) => setForm({ ...form, [k]: { ...form[k], reference: e.target.value } })} />
                      </label>
                      <label>Cost (£) (optional)
                        <Input value={form[k].cost_pence} onChange={(e) => setForm({ ...form, [k]: { ...form[k], cost_pence: e.target.value } })} />
                      </label>
                      <label>Notes (optional)
                        <Input value={form[k].notes} onChange={(e) => setForm({ ...form, [k]: { ...form[k], notes: e.target.value } })} />
                      </label>
                      <Button disabled={busy} type="button" onClick={() => addRenewal(k)}>
                        {busy ? "Saving..." : "Add record"}
                      </Button>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
