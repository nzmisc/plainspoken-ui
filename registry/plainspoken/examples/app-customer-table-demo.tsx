import { AppCustomerTable } from "@/registry/plainspoken/blocks/app/customer-table";

/** Click a row for the customer's drawer; tick rows for the bulk action; Columns shows the hidden Email and Country. */
export default function AppCustomerTableDemo() {
  return <AppCustomerTable defaultSelected={["northwind-cycles", "meridian-architects"]} />;
}
