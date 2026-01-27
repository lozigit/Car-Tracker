import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, Input } from "../lib/ui";

type Car = {
  id: string;
  registration_number: string;
  make?: string | null;
  model?: string | null;
  is_archived: boolean;
};

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState<Car | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [vrm, setVrm] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  async function load() {
    if (!id) return;
    setErr(null);
    try {
      const c = (await api.getCar(id)) as Car;
      setCar(c);
      setVrm(c.registration_number);
      setMake(c.make ?? "");
      setModel(c.model ?? "");
    } catch (e: any) {
      setErr(e.message ?? "Failed to load car");
    }
  }

  useEffect(() => { load(); }, [id]);

  async function save(e: React.FormEvent) {
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

  return (
    <Card title="Car detail">
      <div style={{ marginBottom: 12 }}><Link to="/">&larr; Back to dashboard</Link></div>
      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
      {!car ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>Status: <b>{car.is_archived ? "Archived" : "Active"}</b></div>
          <form onSubmit={save} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
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
  );
}
