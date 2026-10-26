import { DemoBar } from "@/components/site/demo-bar";

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="mail" />
      {children}
    </>
  );
}
