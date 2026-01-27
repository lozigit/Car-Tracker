import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, Input } from "../lib/ui";

type Car = {
  id: string;
  registration_number: string;
  make?: string | null;
  model?: string | null;
  is_archived: boolean;
};

export default function Dashboard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [vrm, setVrm] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  async function refresh() {
    setErr(null);
    try {
      const data = await api.listCars(false);
      setCars(data as Car[]);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load cars");
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
      setVrm(""); setMake(""); setModel("");
      await refresh();
    } catch (e: any) {
      setErr(e.message ?? "Failed to create car");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card title="Add a car">
        <form onSubmit={addCar} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <label>Registration number (VRM)
            <Input value={vrm} onChange={(e) => setVrm(e.target.value)} required />
          </label>
          <label>Make
            <Input value={make} onChange={(e) => setMake(e.target.value)} />
          </label>
          <label>Model
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
          {err && <div style={{ color: "crimson" }}>{err}</div>}
          <Button disabled={busy} type="submit">{busy ? "Adding..." : "Add car"}</Button>
        </form>
      </Card>

      <Card title="Your cars">
        {cars.length === 0 && <div>No cars yet.</div>}
        <ul style={{ paddingLeft: 18 }}>
          {cars.map((c) => (
            <li key={c.id}>
              <Link to={`/cars/${c.id}`}>{c.registration_number}</Link>{" "}
              {c.make ? `— ${c.make}` : ""} {c.model ? c.model : ""}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
