import { DemoBar } from "@/components/site/demo-bar";

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="budget" />
      {children}
    </>
  );
}
