"use client";

import { MilkdownEditor, type ImageUploadFunction } from "@/registry/plainspoken/ui/milkdown-editor";

/** A pretend upload: three seconds of progress, then the picture's object URL; "fail" in the file name fails */
const fakeUpload: ImageUploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let done = 0;
    const timer = setInterval(() => {
      done += 0.1;
      onProgress(done);
      if (done >= 1) {
        clearInterval(timer);
        if (/fail/i.test(file.name)) reject(new Error("the server said no"));
        else resolve(URL.createObjectURL(file));
      }
    }, 300);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(new DOMException("Canceled", "AbortError"));
    });
  });

const TEXT = `The new route for the Thursday run:

![A street map with a dashed red route from the depot to the drop](/demos/milkdown/route-map.svg)

Paste or drop a picture here, or use the picture button.`;

/**
 * Pictures upload through onUploadImage: each shows faded, with its progress and a Cancel button
 * under the text, until the URL comes back, and screen readers hear when it is done. Select a
 * picture to write its alt text or remove it. A file with "fail" in its name fails, to show the error.
 */
export default function MilkdownEditorImages() {
  return <MilkdownEditor aria-label="Route notes" defaultValue={TEXT} onUploadImage={fakeUpload} className="max-w-2xl" />;
}
