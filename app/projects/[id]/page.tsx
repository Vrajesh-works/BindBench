import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Dna, FlaskConical } from "lucide-react";
import { sql } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ResultsTable } from "@/components/results-table";
import { StartScreenButton } from "@/components/start-screen-button";

export const dynamic = "force-dynamic";

async function getProject(id: string) {
  const [project] = (await sql`
    SELECT p.id, p.name, p.description, p.status,
           t.id AS target_id, t.name AS target_name, t.uniprot_id
    FROM projects p JOIN targets t ON t.id = p.target_id
    WHERE p.id = ${id}
  `) as unknown as Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    target_id: string;
    target_name: string;
    uniprot_id: string | null;
  }>;
  return project;
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [{ count: compoundCount }] = (await sql`
    SELECT COUNT(*)::int AS count FROM compounds
  `) as unknown as Array<{ count: number }>;

  const [progress] = (await sql`
    SELECT COUNT(pr.id)::int AS total,
           COUNT(pr.id) FILTER (WHERE pr.status IN ('succeeded', 'failed'))::int AS done
    FROM screens s
    LEFT JOIN predictions pr ON pr.screen_id = s.id
    WHERE s.project_id = ${id}
  `) as unknown as Array<{ total: number; done: number }>;
  const total = progress?.total ?? 0;
  const done = progress?.done ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <main className="container py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Projects
      </Link>

      <div className="mt-4 flex flex-col gap-6 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{project.name}</h1>
            <Badge variant="muted" className="capitalize">
              {project.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 text-muted-foreground">
              <Dna className="h-3.5 w-3.5 text-primary" />
              {project.target_name}
            </span>
            {project.uniprot_id && (
              <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {project.uniprot_id}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              {compoundCount} compounds
            </span>
            {total > 0 && (
              <span className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1 text-muted-foreground">
                <span className="tabular-nums">
                  {done}/{total} predictions
                </span>
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted-foreground/20">
                  <span
                    className="block h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="tabular-nums">{pct}%</span>
              </span>
            )}
          </div>
          {project.description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {project.description}
            </p>
          )}
        </div>
        <StartScreenButton projectId={project.id} compoundCount={compoundCount} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">Ranked results</h2>
          <p className="text-xs text-muted-foreground">
            Higher affinity = stronger predicted binding
          </p>
        </div>
        <ResultsTable projectId={project.id} />
      </div>
    </main>
  );
}
