"use client";

import { FileUpload, type UploadFunction } from "@/registry/plainspoken/ui/file-upload";

/**
 * Stands in for your server: "sends" at 1 MiB/s and fails any file with "fail" in its name. A
 * real one would use XMLHttpRequest, whose upload.onprogress gives the fraction sent.
 */
const fakeUpload: UploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let sent = 0;
    const step = Math.max(64 * 1024, file.size / 40);
    const timer = setInterval(() => {
      sent = Math.min(file.size, sent + step);
      onProgress(file.size ? sent / file.size : 1);
      if (/fail/i.test(file.name) && sent > file.size * 0.6) {
        clearInterval(timer);
        reject(new Error("the server answered 500"));
      } else if (sent >= file.size) {
        clearInterval(timer);
        resolve();
      }
    }, 60);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(signal.reason);
    });
  });

export default function FileUploadDemo() {
  return (
    <div className="max-w-xl">
      <FileUpload label="Receipts" accept="image/*,.pdf" maxSize={10 * 1024 * 1024} maxFiles={10} upload={fakeUpload} />
    </div>
  );
}
