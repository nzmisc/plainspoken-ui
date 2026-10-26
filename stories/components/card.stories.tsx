import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Ellipsis } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";

const meta = {
  title: "Components/Layout/Card",
  component: Card,
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every part: header with title, description and action; content; footer. */
export const Full: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Billed yearly · renews 1 March 2027</CardDescription>
        <CardAction>
          <IconButton variant="ghost" icon={Ellipsis} label="Plan options" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>10 seats, 9 in use. 50 GB of storage.</p>
      </CardContent>
      <CardFooter>
        <Button variant="primary">Add seats</Button>
        <Button>Change plan</Button>
      </CardFooter>
    </Card>
  ),
};

export const HeaderOnly: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>On since 2 March 2026, with an authenticator app.</CardDescription>
      </CardHeader>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>A card is just a bordered box when you only put content in it.</p>
      </CardContent>
    </Card>
  ),
};

/** A long title wraps beside the action. */
export const LongTitle: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>A long card title that needs two lines at this width</CardTitle>
        <CardDescription>Description.</CardDescription>
        <CardAction>
          <Button>Edit</Button>
        </CardAction>
      </CardHeader>
      <CardContent>Body.</CardContent>
    </Card>
  ),
};
