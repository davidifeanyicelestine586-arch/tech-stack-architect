"use client";

import Link from "next/link";
import NavItem from "../nav-items/index";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { MenuItem, ChildItem } from "../sidebaritems";

interface NavCollapseProps {
  menu: MenuItem[];
  className?: string;
}

export default function NavCollapse({ menu, className }: NavCollapseProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapse = state === "collapsed";
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const isActiveRoute = (item: ChildItem): boolean => {
    if (!item.url) return false;
    const [path, itemHash] = item.url.split("#");
    if (path !== pathname) return false;
    return itemHash ? hash === `#${itemHash}` : !hash;
  };

  return (
    <>
      {menu.map((section, index) => (
        <div key={index}>
          <span
            className={cn(
              "mb-2 block text-xs font-semibold uppercase text-muted-foreground transition-all duration-200",
              isCollapse ? "text-center group-hover:text-start group-data-[state=expanded]:text-start" : "",
            )}
          >
            {isCollapse ? (
              <>
                <span className="group-hover:hidden group-data-[state=expanded]:hidden">...</span>
                <span className="hidden group-hover:inline group-data-[state=expanded]:inline">{section.heading ?? ""}</span>
              </>
            ) : (
              section.heading ?? ""
            )}
          </span>

          {section.items?.map((item: ChildItem, itemIndex) => {
            const hasChildren = Array.isArray(item.items) && item.items.length > 0;
            const active = isActiveRoute(item);

            if (!hasChildren) {
              return (
                <Link
                  key={itemIndex}
                  href={item.url || "#"}
                  target={item.external ? "_blank" : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    className,
                  )}
                >
                  <NavItem item={item} hasChildren={false} isActive={active} />
                </Link>
              );
            }

            return (
              <details
                key={itemIndex}
                className="group/nav"
                open={active || item.isActive}
              >
                <summary
                  className={cn(
                    "cursor-pointer list-none rounded-md outline-none transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden",
                  )}
                  aria-label={`${item.name} menu`}
                >
                  <NavItem item={item} hasChildren={true} className={className} isActive={active} />
                </summary>

                <div className="ml-5 border-l border-border pl-3">
                  {item.items?.map((sub: ChildItem, subIndex) =>
                    sub.items ? (
                      <NavCollapse key={subIndex} menu={[{ items: [sub] }]} className={className} />
                    ) : (
                      <Link
                        key={subIndex}
                        href={sub.url || "#"}
                        target={sub.external ? "_blank" : undefined}
                        aria-current={isActiveRoute(sub) ? "page" : undefined}
                        className="block rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <NavItem
                          item={sub}
                          hasChildren={false}
                          className={cn("px-2! py-2! my-1!", isActiveRoute(sub) && "bg-primary/5 text-primary")}
                          isActive={isActiveRoute(sub)}
                        />
                      </Link>
                    ),
                  )}
                </div>
              </details>
            );
          })}
        </div>
      ))}
    </>
  );
}
