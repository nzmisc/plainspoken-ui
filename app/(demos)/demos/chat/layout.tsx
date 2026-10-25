import { DemoBar } from "@/components/site/demo-bar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="chat" />
      {children}
    </>
  );
}
