import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";
import { api, getToken, setToken } from "./lib/api";
import { Button, Card, Pill } from "./lib/ui";
import CarDetail from "./pages/CarDetail";
import Dashboard from "./pages/Dashboard";
import Household from "./pages/Household";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";

function Layout(props: { children: React.ReactNode }) {
  const nav = useNavigate();
  const authed = !!getToken();

  function logout() {
    setToken(null);
    nav("/login");
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 18, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none" }}><h1 style={{ margin: 0 }}>CAR TRACK</h1></Link>
          <Pill text="Phase 2" />
          {authed && (
            <nav style={{ display: "flex", gap: 12, marginLeft: 12 }}>
              <Link to="/" style={{ textDecoration: "none" }}>Dashboard</Link>
              <Link to="/settings" style={{ textDecoration: "none" }}>Settings</Link>
            </nav>
          )}
        </div>
        <div>{authed ? <Button onClick={logout}>Logout</Button> : <span />}</div>
      </header>
      {props.children}
    </div>
  );
}

function RequireAuth(props: { children: React.ReactNode }) {
  const nav = useNavigate();
  useEffect(() => { if (!getToken()) nav("/login"); }, [nav]);
  return <>{props.children}</>;
}

function Home() {
  const [state, setState] = useState<"checking" | "needHousehold" | "ready">("checking");
  const [err, setErr] = useState<string | null>(null);

  async function check() {
    setErr(null);
    try {
      await api.getCurrentHousehold();
      setState("ready");
    } catch (e: any) {
      const msg = e.message ?? "Unknown error";
      if (msg.toLowerCase().includes("household")) setState("needHousehold");
      else setErr(msg);
    }
  }

  useEffect(() => { check(); }, []);

  if (state === "checking") return <Card title="Loading...">Checking setup...</Card>;
  if (err) return <Card title="Error">{err}</Card>;
  if (state === "needHousehold") return <Household onCreated={check} />;
  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/cars/:id" element={<RequireAuth><CarDetail /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="*" element={<Card title="Not found">Unknown route</Card>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
