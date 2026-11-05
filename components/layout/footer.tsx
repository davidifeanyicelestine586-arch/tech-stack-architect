import Link from "next/link";

const groups = [
  {
    title: "Product",
    links: [
      ["Workspace", "/app"],
      ["Technologies", "/technologies"],
      ["Domains", "/domains"],
      ["Stacks", "/stacks"],
      ["Documentation", "/content-detail"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-border/60 pt-6 pb-4">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">{group.title}</h2>
            <ul className="mt-3 space-y-1">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-11 items-center rounded-sm text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Open source</h2>
          <Link href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect" target="_blank" rel="noopener noreferrer" aria-label="Tech Stack Architect GitHub repository" className="mt-3 inline-flex min-h-11 items-center rounded-sm text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">GitHub</Link>
          <Link href="https://ediccrew.com" target="_blank" rel="noopener noreferrer" aria-label="Ediccrew.com" className="mt-1 inline-flex min-h-11 items-center rounded-sm text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Ediccrew.com</Link>
        </div>
      </div>
      <p className="mt-8 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">© 2026 Ediccrew. Tech Stack Architect — Interactive Validation & Architecture Blueprint Platform.</p>
    </footer>
  );
}
