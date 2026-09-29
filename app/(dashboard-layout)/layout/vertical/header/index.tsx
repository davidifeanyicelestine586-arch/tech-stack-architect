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
        "site-header sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      <div className="site-header__row" role="group" aria-label="Workspace controls">
        <div className="site-header__brand">
          <FullLogo />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="site-header__sidebar-trigger"
          onClick={toggleSidebar}
          aria-label={isMobile ? "Toggle mobile workspace navigation" : "Toggle workspace navigation"}
          aria-expanded={isMobile ? openMobile : open}
          aria-controls="workspace-navigation"
        >
          <PanelLeft aria-hidden="true" />
        </Button>

        <Separator orientation="vertical" className="site-header__separator" />

        <div className="site-header__search">
          <Search />
        </div>

        <div className="site-header__persistence" data-header-persistence>
          <ProjectPersistenceToolbar />
        </div>

        <Separator orientation="vertical" className="site-header__separator site-header__optional-separator" />

        <div className="site-header__auth">
          <AuthPanel />
        </div>

        <Separator orientation="vertical" className="site-header__separator site-header__optional-separator" />

        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          className="site-header__github"
          render={
            <Link
              href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Tech Stack Architect GitHub repository in a new tab"
            />
          }
        >
          <GitFork aria-hidden="true" />
          <span>GitHub</span>
        </Button>

        <Separator orientation="vertical" className="site-header__separator site-header__optional-separator" />

        <div className="site-header__theme">
          <LightDark />
        </div>
      </div>
    </header>
  );
};

export default Header;
