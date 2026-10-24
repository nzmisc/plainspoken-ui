import { Bell, Check, Inbox, Search, Settings, Star } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";

export default function IconDemo() {
  return (
    <div className="flex flex-col gap-3 text-[14px]">
      <p className="flex flex-wrap gap-4">
        {[Inbox, Search, Bell, Star, Settings, Check].map((g) => (
          <Icon key={g.name} icon={g} size={20} />
        ))}
      </p>
      <p>
        Icons sit on the text baseline: <Icon icon={Check} /> saved, <Icon icon={Bell} /> 3 new.
      </p>
      <p>
        With a label they are announced: <Icon icon={Star} label="Starred" />
      </p>
    </div>
  );
}
