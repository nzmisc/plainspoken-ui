import { DemoBar } from "@/components/site/demo-bar";
import { Toaster } from "@/registry/plainspoken/ui/toast";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="chat" />
      {children}
      <Toaster />
    </>
  );
}
