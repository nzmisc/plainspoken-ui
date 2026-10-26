import { BlogFootnoteRef } from "@/registry/plainspoken/blocks/blog/article-parts";
import type { Post } from "../types";

export const post: Post = {
  slug: "family-wireguard",
  title: "A WireGuard network for a family of six",
  date: "2026-06-02",
  summary: "Eleven phones and laptops, one backup box and a printer, in three houses. What I set up, and why the printer has its own subnet.",
  tags: ["networking", "personal"],
  minutes: 3,
  body: ({ Code }) => ({
    intro: (
      <>
        <p>
          My family is spread over three houses in two countries: my parents in Maribor, my sister&rsquo;s family in
          Graz, and us in Ljubljana. Between us there are eleven phones and laptops, a small backup box in my
          parents&rsquo; basement, and one printer that everybody wants to print to and nobody wants to configure.
        </p>
        <p>
          For two years I ran a commercial mesh VPN for them. It worked, but I was the only one who understood the admin
          page, and the free plan kept shrinking. In March I replaced it with plain WireGuard and one small server. This
          is the setup, written down mostly so that I remember it.
        </p>
      </>
    ),
    sections: [
      {
        id: "the-shape",
        title: "The shape of it",
        body: (
          <>
            <p>
              A hub and spokes: a small rented VPS with a public address is the hub, and every device is a peer of the
              hub only. No device talks to another directly. That costs a little latency and buys a lot of simplicity,
              because every rule lives in one place.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Addresses</th>
                  <th>Devices</th>
                  <th>Can reach</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Adults</td>
                  <td>
                    <code>10.8.1.0/24</code>
                  </td>
                  <td align="right">6</td>
                  <td>everything</td>
                </tr>
                <tr>
                  <td>Kids</td>
                  <td>
                    <code>10.8.2.0/24</code>
                  </td>
                  <td align="right">5</td>
                  <td>printer, the shared photo folder</td>
                </tr>
                <tr>
                  <td>Servers</td>
                  <td>
                    <code>10.8.3.0/24</code>
                  </td>
                  <td align="right">1</td>
                  <td>nothing; it is only reached</td>
                </tr>
                <tr>
                  <td>Printer</td>
                  <td>
                    <code>10.8.4.0/24</code>
                  </td>
                  <td align="right">1</td>
                  <td>nothing at all</td>
                </tr>
              </tbody>
            </table>
            <p>
              Groups are subnets, so the firewall rules on the hub can be written per group rather than per device.
              Adding my nephew&rsquo;s new laptop meant one new peer and no new rules.
            </p>
          </>
        ),
      },
      {
        id: "a-peer",
        title: "A peer",
        body: (
          <>
            <p>
              Every device gets a config like this, which I generate with a small script and hand over as a QR code. Phones
              scan it in the WireGuard app; laptops import the file.
            </p>
            <Code lang="ini" title="nephew-laptop.conf">{`[Interface]
PrivateKey = <generated on my machine, never stored>
Address = 10.8.2.14/32
DNS = 10.8.0.1

[Peer]
PublicKey = 7f0Rk3…hub…
Endpoint = vpn.example.net:51820
AllowedIPs = 10.8.0.0/16
PersistentKeepalive = 25`}</Code>
            <p>
              <code>AllowedIPs</code> is only the family range, not <code>0.0.0.0/0</code>: their normal internet traffic
              doesn&rsquo;t go through my server, which keeps it fast and keeps me out of their browsing.
            </p>
          </>
        ),
      },
      {
        id: "the-printer",
        title: "Why the printer is on its own",
        body: (
          <p>
            The printer runs firmware from 2017 and announces itself loudly on any network it can see. It gets its own
            subnet and may not start a single connection: the hub forwards print jobs to it and drops everything it tries
            to send out.
            <BlogFootnoteRef n={1} /> It is the least trusted device in the family and, according to my mother, the most
            important one.
          </p>
        ),
      },
      {
        id: "three-months-in",
        title: "Three months in",
        body: (
          <>
            <p>
              Nobody has asked me for help since the first week, which is the only metric that matters. The hub uses
              about 2% of a very small virtual machine. My twelve-year-old niece tried to get from the kids&rsquo; group to
              the backup box, which I know because it is the only rejected connection in the log, and I was quietly proud
              of her.
            </p>
            <blockquote>
              <p>The best family IT is the kind nobody has to think about, including you.</p>
            </blockquote>
          </>
        ),
      },
    ],
    footnotes: [
      <>
        In nftables terms: a forward rule accepting <code>10.8.0.0/16 → 10.8.4.0/24</code> port 9100 and 631, and a drop
        for anything whose source is <code>10.8.4.0/24</code> and isn&rsquo;t an established connection.
      </>,
    ],
  }),
};
