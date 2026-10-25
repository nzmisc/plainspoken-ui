// Made-up but plausible process and listener rows for a small server, from a fixed seed, so the
// data-table stories look the same every time.

export type Exposure = "tailnet" | "local" | "public" | "none";
export type ProcState = "running" | "sleeping" | "idle" | "stopped" | "zombie";

export interface ProcRow {
  pid: number;
  command: string;
  args: string;
  user: string;
  unit: string | null;
  state: ProcState;
  cpu: number;
  mem: number;
  threads: number;
  port: number | null;
  proto: "tcp" | "udp" | null;
  bind: string | null;
  exposure: Exposure;
  started: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Template {
  command: string;
  args: string[];
  user: string;
  unit: string | null;
  /** [port, proto, bind, exposure] when it listens */
  listen?: [number, "tcp" | "udp", string, Exposure];
  memMiB: [number, number];
  weight: number;
}

const T: Template[] = [
  { command: "systemd", args: ["--user"], user: "ana", unit: "user@1001.service", memMiB: [8, 14], weight: 1 },
  { command: "tailscaled", args: ["--state=/var/lib/tailscale/tailscaled.state"], user: "root", unit: "tailscaled.service", listen: [41641, "udp", "0.0.0.0", "public"], memMiB: [40, 70], weight: 1 },
  { command: "sshd", args: ["-D"], user: "root", unit: "ssh.service", listen: [22, "tcp", "0.0.0.0", "tailnet"], memMiB: [6, 9], weight: 1 },
  { command: "smbd", args: ["--foreground", "--no-process-group"], user: "root", unit: "smbd.service", listen: [445, "tcp", "0.0.0.0", "tailnet"], memMiB: [20, 45], weight: 3 },
  { command: "xrdp", args: ["--nodaemon"], user: "xrdp", unit: "xrdp.service", listen: [3389, "tcp", "127.0.0.1", "tailnet"], memMiB: [10, 18], weight: 1 },
  { command: "Xtigervnc", args: [":1", "-geometry", "1920x1080", "-localhost"], user: "ana", unit: "vnc-ana.service", listen: [5901, "tcp", "127.0.0.1", "local"], memMiB: [120, 260], weight: 1 },
  { command: "node", args: ["server/index.ts"], user: "ana", unit: "dashboard.service", listen: [8790, "tcp", "127.0.0.1", "tailnet"], memMiB: [60, 110], weight: 1 },
  { command: "postgres", args: ["-D", "/var/lib/postgresql/17/main"], user: "postgres", unit: "postgresql.service", listen: [5432, "tcp", "127.0.0.1", "local"], memMiB: [150, 320], weight: 1 },
  { command: "nginx", args: ["-g", "daemon off;"], user: "www-data", unit: "nginx.service", listen: [443, "tcp", "0.0.0.0", "public"], memMiB: [12, 30], weight: 2 },
  { command: "claude", args: ["--resume"], user: "ana", unit: null, memMiB: [180, 600], weight: 12 },
  { command: "chrome-headless-shell", args: ["--headless", "--remote-debugging-port=0"], user: "ana", unit: null, memMiB: [80, 500], weight: 18 },
  { command: "bash", args: ["-l"], user: "ana", unit: null, memMiB: [3, 6], weight: 30 },
  { command: "tmux", args: ["new", "-A", "-s", "main"], user: "ana", unit: null, memMiB: [4, 9], weight: 4 },
  { command: "node", args: ["node_modules/.bin/vite"], user: "ana", unit: null, listen: [5173, "tcp", "127.0.0.1", "local"], memMiB: [90, 200], weight: 3 },
  { command: "node", args: ["node_modules/.bin/storybook", "dev", "-p", "6006"], user: "ana", unit: null, listen: [6006, "tcp", "127.0.0.1", "local"], memMiB: [200, 500], weight: 2 },
  { command: "systemd-resolved", args: [], user: "systemd-resolve", unit: "systemd-resolved.service", listen: [53, "udp", "127.0.0.53", "local"], memMiB: [9, 13], weight: 1 },
  { command: "systemd-journald", args: [], user: "root", unit: "systemd-journald.service", memMiB: [20, 80], weight: 1 },
  { command: "cron", args: ["-f", "-P"], user: "root", unit: "cron.service", memMiB: [2, 4], weight: 1 },
  { command: "nmbd", args: ["--foreground"], user: "root", unit: "nmbd.service", listen: [137, "udp", "0.0.0.0", "none"], memMiB: [10, 16], weight: 1 },
  { command: "kworker/u16:2", args: [], user: "root", unit: null, memMiB: [0, 0], weight: 40 },
  { command: "python3", args: ["-m", "http.server", "8000"], user: "ana", unit: null, listen: [8000, "tcp", "127.0.0.1", "local"], memMiB: [15, 30], weight: 2 },
  { command: "rg", args: ["--json", "TODO"], user: "ana", unit: null, memMiB: [10, 60], weight: 4 },
  { command: "git", args: ["fetch", "--prune"], user: "ana", unit: null, memMiB: [8, 40], weight: 3 },
];

const STATES: ProcState[] = ["sleeping", "sleeping", "sleeping", "sleeping", "running", "idle", "idle", "stopped", "zombie"];

/** About 200 rows. `now` is fixed so stories render the same every time. */
export function makeProcRows(n = 200, seed = 7, now = Date.UTC(2026, 9, 19, 12, 0)): ProcRow[] {
  const r = rng(seed);
  const total = T.reduce((a, t) => a + t.weight, 0);
  const pick = () => {
    let x = r() * total;
    for (const t of T) if ((x -= t.weight) < 0) return t;
    return T[T.length - 1];
  };
  const usedPorts = new Set<number>();
  const rows: ProcRow[] = [];
  let pid = 1;
  for (let i = 0; i < n; i++) {
    const t = i < 9 ? T[i] : pick(); // every service at least once
    pid += 1 + Math.floor(r() * 900);
    const listen = t.listen && !usedPorts.has(t.listen[0]) ? t.listen : undefined;
    if (listen) usedPorts.add(listen[0]);
    const isKernel = t.command.startsWith("kworker");
    const mem = isKernel ? 0 : Math.round((t.memMiB[0] + r() * (t.memMiB[1] - t.memMiB[0])) * 1024 * 1024);
    const ageMin = t.unit ? 2 * 1440 + r() * 60 : r() < 0.3 ? r() * 30 : r() * 14 * 1440;
    rows.push({
      pid: isKernel ? 100 + i : pid,
      command: isKernel ? `kworker/u16:${i % 9}` : t.command,
      args: t.args.join(" "),
      user: t.user,
      unit: t.unit,
      state: isKernel ? "idle" : STATES[Math.floor(r() * STATES.length)],
      cpu: Math.round((r() < 0.8 ? r() * 2 : r() * 60) * 10) / 10,
      mem,
      threads: isKernel ? 1 : 1 + Math.floor(r() * (t.command === "node" || t.command === "chrome-headless-shell" ? 40 : 8)),
      port: listen?.[0] ?? null,
      proto: listen?.[1] ?? null,
      bind: listen?.[2] ?? null,
      exposure: listen?.[3] ?? "none",
      started: Math.round(now - ageMin * 60_000),
    });
  }
  return rows;
}

const GiB = 1024 ** 3;

export function bytes(n: number): string {
  if (n >= GiB) return `${(n / GiB).toFixed(1)} GiB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(0)} MiB`;
  return `${(n / 1024).toFixed(0)} KiB`;
}

/** "Oct 19, 14:05" in UTC, so it reads the same everywhere */
export function dateTime(t: number): string {
  return new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" });
}
