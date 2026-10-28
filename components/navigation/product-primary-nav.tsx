"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Technologies", href: "/technologies" },
  { label: "Domains", href: "/domains" },
  { label: "Stacks", href: "/stacks" },
  { label: "Documentation", href: "/content-detail" },
  { label: "About", href: "/about" },
];

export function ProductPrimaryNav({ workspace = false }: { workspace?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className={workspace ? "border-t border-border/70 px-3 py-2 sm:px-4" : "w-auto min-w-0 shrink-0 sm:flex-1"}>
      <div className={workspace ? "flex items-center justify-between gap-2" : "flex items-center justify-end gap-2"}>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground sm:hidden"
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
          className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full z-50 flex-col gap-1 border-b border-border bg-background p-3 shadow-lg sm:static sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none ${workspace ? "sm:justify-start" : ""}`}
        >
          {links.map(({ label, href }) => (
            <Link key={href} href={href} className={linkClass(href)} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link
            href="/app"
            className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pathname.startsWith("/app") ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"}`}
            aria-current={pathname === "/app" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {workspace ? "Workspace" : "Open the Architect"}
          </Link>
        </nav>
      </div>
    </div>
  );
}
