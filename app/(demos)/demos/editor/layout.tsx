import { DemoBar } from "@/components/site/demo-bar";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="editor" />
      {children}
    </>
  );
}
