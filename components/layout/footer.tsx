import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex md:flex-row flex-col items-center justify-between gap-3 text-center border-t border-border/60 pt-4 pb-2">
      <p className="text-xs text-muted-foreground">
        © 2026{" "}
        <span className="font-semibold text-foreground">Ediccrew</span>.
        Tech Stack Architect — Interactive Validation & Architecture Blueprint
        Platform.
      </p>

      <div className="flex gap-4 text-xs">
        <Link
          href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tech Stack Architect GitHub repository"
          className="min-h-11 inline-flex items-center hover:text-primary text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          GitHub
        </Link>
        <Link
          href="/#docs"
          aria-label="Open the Tech Stack Architect specification"
          className="min-h-11 inline-flex items-center hover:text-primary text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Specification
        </Link>
      </div>
    </footer>
  );
}
