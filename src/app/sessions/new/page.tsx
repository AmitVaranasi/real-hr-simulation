import { CreateSessionForm } from "@/components/instructor/CreateSessionForm";

export default function NewSessionPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Create session</h1>
      <p className="mt-2 text-slate-600">
        Sets up 1 practice round and 3 competitive rounds by default.
      </p>
      <div className="mt-8">
        <CreateSessionForm />
      </div>
    </div>
  );
}
