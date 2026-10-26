import { DemoBar } from "@/components/site/demo-bar";

export default function MilkdownLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="milkdown" />
      {children}
    </>
  );
}
