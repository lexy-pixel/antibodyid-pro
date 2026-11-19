/** Site chrome only. The worksheets themselves are the canvas sources unchanged. */
export function ToolNav({ current }: { current: "pro" | "bells" }) {
  const base = import.meta.env.BASE_URL;
  return (
    <nav className="toolnav noprint" aria-label="Tools">
      <a href={base} aria-current={current === "pro" ? "page" : undefined}>
        AntibodyID Pro
      </a>
      <a href={`${base}bells-and-whistles/`} aria-current={current === "bells" ? "page" : undefined}>
        Antibody Rule-Out Tool: Bells and Whistles for Schneck
      </a>
    </nav>
  );
}
