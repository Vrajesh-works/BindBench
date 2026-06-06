import { sql } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
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
    <main className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compounds</h1>
          <p className="text-sm text-muted-foreground">
            The small-molecule library screened across projects.
          </p>
        </div>
        <CsvUpload />
      </div>

      <Card className="mt-8">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SMILES</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compounds.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.smiles}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.source ?? "—"}</TableCell>
                </TableRow>
              ))}
              {compounds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    No compounds yet. Upload a CSV with name, smiles columns.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
