"use client";

import { FileField, type UploadFunction } from "@/registry/plainspoken/ui/file-upload";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";

const fakeUpload: UploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let fraction = 0;
    const timer = setInterval(() => {
      fraction = Math.min(1, fraction + 0.05);
      onProgress(fraction);
      if (fraction >= 1) {
        clearInterval(timer);
        resolve();
      }
    }, 80);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(signal.reason);
    });
  });

/**
 * FileField: one file on one line, for a form. Inside a Field it takes the label, hint and error
 * like an Input; on its own it has a label prop. Drop a file on the line, or choose one.
 */
export default function FileUploadField() {
  return (
    <form className="flex max-w-md flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <Field label="Display name">
        <Input defaultValue="Inês Carvalho" />
      </Field>
      <Field label="Profile photo" hint="PNG or JPEG, up to 2 MiB. Shown next to your comments.">
        <FileField accept="image/png,image/jpeg" maxSize={2 * 1024 * 1024} upload={fakeUpload} />
      </Field>
      <FileField label="Signed contract" accept=".pdf" upload={fakeUpload} />
    </form>
  );
}
