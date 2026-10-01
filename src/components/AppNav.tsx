"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Droplets, History, LayoutDashboard, ReceiptText, Settings, Users, Zap } from "lucide-react";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/utilities", label: "Utilities", icon: Zap },
  { href: "/members", label: "Residents", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`}>
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        );
      })}
      <div className="nav-brand-mark" aria-hidden="true">
        <BarChart3 size={16} />
        <Droplets size={14} />
      </div>
    </nav>
  );
}
