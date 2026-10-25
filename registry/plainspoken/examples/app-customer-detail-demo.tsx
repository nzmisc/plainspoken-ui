import { customerById } from "@/registry/plainspoken/blocks/app/data";
import { AppCustomerDetail } from "@/registry/plainspoken/blocks/app/customer-detail";

/** A customer's numbers and tabs; Invoices, Projects and Activity each say how many are in them. */
export default function AppCustomerDetailDemo() {
  return <AppCustomerDetail customer={customerById("lumen-dental")!} />;
}
