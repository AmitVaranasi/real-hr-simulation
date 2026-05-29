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
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create session"}
      </Button>
    </form>
  );
}
