import { Beaker } from "lucide-react";
import { sql } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CsvUpload } from "@/components/csv-upload";

export const dynamic = "force-dynamic";

export default async function CompoundsPage() {
  const compounds = (await sql`
    SELECT id, name, smiles, source, created_at
    FROM compounds ORDER BY created_at DESC LIMIT 500
  `) as unknown as Array<{
    id: string;
    name: string;
    smiles: string;
    source: string | null;
  }>;

  return (
    <main className="container py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Compounds</h1>
            {compounds.length > 0 && (
              <Badge variant="muted" className="tabular-nums">
                {compounds.length}
              </Badge>
            )}
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            The small-molecule library screened across every project. Import more with a CSV
            containing <span className="font-mono text-xs">name</span>,{" "}
            <span className="font-mono text-xs">smiles</span>, and an optional{" "}
            <span className="font-mono text-xs">source</span> column.
          </p>
        </div>
        <CsvUpload />
      </div>

      <Card className="mt-8 overflow-hidden">
        <CardContent className="p-0">
          {compounds.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Beaker className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <p className="font-medium">No compounds yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV with <span className="font-mono text-xs">name</span> and{" "}
                  <span className="font-mono text-xs">smiles</span> columns to build your library.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SMILES</TableHead>
                  <TableHead className="text-right">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compounds.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-[42ch] truncate font-mono text-xs text-muted-foreground">
                      {c.smiles}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="muted" className="font-normal">
                        {c.source ?? "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
