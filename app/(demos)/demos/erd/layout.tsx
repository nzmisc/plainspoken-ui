import { DemoBar } from "@/components/site/demo-bar";

export default function ErdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="erd" />
      {children}
    </>
  );
}
