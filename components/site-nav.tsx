"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Projects" },
  { href: "/compounds", label: "Compounds" },
  { href: "/usage", label: "Usage" },
];

export function SiteNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/projects");
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FlaskConical className="h-4 w-4" />
          </span>
          <span>BindBench</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                isActive(l.href)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Amazon Aurora PostgreSQL · Boltz-2
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
