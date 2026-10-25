import { Tabs } from "@/registry/plainspoken/ui/tabs";

/** variant="plain": an underlined strip over content that isn't boxed. The chosen tab turns bold without moving the others. */
export default function TabsPlain() {
  return (
    <Tabs
      label="Account"
      variant="plain"
      className="max-w-xl"
      tabs={[
        { id: "profile", label: "Profile", content: <p>Name, photo and the email address people see.</p> },
        { id: "security", label: "Security", content: <p>Password, passkeys and the devices signed in.</p> },
        { id: "notifications", label: "Notifications", count: 3, content: <p>What we email you about, and how often.</p> },
      ]}
    />
  );
}
