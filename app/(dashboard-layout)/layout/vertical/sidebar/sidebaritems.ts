import {
  Layers,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Globe,
  Bot,
  Cpu,
  Download,
  BookMarked,
  ClipboardList,
  House,
  LucideIcon,
} from "lucide-react";
import { uniqueId } from "lodash";
import { NAVIGATION_ROUTE_BY_ID } from "@/lib/navigation/routes";

export interface ChildItem {
  id?: number | string;
  name: string;
  icon?: LucideIcon;
  items?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
  isActive?: boolean;
  external?: boolean;
  isPro?: boolean;
  mobilePrimary?: boolean;
  routeId?: string;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: number;
  to?: string;
  item?: MenuItem[];
  items?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  badgeContent?: string;
  isActive?: boolean;
  isPro?: boolean;
}

const route = (id: string) => NAVIGATION_ROUTE_BY_ID[id];

const SidebarContent: MenuItem[] = [
  {
    heading: "TECH STACK ARCHITECT",
    items: [
      { id: uniqueId("nav_"), name: route("workspace").label, icon: House, url: route("workspace").href, routeId: "workspace", mobilePrimary: true },
      { id: uniqueId("nav_"), name: route("define").label, icon: ClipboardList, url: route("define").href, routeId: "define", mobilePrimary: true },
      { id: uniqueId("nav_"), name: route("recommendations").label, icon: Sparkles, url: route("recommendations").href, routeId: "recommendations", mobilePrimary: true },
      { id: uniqueId("nav_"), name: route("components").label, icon: Layers, url: route("components").href, routeId: "components" },
      { id: uniqueId("nav_"), name: route("validation").label, icon: ShieldCheck, url: route("validation").href, routeId: "validation", mobilePrimary: true },
      { id: uniqueId("nav_"), name: route("recipes").label, icon: BookOpen, url: route("recipes").href, routeId: "recipes" },
      { id: uniqueId("nav_"), name: route("blueprint").label, icon: Sparkles, url: route("blueprint").href, routeId: "blueprint", mobilePrimary: true },
    ],
  },
  {
    heading: "ENGINEERING DOMAINS",
    items: [
      { id: uniqueId("nav_"), name: route("domain-web-saas").label, icon: Globe, url: route("domain-web-saas").href, routeId: "domain-web-saas" },
      { id: uniqueId("nav_"), name: route("domain-ai-automation").label, icon: Bot, url: route("domain-ai-automation").href, routeId: "domain-ai-automation" },
      { id: uniqueId("nav_"), name: route("domain-mechatronics").label, icon: Cpu, url: route("domain-mechatronics").href, routeId: "domain-mechatronics" },
    ],
  },
  {
    heading: "TOOLS & EXPORTS",
    items: [
      { id: uniqueId("nav_"), name: route("exports").label, icon: Download, url: route("exports").href, routeId: "exports" },
      { id: uniqueId("nav_"), name: route("docs").label, icon: BookMarked, url: route("docs").href, routeId: "docs" },
    ],
  },
];

export default SidebarContent;
