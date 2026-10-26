import { DemoBar } from "@/components/site/demo-bar";

export default function GridLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="grid" />
      {children}
    </>
  );
}
