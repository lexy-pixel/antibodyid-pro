import { useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

type Tone = "success" | "warning" | "danger" | "neutral";

const LIGHT = {
  bg: { base: "#ffffff", subtle: "#eef2f6" },
  text: {
    primary: "#142033",
    secondary: "#5B6B7F",
    tertiary: "#8b97a8",
    danger: "#B42318",
    warning: "#A15C00",
  },
  border: { subtle: "#e6ebf1", default: "#cfd6df" },
  font: { family: '"Source Sans 3", "Segoe UI", "Helvetica Neue", Arial, sans-serif', table: { fontSize: 12 } },
  weight: { regular: 400, medium: 500, semibold: 600 },
};

const DARK = {
  bg: { base: "#141b24", subtle: "#243140" },
  text: {
    primary: "#e8eef5",
    secondary: "#b7c3d2",
    tertiary: "#8b9aab",
    danger: "#ff8a80",
    warning: "#ffc46b",
  },
  border: { subtle: "#2c3a4b", default: "#42556c" },
  font: LIGHT.font,
  weight: LIGHT.weight,
};

function systemDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeDataset(printing: boolean, dark: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = printing || !dark ? "light" : "dark";
}

/** Theme tokens used by the ported worksheet. Follows the OS appearance, and switches to light while printing so grades and text stay readable. */
export function useGrokTheme() {
  const [dark, setDark] = useState(systemDark);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => setDark(mq.matches);
    const onBefore = () => {
      applyThemeDataset(true, mq.matches);
      flushSync(() => setPrinting(true));
    };
    const onAfter = () => {
      const next = mq.matches;
      applyThemeDataset(false, next);
      flushSync(() => setPrinting(false));
    };
    mq.addEventListener("change", onMq);
    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    applyThemeDataset(false, mq.matches);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
    };
  }, []);

  useEffect(() => {
    applyThemeDataset(printing, dark);
  }, [dark, printing]);

  return printing || !dark ? LIGHT : DARK;
}

export function Page({ title, summary, width, children }: { title: string; summary?: string; width?: string; children?: ReactNode }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return (
    <div className={`page page-${width ?? "wide"}`}>
      {summary ? <p className="page-summary">{summary}</p> : null}
      {children}
    </div>
  );
}

export function Section({
  heading,
  caption,
  collapsible,
  defaultOpen,
  children,
}: {
  heading?: string;
  caption?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const shown = !collapsible || open;
  return (
    <section className="section">
      {collapsible ? (
        <div
          className="section-toggle"
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((v) => !v);
            }
          }}
        >
          <span className="chev" aria-hidden="true">{open ? "▾" : "▸"}</span>
          <h2>{heading}</h2>
        </div>
      ) : (
        heading ? <h2>{heading}</h2> : null
      )}
      {caption ? <p className="caption">{caption}</p> : null}
      {shown ? <div className="section-body">{children}</div> : null}
    </section>
  );
}

export function Text({ children }: { children?: ReactNode }) {
  return <p className="prose">{children}</p>;
}

export function Callout({ tone, lead, children }: { tone?: "warning" | "info" | "danger"; lead?: string; children?: ReactNode }) {
  return (
    <div className={`callout callout-${tone ?? "info"}`} role={tone === "danger" || tone === "warning" ? "note" : undefined}>
      {lead ? <strong className="lead">{lead}</strong> : null}
      {children}
    </div>
  );
}

type Opt = string | { value: string; label: string };

export function Select({ label, options, value, onChange }: { label: string; options: readonly Opt[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const text = typeof o === "string" ? o : o.label;
          return (
            <option key={v} value={v}>
              {text}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={disabled ? "toggle disabled" : "toggle"}>
      <input type="checkbox" checked={value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function Button({ label, onClick, variant }: { label: string; onClick?: () => void; variant?: "primary" }) {
  return (
    <button type="button" className={variant === "primary" ? "btn primary" : "btn"} onClick={onClick}>
      {label}
    </button>
  );
}

export function Status({ label, tone }: { label: string; tone?: string }) {
  const name: Tone = tone === "success" || tone === "warning" || tone === "danger" ? tone : "neutral";
  return <span className={`status status-${name}`}>{label}</span>;
}

function isToneCell(cell: unknown): cell is { text: ReactNode; tone?: string } {
  return !!cell && typeof cell === "object" && !("$$typeof" in cell) && "text" in cell;
}

export function Table({ columns, rows }: { columns: readonly string[]; rows: readonly (readonly unknown[])[] }) {
  return (
    <div className="table-scroll">
      <table className="data">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={i === 0 ? "sticky" : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => {
                if (isToneCell(cell)) {
                  const tone = cell.tone === "success" || cell.tone === "warning" || cell.tone === "danger" ? cell.tone : "neutral";
                  return (
                    <td key={ci} className={ci === 0 ? "sticky" : undefined}>
                      <span className={`tone tone-${tone}`}>{cell.text}</span>
                    </td>
                  );
                }
                return (
                  <td key={ci} className={ci === 0 ? "sticky" : undefined}>
                    {cell as ReactNode}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Rows({
  rows,
}: {
  rows: readonly {
    title: string;
    detail?: ReactNode;
    meta?: ReactNode;
    status?: { label: string; tone?: string };
  }[];
}) {
  return (
    <div className="rows">
      {rows.map((r, i) => (
        <div className="kv" key={i}>
          <div className="kv-title">{r.title}</div>
          <div className="kv-detail">
            {r.detail}
            {r.status ? <Status label={r.status.label} tone={r.status.tone} /> : null}
          </div>
          {r.meta ? <div className="kv-meta">{r.meta}</div> : <div className="kv-meta" />}
        </div>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange }: { options: readonly { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="field field-grow">
      <span className="field-label">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
