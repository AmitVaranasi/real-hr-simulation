"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-controls";

export function CreateSessionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [practiceRounds, setPracticeRounds] = useState(1);
  const [roundsTotal, setRoundsTotal] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        course_code: courseCode || undefined,
        semester: semester || undefined,
        practice_rounds: practiceRounds,
        rounds_total: roundsTotal,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create session");
      setLoading(false);
      return;
    }
    router.push(`/sessions/${data.session.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 max-w-lg space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="font-medium">Session name</span>
        <input
          required
          className={`mt-1 ${formInputClassName}`}
          placeholder="MGMT 453 Fall 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Course code (optional)</span>
        <input
          className={`mt-1 ${formInputClassName}`}
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Semester (optional)</span>
        <input
          className={`mt-1 ${formInputClassName}`}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="font-medium">Practice rounds</span>
          <input
            type="number"
            min={0}
            max={5}
            required
            className={`mt-1 ${formInputClassName}`}
            value={practiceRounds}
            onChange={(e) => setPracticeRounds(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Competitive rounds</span>
          <input
            type="number"
            min={1}
            max={12}
            required
            className={`mt-1 ${formInputClassName}`}
            value={roundsTotal}
            onChange={(e) => setRoundsTotal(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Creates {practiceRounds} practice + {roundsTotal} competitive rounds (
        {practiceRounds + roundsTotal} total).
      </p>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create session"}
      </Button>
    </form>
  );
}
