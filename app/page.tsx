import Link from "next/link";
import { ArrowRight, FlaskConical, Layers, Target } from "lucide-react";
import { sql } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewProjectDialog } from "@/components/new-project-dialog";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  target_name: string;
  screen_count: string;
  prediction_count: string;
  succeeded_count: string;
};

async function getProjects(): Promise<ProjectRow[]> {
  return (await sql`
    SELECT p.id, p.name, p.description, p.status,
           t.name AS target_name,
           COUNT(DISTINCT s.id)                                AS screen_count,
           COUNT(pr.id)                                        AS prediction_count,
           COUNT(pr.id) FILTER (WHERE pr.status = 'succeeded') AS succeeded_count
    FROM projects p
    JOIN targets t          ON t.id = p.target_id
    LEFT JOIN screens s      ON s.project_id = p.id
    LEFT JOIN predictions pr ON pr.screen_id = s.id
    GROUP BY p.id, t.id
    ORDER BY p.created_at DESC
  `) as unknown as ProjectRow[];
}

function statusVariant(status: string): "default" | "secondary" | "muted" {
  if (status === "running") return "secondary";
  if (status === "completed" || status === "succeeded") return "default";
  return "muted";
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="container py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Projects</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            Screening campaigns pairing a protein target with a compound library. Boltz-2 ranks
            candidates to prioritize wet-lab follow-up — it does not replace experiments.
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <Card className="mt-10 border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FlaskConical className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">No projects yet</p>
              <p className="text-sm text-muted-foreground">
                Create a project to define a target and start screening your library.
              </p>
            </div>
            <NewProjectDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const total = Number(p.prediction_count);
            const done = Number(p.succeeded_count);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardHeader className="gap-2 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug text-balance">
                        {p.name}
                      </CardTitle>
                      <Badge variant={statusVariant(p.status)} className="shrink-0 capitalize">
                        {p.status}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Target className="h-3.5 w-3.5" />
                      <span className="truncate">{p.target_name}</span>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {p.description ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground/70">No description</p>
                    )}

                    <div className="grid grid-cols-3 gap-2 border-t pt-4">
                      <div>
                        <div className="text-lg font-semibold tabular-nums">{total}</div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Predictions
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold tabular-nums text-primary">{done}</div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Succeeded
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-lg font-semibold tabular-nums">
                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.screen_count}
                        </div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Screens
                        </div>
                      </div>
                    </div>

                    {total > 0 && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      View results
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
