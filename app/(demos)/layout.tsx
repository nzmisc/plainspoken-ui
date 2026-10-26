// Demos are whole apps with their own chrome: no site header or footer here. Each demo's own
// layout puts <DemoBar slug="…" /> on top and sets --demo-bar so full-height apps can subtract it.
export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ "--demo-bar": "29px" } as React.CSSProperties}>{children}</div>;
}
