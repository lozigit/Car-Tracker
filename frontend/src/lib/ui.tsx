import React from "react";

// This file contains simple reusable UI components used across the app, like cards, buttons, inputs, etc.
// They are intentionally very basic and unstyled, just to provide some consistent structure and spacing without relying on external libraries or complex CSS.
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

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        padding: 8,
        borderRadius: 10,
        border: "1px solid #aaa",
        width: "100%",
        boxSizing: "border-box",
        minHeight: 90,
        fontFamily: "system-ui",
      }}
    />
  );
}

export function Pill(props: { text: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tone = props.tone ?? "neutral";
  const bg =
    tone === "good" ? "#e7f5e8" : tone === "warn" ? "#fff4dd" : tone === "bad" ? "#ffe4e4" : "#f2f2f2";
  const border = tone === "neutral" ? "#ddd" : tone === "good" ? "#b5e2b9" : tone === "warn" ? "#f0d59a" : "#f0a7a7";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        fontSize: 12,
      }}
    >
      {props.text}
    </span>
  );
}
