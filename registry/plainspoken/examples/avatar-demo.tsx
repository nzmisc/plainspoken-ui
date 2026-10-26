import { Avatar } from "@/registry/plainspoken/ui/avatar";

// A stand-in photo, so the example needs no image file: hills under a sky
const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#9cc3e6"/><circle cx="34" cy="14" r="6" fill="#f5d76e"/><path d="M0 34 L14 22 L26 32 L36 24 L48 32 V48 H0Z" fill="#5f8f5a"/></svg>`,
  );

/** Initials on a colour picked from the name, or a picture over them. A picture that fails to load leaves the initials. */
export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar name="Amara Okafor" size={20} />
      <Avatar name="Jonas Weber" size={24} />
      <Avatar name="Li Wei" />
      <Avatar name="María González" size={36} />
      <Avatar name="build-runner-03" size={36} />
      <Avatar name="Noah Fischer" size={48} src={PHOTO} />
      <Avatar name="Sofia Rossi" size={48} src="/missing-photo.jpg" />
    </div>
  );
}
