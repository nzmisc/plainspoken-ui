import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";

const ANSWER = `### Pick by what you send

**TCP** delivers every byte, in order, or tells you it couldn't. **UDP** sends packets and forgets them: faster to start, nothing resent.

| | TCP | UDP |
| --- | --- | --- |
| Connection | Handshake first | None |
| Lost packets | Resent | Gone |
| Header (bytes) | 20 | 8 |
| Typical use | Web pages, mail, files | Calls, games, DNS |

A UDP socket in Python is a few lines:

\`\`\`python
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.sendto(b"ping", ("192.0.2.10", 9999))
\`\`\`

> If a late packet is worse than a lost one (a voice call), use UDP.

1. Need every byte? TCP.
2. Need it *now*? UDP, and live with \`gaps\`.

More in [RFC 768](https://www.rfc-editor.org/rfc/rfc768), which fits on two pages.`;

/** An answer with most of what models write: a heading, a table, highlighted code with Copy, a quote, lists and a link. */
export default function ChatMarkdownDemo() {
  return <ChatMarkdown className="max-w-2xl">{ANSWER}</ChatMarkdown>;
}
