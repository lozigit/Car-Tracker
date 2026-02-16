import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Car, UpcomingRenewalOut } from "../lib/api";
import { Button, Card, Input, Pill } from "../lib/ui";

function fmtKind(k: UpcomingRenewalOut["kind"]) {
  if (k === "MOT") return "MOT";
  if (k === "TAX") return "Vehicle tax";
  return "Insurance";
}

function fmtUpcoming(r: UpcomingRenewalOut): { title: string; pill: { text: string; tone: "neutral" | "good" | "warn" | "bad" } } {
  if (r.status === "missing") return { title: "No record", pill: { text: "Missing", tone: "bad" } };
  if (r.status === "overdue") return { title: `Expired on ${r.due_date ?? "?"}`, pill: { text: `${Math.abs(r.days_until ?? 0)}d overdue`, tone: "bad" } };
  if (r.status === "due") {
    const days = r.days_until ?? 0;
    const tone = days <= 7 ? "warn" : "neutral";
    return { title: `Due on ${r.due_date ?? "?"}`, pill: { text: `${days}d`, tone } };
  };
  return { title: `No data`, pill: { text: "Undefined", tone: "neutral" } };
}

export default function Dashboard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingRenewalOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [vrm, setVrm] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const [addCarOpen, setAddCarOpen] = useState(false);

  async function refresh() {
    setErr(null);
    try {
      const [carsData, upcomingData] = await Promise.all([
        api.listCars(false),
        api.upcomingRenewals(60).catch(() => [] as UpcomingRenewalOut[]),
      ]);
      setCars(carsData);
      setUpcoming(upcomingData);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addCar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.createCar({ registration_number: vrm, make, model });
      setVrm("");
      setMake("");
      setModel("");
      await refresh();
    } catch (e: any) {
      setErr(e.message ?? "Failed to create car");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>



      <Card title="Your cars">
        {cars.length === 0 && <div>No cars yet.</div>}
        <ul style={{ paddingLeft: 18 }}>
          {cars.map((c) => (
            <li key={c.id}>
              <Link to={`/cars/${c.id}`}>{c.registration_number}</Link> {c.make ? `— ${c.make}` : ""} {c.model ? c.model : ""}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Add a car">
      {!addCarOpen ? (
        <Button type="button" onClick={() => setAddCarOpen(true)}>
          Add a car
        </Button>
      ) : (
    <form onSubmit={addCar} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <label>
        Registration number (VRM)
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

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Button disabled={busy} type="submit">
          {busy ? "Adding..." : "Add car"}
        </Button>
        <Button
          type="button"
          disabled={busy}
          onClick={() => {
            setAddCarOpen(false);
            setErr(null);
            setVrm("");
            setMake("");
            setModel("");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )}
</Card>


      <Card title="Renewals Status">
        {upcoming.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No upcoming items (or you haven&apos;t added any renewals yet).</div>
        ) : (
          <ul style={{ paddingLeft: 18, marginTop: 0 }}>
            {upcoming.slice(0, 12).map((r, idx) => {
              const u = fmtUpcoming(r);
              return (
                <li key={`${r.car_id}-${r.kind}-${idx}`} style={{ marginBottom: 6 }}>
                  <Link to={`/cars/${r.car_id}`}>{r.car_registration_number}</Link> — {fmtKind(r.kind)}: {u.title} <Pill text={u.pill.text} tone={u.pill.tone} />
                </li>
              );
            })}
          </ul>
        )}
        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
          Tip: add renewals inside a car record to make this list useful.
        </div>
      </Card>



    </>
  );
}
