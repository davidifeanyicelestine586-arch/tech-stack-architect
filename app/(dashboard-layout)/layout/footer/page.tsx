"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex md:flex-row flex-col items-center justify-between gap-3 text-center border-t border-border/60 pt-4 pb-2">
      <p className="text-xs text-muted-foreground">
        © 2026{" "}
        <span className="font-semibold text-foreground">
          Ediccrew
        </span>
        . Tech Stack Architect — Interactive Validation & Architecture Blueprint Platform.
      </p>

      <div className="flex gap-4 text-xs">
        <Link
          href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect"
          target="_blank"
          className="hover:text-primary text-muted-foreground transition-colors"
        >
          GitHub
        </Link>
        <Link
          href="/#docs"
          className="hover:text-primary text-muted-foreground transition-colors"
        >
          Specification
        </Link>
      </div>
    </footer>
  );
}
