"use client";

import { useState } from "react";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";

/** Actions sit on the right and wrap below on narrow screens; onDismiss adds a × button. */
export default function AlertActions() {
  const [shown, setShown] = useState(true);
  if (!shown) return <Button onClick={() => setShown(true)}>Show the alert again</Button>;
  return (
    <Alert
      variant="warning"
      title="Your trial ends in 3 days"
      className="max-w-xl"
      actions={
        <>
          <Button>Compare plans</Button>
          <Button variant="primary">Upgrade</Button>
        </>
      }
      onDismiss={() => setShown(false)}
    >
      After that, projects become read-only until you choose a plan.
    </Alert>
  );
}
