import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  GraduationCap,
  Users,
  Wallet,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Team-based decisions",
    description:
      "Teams of 4–5 students submit one collective HR decision each round across seven modules.",
  },
  {
    icon: Wallet,
    title: "$500K discretionary budget",
    description:
      "Allocate spend across recruitment, training, compensation, DEI, and more with live budget tracking.",
  },
  {
    icon: BarChart3,
    title: "Balanced Scorecard",
    description:
      "Scores on Financial, Employee, Process, and Learning perspectives — 100 points per round.",
  },
  {
    icon: GraduationCap,
    title: "SHRM BASK aligned",
    description:
      "Each module maps to SHRM BASK competency areas for accredited HR education.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-indigo-600">
            Higher Education Business Simulation
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Real HR Simulation
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            A Capsim-style HR business simulation where student teams make
            recruitment, compensation, training, and DEI decisions — then see
            how choices affect metrics, financials, and the Balanced Scorecard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/simulate">
              <Button size="lg">Try the simulation</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Instructor login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900">
          Seven HR decision modules
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <f.icon className="mb-3 h-8 w-8 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.description}</p>
            </div>
          ))}
        </div>
        <ul className="mt-10 grid gap-2 text-center text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Recruitment & Selection",
            "Performance Management",
            "Training & Development",
            "Employee Relations",
            "Compensation & Benefits",
            "Org Design & Change",
            "DEI Initiatives",
          ].map((m) => (
            <li key={m} className="rounded-lg bg-slate-100 px-3 py-2">
              {m}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
