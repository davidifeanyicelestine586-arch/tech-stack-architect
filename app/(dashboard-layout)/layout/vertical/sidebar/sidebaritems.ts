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

const SidebarContent: MenuItem[] = [
  {
    heading: "TECH STACK ARCHITECT",
    items: [
      {
        id: uniqueId("nav_"),
        name: "Workspace",
        icon: House,
        url: "/",
      },
      {
        id: uniqueId("nav_"),
        name: "Project Definition",
        icon: ClipboardList,
        url: "/#define",
      },
      {
        id: uniqueId("nav_"),
        name: "Recommended Stack",
        icon: Sparkles,
        url: "/#recommendations",
      },
      {
        id: uniqueId("nav_"),
        name: "Component Library",
        icon: Layers,
        url: "/#components",
      },
      {
        id: uniqueId("nav_"),
        name: "Validation Engine",
        icon: ShieldCheck,
        url: "/#validation",
      },
      {
        id: uniqueId("nav_"),
        name: "Recipe Catalog",
        icon: BookOpen,
        url: "/#recipes",
      },
      {
        id: uniqueId("nav_"),
        name: "Architecture Blueprint",
        icon: Sparkles,
        url: "/#blueprint",
      },
    ],
  },
  {
    heading: "ENGINEERING DOMAINS",
    items: [
      {
        id: uniqueId("nav_"),
        name: "Web Development & SaaS",
        icon: Globe,
        url: "/#domain-web-saas",
      },
      {
        id: uniqueId("nav_"),
        name: "AI & Automation",
        icon: Bot,
        url: "/#domain-ai-automation",
      },
      {
        id: uniqueId("nav_"),
        name: "Hardware & Mechatronics",
        icon: Cpu,
        url: "/#domain-mechatronics",
      },
    ],
  },
  {
    heading: "TOOLS & EXPORTS",
    items: [
      {
        id: uniqueId("nav_"),
        name: "Export Center",
        icon: Download,
        url: "/#exports",
      },
      {
        id: uniqueId("nav_"),
        name: "Specification Docs",
        icon: BookMarked,
        url: "/#docs",
      },
    ],
  },
];

export default SidebarContent;
