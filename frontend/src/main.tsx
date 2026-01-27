import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>CAR TRACK</h1>
      <p>Phase 0 scaffold is running (no <code>uv</code>).</p>
      <p>
        Backend health: <a href="http://localhost:8000/health">/health</a>
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
