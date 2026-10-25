import { DemoBar } from "@/components/site/demo-bar";

export default function ConflictsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="conflicts" />
      {children}
    </>
  );
}
