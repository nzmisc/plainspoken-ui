import { Ellipsis } from "@/registry/plainspoken/lib/icons";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";

export default function CardDemo() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Billed yearly · renews 1 March 2027</CardDescription>
        <CardAction>
          <IconButton variant="ghost" icon={Ellipsis} label="Plan options" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-[24px] font-bold tabular-nums">
          €480 <span className="text-[14px] font-normal text-muted-foreground">a year</span>
        </p>
        <ul className="mt-2 list-disc pl-5 marker:text-muted-foreground">
          <li>10 seats, 9 in use</li>
          <li>50 GB of storage</li>
          <li>Priority support by email</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="primary">Add seats</Button>
        <Button>Change plan</Button>
        <Badge variant="success" className="ml-auto">
          Active
        </Badge>
      </CardFooter>
    </Card>
  );
}
