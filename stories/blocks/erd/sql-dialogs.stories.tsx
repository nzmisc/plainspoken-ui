import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdExportDialog, ErdImportDialog } from "@/registry/plainspoken/blocks/erd/sql-dialogs";

/** Export: Copy and Download. Import: live checking; a click on a line number selects the line. */
const meta: Meta<typeof ErdExportDialog> = {
  title: "Blocks/ERD/SQL dialogs",
  component: ErdExportDialog,
  // A dialog open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  args: { open: true, onClose: () => {}, model: SHOP_MODEL },
  argTypes: { model: { control: false } },
  decorators: [(S) => <div className="min-h-[640px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ErdExportDialog>;

/** The shop as DDL. */
export const Export: Story = {};

/** Import, empty. */
export const Import: Story = { render: () => <ErdImportDialog open onClose={() => {}} onImport={() => {}} /> };

/** Import with mistakes: each problem with its line. */
export const ImportErrors: Story = {
  render: () => (
    <ErdImportDialog
      open
      onClose={() => {}}
      onImport={() => {}}
      defaultText={"CREATE TABLE authors (\n  id int PRIMARY KEY,\n  name\n);\nCREATE TABLE books (\n  id int PRIMARY KEY,\n  author_id int REFERENCES writers (id)\n);"}
    />
  ),
};

/** Import with skipped statements: CREATE EXTENSION and a function aren't part of a diagram. */
export const ImportNotes: Story = {
  render: () => (
    <ErdImportDialog
      open
      onClose={() => {}}
      onImport={() => {}}
      defaultText={"CREATE EXTENSION IF NOT EXISTS citext;\nCREATE TABLE tags (\n  id serial PRIMARY KEY,\n  name citext NOT NULL UNIQUE\n);\nCREATE FUNCTION touch() RETURNS trigger AS $$ BEGIN RETURN NEW; END $$ LANGUAGE plpgsql;"}
    />
  ),
};
