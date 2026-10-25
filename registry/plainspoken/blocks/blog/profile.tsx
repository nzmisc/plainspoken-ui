import { useId, type ReactNode } from "react";
import type { Glyph } from "@/registry/plainspoken/lib/icons";
import { DescriptionItem, DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface BlogProfileContact {
  label: string;
  /** What is shown: an address, a handle, a place */
  value: string;
  /** Leave out for something that isn't a link (a city) */
  href?: string;
  icon?: Glyph;
}

export interface BlogProfileProps {
  name: string;
  /** One line under the name: job, place */
  role?: ReactNode;
  /** BlogPortrait or an <img> */
  portrait?: ReactNode;
  /** The bio: a few paragraphs */
  children: ReactNode;
  /** Where else to find you, as term and value pairs */
  contacts?: BlogProfileContact[];
  /** Heading over the contacts. Default "Elsewhere". */
  contactsTitle?: string;
  className?: string;
}

/**
 * The top of an About page: portrait, name and role, a few paragraphs of bio, then where else to
 * find you as a description list (email, code, feed, city). Links in the bio and the contacts are
 * real links, blue and underlined.
 */
export function BlogProfile({ name, role, portrait, children, contacts, contactsTitle = "Elsewhere", className }: BlogProfileProps) {
  const headingId = useId();
  return (
    <div data-slot="blog-profile" className={cn("flex flex-col gap-6", className)}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {portrait}
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-bold">{name}</h1>
          {role != null && <p className="text-[16px] text-muted-foreground">{role}</p>}
        </div>
      </header>
      <div className="flex max-w-[68ch] flex-col gap-3 text-[16px] leading-relaxed [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2 [&_a:visited]:text-link-visited">
        {children}
      </div>
      {contacts && contacts.length > 0 && (
        <section aria-labelledby={headingId} className="flex flex-col gap-2">
          <h2 id={headingId} className="text-[18px] font-bold">
            {contactsTitle}
          </h2>
          <DescriptionList divided className="max-w-[68ch]">
            {contacts.map((c) => (
              <DescriptionItem
                key={c.label}
                term={
                  <span className="inline-flex items-center gap-1.5">
                    {c.icon && <Icon icon={c.icon} />}
                    {c.label}
                  </span>
                }
              >
                {c.href ? (
                  <a href={c.href} className="break-all text-link underline underline-offset-2 visited:text-link-visited">
                    {c.value}
                  </a>
                ) : (
                  c.value
                )}
              </DescriptionItem>
            ))}
          </DescriptionList>
        </section>
      )}
    </div>
  );
}
