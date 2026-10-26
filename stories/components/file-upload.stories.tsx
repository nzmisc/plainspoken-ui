import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Field } from "@/registry/plainspoken/ui/field";
import { FileField, FileUpload, formatSize, type UploadFunction, type UploadItem } from "@/registry/plainspoken/ui/file-upload";

const MiB = 1024 * 1024;

/**
 * A pretend server: sends at `speed` bytes a second (small files still take a moment, so the
 * progress shows) and fails any file with "fail" in its name once it is 60% through.
 */
function fakeUpload(speed = 2 * MiB): UploadFunction {
  return (file, { signal, onProgress }) =>
    new Promise((resolve, reject) => {
      let fraction = 0;
      const tick = 100;
      const timer = setInterval(() => {
        fraction = Math.min(1, fraction + Math.min(0.25, Math.max(0.04, (speed * tick) / 1000 / Math.max(1, file.size))));
        onProgress(fraction);
        if (fraction > 0.6 && /fail/i.test(file.name)) {
          clearInterval(timer);
          reject(new Error("the server answered 500"));
        } else if (fraction >= 1) {
          clearInterval(timer);
          resolve();
        }
      }, tick);
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        reject(signal.reason);
      });
    });
}

/** A File of `size` bytes, for rows that need one to retry or keep going */
const fileOf = (name: string, size: number, type: string) => new File([new Uint8Array(size)], name, { type });

const meta = {
  title: "Components/Forms/File upload",
  component: FileUpload,
  args: { label: "Attachments", maxSize: 10 * MiB, maxFiles: 8, upload: fakeUpload() },
  argTypes: { upload: { control: false }, defaultItems: { control: false }, onItemsChange: { control: false } },
  decorators: [
    (S) => (
      <div className="max-w-xl">
        <S />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Drop files on the box, use "Choose files…", or focus that button and paste. Nothing is sent
 * anywhere: the pretend server "uploads" at 2 MiB/s and fails any file with "fail" in its name.
 * A screen reader hears "2 files added, 1 refused." after each drop.
 */
export const Default: Story = {};

/** Type and size rules. A 12 MiB PNG or a .zip is refused with the reason. */
export const ImagesOnly: Story = { args: { label: "Screenshots", accept: "image/*,.pdf", maxSize: 5 * MiB } };

const states = (): UploadItem[] => [
  { id: "a", name: "storefront-homepage.png", size: 248_311, type: "image/png", status: "done", progress: 1 },
  { id: "b", name: "price-list-2026.json", size: 18_920, type: "application/json", status: "uploading", progress: 0.42, file: fileOf("price-list-2026.json", 18_920, "application/json") },
  { id: "c", name: "nginx.conf", size: 3_310, type: "", status: "failed", progress: 0.63, error: "the server answered 500", file: fileOf("nginx.conf", 3_310, "") },
  { id: "d", name: "screen-recording-2026-10-19.mov", size: 412 * MiB, type: "video/quicktime", status: "rejected", progress: 0, error: "Too large: 412 MiB, the limit is 10 MiB" },
  { id: "e", name: "notes.txt", size: 812, type: "text/plain", status: "canceled", progress: 0.2, file: fileOf("notes.txt", 812, "text/plain") },
  {
    id: "f",
    name: "a-very-long-file-name-that-has-to-wrap-somewhere-on-a-phone-screen-2026-10-19T12-00-00.log",
    size: 2.4 * MiB,
    type: "text/plain",
    status: "done",
    progress: 1,
  },
];

/** Every row state at once: uploaded, uploading (it keeps going), failed, refused, canceled, a long name. */
export const AllStates: Story = { args: { defaultItems: states(), upload: fakeUpload(4_000) } };

/** Drag a file anywhere over the page: a full-page overlay shows where it will go. */
export const PageWideDrop: Story = { args: { pageDrop: true } };

/** One file only: a new one replaces the old. */
export const SingleFile: Story = { args: { label: "SSH public key", multiple: false, accept: ".pub", maxSize: 16 * 1024 } };

/** Without an upload function: files are checked and kept as "Ready", for the form to send. */
export const WithoutUpload: Story = { args: { label: "Attachments", upload: undefined, name: "attachments", maxFiles: 3 } };

export const Disabled: Story = { args: { disabled: true } };

export const PhoneWidth: Story = {
  args: { defaultItems: states(), upload: fakeUpload(4_000) },
  decorators: [
    (S) => (
      <div className="w-[343px]">
        <S />
      </div>
    ),
  ],
};

/** FileField, the one-line variant for forms, in its states; the first two inside a Field. */
export const CompactField: StoryObj = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Field label="Avatar" hint="PNG or JPEG, up to 2 MiB">
        <FileField accept="image/png,image/jpeg" maxSize={2 * MiB} upload={fakeUpload()} />
      </Field>
      <Field label="Backup archive" error="Upload the archive before saving">
        <FileField accept=".tar.gz,.zip" upload={fakeUpload()} />
      </Field>
      <FileField
        label="Database dump"
        accept=".sql,.gz"
        upload={fakeUpload(20_000)}
        defaultItem={{ id: "x", name: "shop-2026-10-19.sql.gz", size: 1.3 * MiB, type: "application/gzip", status: "uploading", progress: 0.3, file: fileOf("shop-2026-10-19.sql.gz", 1.3 * MiB, "application/gzip") }}
      />
      <FileField
        label="Config"
        upload={fakeUpload()}
        defaultItem={{ id: "y", name: "xrdp.ini", size: 2_048, type: "", status: "failed", progress: 0.7, error: "the server answered 500", file: fileOf("xrdp.ini", 2_048, "") }}
      />
      <FileField label="Certificate" accept=".pem" upload={fakeUpload()} hint="PEM only. The old one stays until this one uploads." />
      <FileField label="Locked" disabled />
    </div>
  ),
};

/** A page that lists the files itself: uploaded files are handed over by onUploaded and leave the upload's own list. */
function HandOverDemo() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <div>
        <h3 className="font-bold">Attached to the card</h3>
        {files.length ? (
          <ul className="list-disc pl-5">
            {files.map((f) => (
              <li key={f.id}>
                {f.name}, <span className="tabular-nums">{formatSize(f.size)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Nothing yet.</p>
        )}
      </div>
      <FileUpload label="Add files" upload={fakeUpload()} clearOnDone onUploaded={(item) => setFiles((l) => [...l, item])} />
    </div>
  );
}

/**
 * `clearOnDone` with `onUploaded`: while a file uploads it is in the table with its progress;
 * once it is up, onUploaded hands it over and it leaves the table, to be listed where it now
 * belongs. The Kanban card's attachments work this way. Failed and refused files stay, with Retry.
 */
export const HandOver: StoryObj = { render: () => <HandOverDemo /> };
