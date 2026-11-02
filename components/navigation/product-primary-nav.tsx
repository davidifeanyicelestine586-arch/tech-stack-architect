"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Technologies", href: "/technologies" },
  { label: "Domains", href: "/domains" },
  { label: "Stacks", href: "/stacks" },
  { label: "Documentation", href: "/content-detail" },
  { label: "About", href: "/about" },
];

export function ProductPrimaryNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isCurrent = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const isWorkspace = pathname === "/app" || pathname.startsWith("/app/");

  const linkClass = (href: string) =>
    `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      isCurrent(href)
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <div className="w-auto min-w-0 shrink-0 lg:flex-1" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-end gap-2">
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          aria-expanded={open}
          aria-controls="product-primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
          {open ? "Close menu" : "Menu"}
        </button>
        <nav
          id="product-primary-navigation"
          aria-label="Primary"
          className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full z-50 flex-col gap-1 border-b border-border bg-background p-3 shadow-lg lg:static lg:flex lg:flex-row lg:flex-wrap lg:items-center lg:justify-end lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={linkClass(href)}
              aria-current={isCurrent(href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/app"
            className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isCurrent("/app") ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"}`}
            aria-current={isCurrent("/app") ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {isWorkspace ? "Workspace" : "Open the Architect"}
          </Link>
        </nav>
      </div>
    </div>
  );
}
