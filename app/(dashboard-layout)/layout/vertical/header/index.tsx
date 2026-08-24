"use client";

import Search from "../../shared/header/search";
import FullLogo from "../../shared/logo/full-logo";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LightDark from "../../shared/header/light-dark";
import { GitFork, PanelLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className={cn("sticky top-0 z-20 bg-background/95 backdrop-blur-xs border-b border-border")}>
      <nav>
        <div className="mx-auto flex flex-wrap items-center justify-between px-4 py-2.5">
          <div className="flex gap-2 items-center">
            <div className="block lg:hidden">
              <FullLogo />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition cursor-pointer"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <PanelLeft size={19} />
            </Button>

            <Separator
              orientation="vertical"
              className="h-4 mr-2 ml-1 data-[orientation=vertical]:self-center max-lg:hidden"
            />

            <div className="sm:block hidden w-72">
              <Search />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium h-8"
              render={
                <Link
                  href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect"
                  target="_blank"
                />
              }
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </Button>

            {/* Theme Toggle */}
            <LightDark />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
