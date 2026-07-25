import React, { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { COLORS, TYPE, cardStyle, primaryBtn, ghostBtn } from "../../theme/tokens";

// A small, direct edit panel for the single line the person tapped on.
// Deliberately not a full-screen modal — it should feel like editing the
// video itself, not leaving the preview.
export default function LyricLineEditor({ lineIndex, value, onSave, onCancel }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [lineIndex]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave(textareaRef.current.value.trim());
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      role="dialog"
      aria-label={`Edit lyric line ${lineIndex + 1}`}
      style={{
        ...cardStyle,
        position: "absolute",
        left: "50%",
        bottom: -14,
        transform: "translate(-50%, 100%)",
        width: "min(100%, 380px)",
        padding: 16,
        zIndex: 5,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontFamily: TYPE.body, fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
        Editing line {lineIndex + 1}
      </div>
      <textarea
        ref={textareaRef}
        defaultValue={value}
        onKeyDown={handleKeyDown}
        rows={2}
        style={{
          width: "100%", boxSizing: "border-box", resize: "none", padding: "10px 12px",
          borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.background,
          color: COLORS.textPrimary, fontFamily: TYPE.body, fontSize: 14, lineHeight: 1.4,
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={onCancel} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}>
          <X size={14} /> Cancel
        </button>
        <button
          onClick={() => onSave(textareaRef.current.value.trim())}
          style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
        >
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  );
}
