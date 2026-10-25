import { DemoBar } from "@/components/site/demo-bar";
import { ThemeToggle } from "@/components/site/theme";
import { AppFrame } from "@/registry/plainspoken/blocks/app/frame";

export default function AppSkeletonLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="app" />
      <AppFrame actions={<ThemeToggle size="sm" />} className="h-[calc(100dvh-var(--demo-bar))]">
        {children}
      </AppFrame>
    </>
  );
}
