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
import { AuthPanel } from "@/components/auth/auth-panel";

const Header = () => {
  const { toggleSidebar, isMobile, openMobile, open } = useSidebar();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:sticky lg:top-0",
      )}
    >
      <div role="group" aria-label="Workspace controls">
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <div className="mx-auto flex min-h-12 min-w-max items-center gap-2 p-2">
            <div className="flex shrink-0 items-center gap-2">
              <div className="block" aria-label="Ediccrew Tech Stack Architect">
                <FullLogo />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 cursor-pointer rounded-full p-2 transition hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={toggleSidebar}
                aria-label={isMobile ? "Toggle mobile workspace navigation" : "Toggle workspace navigation"}
                aria-expanded={isMobile ? openMobile : open}
                aria-controls="workspace-navigation"
              >
                <PanelLeft aria-hidden="true" size={21} />
              </Button>

              <Separator
                orientation="vertical"
                className="ml-2 mr-4 h-4 data-[orientation=vertical]:self-center"
              />

              <div className="w-40 shrink-0 sm:w-48 lg:w-56 xl:w-56">
                <Search />
              </div>
            </div>

            <div data-header-persistence className="flex shrink-0 items-center">
              <ProjectPersistenceToolbar />
            </div>

            <Separator orientation="vertical" className="h-5 shrink-0 mx-1" />

            <div className="shrink-0">
              <AuthPanel />
            </div>

            <Separator orientation="vertical" className="h-5 shrink-0 mx-1" />

            <Button
              variant="outline"
              size="sm"
              className="h-11 shrink-0 items-center gap-1.5 px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary inline-flex"
              render={
                <Link
                  href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Tech Stack Architect GitHub repository in a new tab"
                />
              }
            >
              <GitFork aria-hidden="true" className="size-3.5" />
              <span>GitHub</span>
            </Button>

            <Separator orientation="vertical" className="h-5 shrink-0 mx-1" />

            <div className="shrink-0">
              <LightDark />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
