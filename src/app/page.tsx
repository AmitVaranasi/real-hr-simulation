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
    <div className="w-full min-w-0 overflow-x-hidden bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-20">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-indigo-600 sm:text-sm">
            Higher Education Business Simulation
          </p>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Real HR Simulation
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            An HR business simulation where student teams make recruitment,
            compensation, training, and engagement decisions — then see how
            those choices affect workforce metrics, financial outcomes, and the
            Balanced Scorecard.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/simulate" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Try the simulation
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-xl font-semibold text-slate-900 sm:text-2xl">
            Seven HR decision modules
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <f.icon className="mb-3 h-8 w-8 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
          <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Recruitment & Selection",
              "Performance Management",
              "Training & Development",
              "Employee Relations",
              "Compensation & Benefits",
              "Org Design & Change",
              "DEI Initiatives",
            ].map((m) => (
              <li
                key={m}
                className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm text-slate-700"
              >
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center text-sm text-slate-500">
            <Link href="/about" className="text-indigo-600 hover:underline">
              About this application
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
