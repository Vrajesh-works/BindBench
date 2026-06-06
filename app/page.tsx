import Link from "next/link";
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

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Screening campaigns. Boltz-2 ranks candidates for wet-lab follow-up — it does not replace experiments.
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects yet. Create one to start a screen.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant="muted">{p.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Target: {p.target_name}</p>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {p.description && <p className="mb-3 line-clamp-2">{p.description}</p>}
                  <div className="flex gap-4 text-xs">
                    <span>{p.prediction_count} predictions</span>
                    <span>{p.succeeded_count} done</span>
                    <span>{p.screen_count} screens</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
