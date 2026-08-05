const MODULE_SCAFFOLDING: Record<string, string> = {
  Recruitment:
    "Decide which roles to fill, how rigorously to screen candidates, and how much to invest in diversity sourcing and onboarding. These choices drive cost per hire, time to fill, and hiring quality.",
  Performance:
    "Set review cadence, 360° feedback, and role-level performance criteria. Stronger systems improve review coverage, succession pipeline, and leadership scores used in productivity.",
  Training:
    "Allocate per-employee training budget, coverage, and developmental programs. Training ROI and effectiveness feed both the Learning BSC perspective and productivity.",
  Relations:
    "Choose conflict approach, voice mechanisms, engagement spend, and flexibility. These levers shape satisfaction, engagement, absenteeism, and DEI outcomes.",
  Compensation:
    "Set salary bands by role, bonus tier, benefits, equity, and HR technology level. Compensation and tech investments affect turnover, retention, and financial results.",
  "Org Design":
    "Design structure, span of control, process focus, change capability, and collaboration enablement. Fit matters more than selecting the most sophisticated option.",
  DEI: "Build a coherent DEI portfolio across talent pipelines, equity, inclusion, education, and accessibility — not simply spend more for a higher score.",
};

export function ScaffoldingText({ module }: { module: string }) {
  const text = MODULE_SCAFFOLDING[module];
  if (!text) return null;
  return (
    <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
  );
}
