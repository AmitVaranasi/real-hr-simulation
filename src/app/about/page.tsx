import Link from "next/link";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">About Real HR Simulation</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        Real HR Simulation is an educational web application for university HR
        and management courses. Student teams make collective human resources
        decisions each round; the simulation engine calculates HR metrics,
        financial outcomes, and Balanced Scorecard scores.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        This site is operated for academic use. It uses Supabase for secure
        authentication and data storage. No malware, phishing, or unauthorized
        data collection is performed.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        <strong>Contact:</strong> Course instructor or project administrator.
      </p>
      <Link href="/" className="mt-8 inline-block text-[#e67e22] hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
