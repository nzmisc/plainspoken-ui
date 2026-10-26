import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";

const POSTS = [
  { title: "Why our tables have borders again", date: "21 October 2026", text: "Lines between cells cost one pixel and save the reader a squint." },
  { title: "Square corners, on purpose", date: "9 October 2026", text: "Radius was decoration; the border does the separating." },
  { title: "One height for every control", date: "28 September 2026", text: "A button, an input and a select of one size now line up to the pixel." },
];

/** Cards as items in a grid, with only a header and some text. The border separates them; no shadow. */
export default function CardGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {POSTS.map((p) => (
        <Card key={p.title}>
          <CardHeader>
            <CardTitle as="h3">
              <a href="#post" className="hover:underline">
                {p.title}
              </a>
            </CardTitle>
            <CardDescription>{p.date}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{p.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
