import React from "react";

export function Badge({ text, map }: { text: string; map: Record<string, { bg: string; color: string }> }) {
  const key = text.replace(/\s+/g, "_");
  const style = map[key] ?? map[text] ?? { bg: "#F2F4F7", color: "#344054" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}
