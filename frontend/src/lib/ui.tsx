import React from "react";

// This file contains simple reusable UI components used across the app, now styled with a premium dark-metal theme.
const palette = {
  panel: "linear-gradient(145deg, #1b1f25 0%, #101317 100%)",
  panelBorder: "#3a424b",
  text: "#f3f4f6",
  mutedText: "#b7bcc4",
  accent: "#c8a96b",
  accentDark: "#897248",
  inputBg: "#12161c",
  inputBorder: "#4b535e",
};

export function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: `1px solid ${palette.panelBorder}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 18,
        background: palette.panel,
        boxShadow: "0 18px 45px rgba(0, 0, 0, 0.28)",
        color: palette.text,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 14,
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontSize: "1rem",
          color: palette.accent,
        }}
      >
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        padding: "9px 14px",
        borderRadius: 10,
        border: `1px solid ${palette.accentDark}`,
        background: "linear-gradient(180deg, #d2b071 0%, #ad8f59 100%)",
        color: "#111",
        cursor: "pointer",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        transition: "filter 120ms ease",
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
        padding: 10,
        borderRadius: 10,
        border: `1px solid ${palette.inputBorder}`,
        width: "100%",
        boxSizing: "border-box",
        background: palette.inputBg,
        color: palette.text,
        marginTop: 6,
        ...(props.style ?? {}),
      }}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        padding: 10,
        borderRadius: 10,
        border: `1px solid ${palette.inputBorder}`,
        width: "100%",
        boxSizing: "border-box",
        minHeight: 90,
        fontFamily: "Avenir Next, Segoe UI, Roboto, system-ui, sans-serif",
        background: palette.inputBg,
        color: palette.text,
        marginTop: 6,
        ...(props.style ?? {}),
      }}
    />
  );
}

export function Pill(props: { text: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tone = props.tone ?? "neutral";
  const bg = tone === "good" ? "#173826" : tone === "warn" ? "#43331a" : tone === "bad" ? "#471f1f" : "#27303a";
  const border = tone === "neutral" ? "#516071" : tone === "good" ? "#2f7d4e" : tone === "warn" ? "#a7853c" : "#ac5555";
  const text = tone === "neutral" ? palette.mutedText : "#e8ecf2";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        fontSize: 12,
        letterSpacing: "0.03em",
        color: text,
      }}
    >
      {props.text}
    </span>
  );
}
