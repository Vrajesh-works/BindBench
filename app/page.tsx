import Link from "next/link";
import {
  ArrowRight,
  FlaskConical,
  Github,
  Layers,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "Targets and compound libraries",
    body: "Register protein targets with sequences and UniProt IDs. Build compound libraries by hand or bulk CSV upload, stored with vector embeddings for similarity search.",
  },
  {
    icon: FlaskConical,
    title: "Boltz-2 affinity predictions",
    body: "Fan out one prediction job per compound against the Boltz-2 API, then poll and rank as results land. A deterministic mock mode runs the whole loop with zero API cost.",
  },
  {
    icon: Layers,
    title: "Ranked, reviewable results",
    body: "Every screen produces a ranked table of predictions with affinity scores, confidence metrics, and per-compound status from queued to succeeded.",
  },
];

const steps = [
  { n: "01", title: "Create a project", body: "Name the campaign and attach a protein target with its sequence." },
  { n: "02", title: "Add compounds", body: "Upload a CSV of SMILES strings or add candidates one by one." },
  { n: "03", title: "Run the screen", body: "Start prediction jobs for the full library in one click." },
  { n: "04", title: "Review the ranking", body: "Compare predicted affinities side by side and export the shortlist." },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b">
        <div className="container py-20 md:py-28">
          <Badge variant="secondary" className="mb-6">
            <Trophy className="mr-1.5 h-3.5 w-3.5" />
            H0 Hackathon &middot; Track 2
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Rank small-molecule candidates by predicted binding affinity
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            BindBench is a screening workbench for small biotech labs. Point it
            at a protein target, feed it a compound library, and get a ranked
            shortlist powered by the Boltz-2 model, backed by Postgres with
            pgvector.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/projects">
                Open the app <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href="https://github.com/Vrajesh-works/BindBench"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="mr-2 h-4 w-4" /> View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="container py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {f.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b">
        <div className="container py-16">
          <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n}>
                <div className="text-sm font-mono text-muted-foreground">{s.n}</div>
                <div className="mt-2 font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack + CTA */}
      <section>
        <div className="container py-16">
          <h2 className="text-2xl font-bold tracking-tight">Built with</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Next.js 16", "TypeScript", "Tailwind CSS", "Drizzle ORM", "PostgreSQL + pgvector", "Boltz-2 API", "Vercel Cron"].map((t) => (
              <Badge key={t} variant="outline">{t}</Badge>
            ))}
          </div>
          <Card className="mt-10">
            <CardContent className="flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-bold">See it in action</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  The live deployment ships with a demo project so you can explore a finished screen immediately.
                </div>
              </div>
              <Button asChild size="lg">
                <Link href="/projects">
                  Launch the demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
