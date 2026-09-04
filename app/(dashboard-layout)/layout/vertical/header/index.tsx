"use client";

import Link from "next/link";
import { GitFork, PanelLeft } from "lucide-react";
import Search from "../../shared/header/search";
import FullLogo from "../../shared/logo/full-logo";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LightDark from "../../shared/header/light-dark";
import { Separator } from "@/components/ui/separator";
import { ProjectPersistenceToolbar } from "@/components/architect/project-persistence-toolbar";

const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:sticky lg:top-0"
      )}
    >
      <nav aria-label="Workspace navigation">
        <div className="mx-auto flex min-h-12 flex-wrap items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="block lg:hidden">
              <FullLogo />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-full p-2 transition hover:bg-primary/5 hover:text-primary"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={21} />
            </Button>

            <Separator
              orientation="vertical"
              className="ml-2 mr-4 h-4 max-lg:hidden data-[orientation=vertical]:self-center"
            />

            <div className="hidden sm:block sm:w-72">
              <Search />
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
            <ProjectPersistenceToolbar />
            <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 items-center gap-1.5 text-xs font-medium md:inline-flex"
              render={
                <Link
                  href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect"
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <GitFork className="size-3.5" />
              <span>GitHub</span>
            </Button>
            <LightDark />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
