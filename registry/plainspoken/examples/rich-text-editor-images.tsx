"use client";

import { RichTextEditor, type ImageUploadFunction } from "@/registry/plainspoken/ui/rich-text-editor";

/**
 * Stands in for your server: takes about two seconds, reporting progress, and fails any file with
 * "fail" in its name. A real one would send the file and resolve with the URL it is stored at.
 */
const fakeUpload: ImageUploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let done = 0;
    const timer = setInterval(() => {
      done += 0.1;
      onProgress(Math.min(1, done));
      if (/fail/i.test(file.name) && done > 0.5) {
        clearInterval(timer);
        reject(new Error("the server said no"));
      } else if (done >= 1) {
        clearInterval(timer);
        resolve(URL.createObjectURL(file));
      }
    }, 200);
    signal.addEventListener("abort", () => clearInterval(timer));
  });

const TEXT = `The studio, seen from the door:

![The studio: a long room with a window wall, two desks and a plant](/demos/editor/studio.svg)

Paste a screenshot here, drop a picture on the text, or use the picture button in the toolbar. Click a picture to write its alt text or remove it.`;

/**
 * Pictures: upload a file, give an address, paste or drop. While one uploads it shows faded with
 * its progress under the text, and the Markdown holds a placeholder; when your upload function
 * resolves, its URL takes the placeholder's place.
 */
export default function RichTextEditorImages() {
  return <RichTextEditor aria-label="Studio notes" defaultValue={TEXT} onUploadImage={fakeUpload} className="max-w-2xl" />;
}
