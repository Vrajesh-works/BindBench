import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { sql } from "@/lib/db";
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

  return (
    <main className="container py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Projects
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Target: {project.target_name}
            {project.uniprot_id ? ` · ${project.uniprot_id}` : ""}
          </p>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <StartScreenButton projectId={project.id} compoundCount={compoundCount} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Ranked results</h2>
        <ResultsTable projectId={project.id} />
      </div>
    </main>
  );
}
