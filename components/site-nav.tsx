import Link from "next/link";
import { FlaskConical } from "lucide-react";

const links = [
  { href: "/", label: "Projects" },
  { href: "/compounds", label: "Compounds" },
  { href: "/usage", label: "Usage" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FlaskConical className="h-5 w-5 text-primary" />
          <span>BindBench</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto text-xs text-muted-foreground">
          Amazon Aurora PostgreSQL · Boltz-2
        </span>
      </div>
    </header>
  );
}
