import React from "react";

export function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>{props.title}</h2>
      {props.children}
    </div>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #aaa",
        background: "#fff",
        cursor: "pointer",
        ...(props.style ?? {}),
      }}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        padding: 8,
        borderRadius: 10,
        border: "1px solid #aaa",
        width: "100%",
        boxSizing: "border-box",
      }}
    />
  );
}
