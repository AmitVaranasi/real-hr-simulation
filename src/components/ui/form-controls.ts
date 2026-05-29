import { cn } from "@/lib/utils";

/** Shared text/number input styling — always light theme */
export const formInputClassName = cn(
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
  "placeholder:text-slate-400",
  "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
  "[color-scheme:light]"
);

/** Native select with custom chevron — avoids OS dark dropdown chrome */
export const formSelectClassName = cn(
  formInputClassName,
  "appearance-none bg-white pr-10",
  "bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat",
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]"
);
