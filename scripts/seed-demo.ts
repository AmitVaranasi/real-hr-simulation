/**
 * Seeds a self-contained demo class so the professor portal can be reviewed
 * with realistic multi-team, multi-student data.
 *
 *   npx tsx scripts/seed-demo.ts            # create the demo class
 *   npx tsx scripts/seed-demo.ts teardown   # remove everything it created
 *
 * Everything it writes is prefixed so it is easy to spot and easy to remove:
 *   - session name  "[DEMO] ..."
 *   - student email  demo.student.NN@realhrsim.test
 * It never touches sessions, teams or users it did not create.
 *
 * Outcomes are produced by the real engine (src/lib/db/compute), not invented,
 * so scores, budgets and carry-forward behave exactly as they do in a live run.
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import {
  computeTeamOutcome,
  outcomeToDbRow,
  priorMetricsFromOutcome,
  teamStateUpdateFromOutcome,
} from "../src/lib/db/compute";
import { getIndustryConfig } from "../src/lib/engine/config";
import type { EconomyCondition, Industry, Strategy, Team } from "../src/lib/engine/types";

loadEnv({ path: ".env.local" });

const DEMO_SESSION_NAME = "[DEMO] Multi-Team HR Class";
const DEMO_EMAIL_DOMAIN = "realhrsim.test";
const DEMO_PASSWORD = "demo12345";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}
const db = createClient(url, serviceKey);

/** Six teams spanning every industry and a range of strategies. */
const TEAMS: Array<{
  name: string;
  industry: Industry;
  strategy: Strategy;
  persona: string;
}> = [
  { name: "Northwind Manufacturing", industry: "Manufacturing", strategy: "Cost Leadership", persona: "costCutter" },
  { name: "Beacon Services", industry: "Service", strategy: "Customer Intimacy", persona: "peopleFirst" },
  { name: "Helix Technologies", industry: "High-Tech", strategy: "Innovation", persona: "innovator" },
  { name: "Meridian Bank", industry: "Banking", strategy: "Differentiation", persona: "balanced" },
  { name: "Carter Retail Group", industry: "Retail", strategy: "Focus", persona: "underInvestor" },
  { name: "Summit Industrial", industry: "Manufacturing", strategy: "Differentiation", persona: "bigSpender" },
];

const STUDENT_FIRST = [
  "Ava", "Ben", "Cara", "Dev", "Elena", "Femi", "Grace", "Hugo",
  "Iris", "Jonas", "Kira", "Liam", "Maya", "Noah", "Omar", "Priya",
  "Quinn", "Rosa", "Sam", "Tara", "Umar", "Vera", "Wes", "Yara",
];

/**
 * Decision profiles. Each is a plausible way a student team allocates its
 * budget, so the six teams diverge on the scoreboard for readable reasons.
 */
const PERSONAS: Record<string, Record<string, number>> = {
  costCutter: {
    recruitment_budget_per_hire: 3000, positions_to_fill: 6, screening_rigor: 1,
    training_budget_per_ee: 300, pct_employees_trained: 30, salary_vs_market_pct: 92,
    benefits_per_ee: 1800, bonus_pool_pct: 1, engagement_investment: 2000,
    hr_tech_level: 0, dei_training_per_ee: 50, span_of_control: 12,
  },
  peopleFirst: {
    recruitment_budget_per_hire: 6500, positions_to_fill: 12, screening_rigor: 3,
    training_budget_per_ee: 1400, pct_employees_trained: 85, salary_vs_market_pct: 108,
    benefits_per_ee: 4800, bonus_pool_pct: 6, engagement_investment: 12000,
    hr_tech_level: 1, dei_training_per_ee: 220, span_of_control: 6,
  },
  innovator: {
    recruitment_budget_per_hire: 7500, positions_to_fill: 14, screening_rigor: 3,
    training_budget_per_ee: 1600, pct_employees_trained: 75, salary_vs_market_pct: 112,
    benefits_per_ee: 4200, bonus_pool_pct: 8, engagement_investment: 9000,
    hr_tech_level: 2, dei_training_per_ee: 180, span_of_control: 7,
  },
  balanced: {
    recruitment_budget_per_hire: 5000, positions_to_fill: 10, screening_rigor: 2,
    training_budget_per_ee: 900, pct_employees_trained: 60, salary_vs_market_pct: 100,
    benefits_per_ee: 3200, bonus_pool_pct: 4, engagement_investment: 6000,
    hr_tech_level: 1, dei_training_per_ee: 120, span_of_control: 8,
  },
  underInvestor: {
    recruitment_budget_per_hire: 2500, positions_to_fill: 4, screening_rigor: 1,
    training_budget_per_ee: 200, pct_employees_trained: 20, salary_vs_market_pct: 88,
    benefits_per_ee: 1200, bonus_pool_pct: 0, engagement_investment: 1000,
    hr_tech_level: 0, dei_training_per_ee: 25, span_of_control: 14,
  },
  bigSpender: {
    recruitment_budget_per_hire: 9000, positions_to_fill: 18, screening_rigor: 3,
    training_budget_per_ee: 2200, pct_employees_trained: 95, salary_vs_market_pct: 118,
    benefits_per_ee: 6000, bonus_pool_pct: 10, engagement_investment: 15000,
    hr_tech_level: 2, dei_training_per_ee: 300, span_of_control: 5,
  },
};

/**
 * Hiring plans and pay bands per persona, written to the V2 JSON columns.
 * The V1 scalars (recruitment_budget_per_hire, salary_vs_market_pct) are
 * marked DEPRECATED in migration-v2 and are ignored by the engine.
 */
const ROLE_PLANS: Record<
  string,
  { hires: Array<{ role_id: string; count: number }>; band: number; bonusTier: number }
> = {
  costCutter: { hires: [{ role_id: "entry", count: 4 }, { role_id: "professional", count: 2 }], band: 0, bonusTier: 5 },
  peopleFirst: { hires: [{ role_id: "entry", count: 3 }, { role_id: "professional", count: 5 }, { role_id: "manager", count: 2 }], band: 0, bonusTier: 5 },
  innovator: { hires: [{ role_id: "professional", count: 6 }, { role_id: "technical", count: 5 }, { role_id: "manager", count: 1 }], band: 0, bonusTier: 5 },
  balanced: { hires: [{ role_id: "entry", count: 3 }, { role_id: "professional", count: 4 }, { role_id: "technical", count: 2 }], band: 0, bonusTier: 5 },
  underInvestor: { hires: [{ role_id: "entry", count: 2 }], band: 0, bonusTier: 5 },
  bigSpender: { hires: [{ role_id: "entry", count: 4 }, { role_id: "professional", count: 6 }, { role_id: "technical", count: 4 }, { role_id: "manager", count: 3 }, { role_id: "executive", count: 1 }], band: 0, bonusTier: 10 },
};

const ALL_ROLES = ["entry", "professional", "technical", "manager", "executive"];

/** Nudges a persona per round so trends move instead of repeating. */
function decisionFor(persona: string, roundIndex: number) {
  const base = PERSONAS[persona];
  const drift = 1 + roundIndex * 0.06;
  const plan = ROLE_PLANS[persona] ?? ROLE_PLANS.balanced;
  return {
    ...base,
    training_budget_per_ee: Math.round(base.training_budget_per_ee * drift),
    engagement_investment: Math.round(base.engagement_investment * drift),
    pct_employees_trained: Math.min(
      100,
      Math.round(base.pct_employees_trained * drift)
    ),
    // V2 columns — these are what the engine actually reads.
    positions_to_fill_json: plan.hires.map((h) => ({
      ...h,
      count: Math.max(1, Math.round(h.count * drift)),
    })),
    role_compensation_json: ALL_ROLES.map((role_id) => ({
      role_id,
      salary_band: plan.band,
    })),
    role_performance_json: ALL_ROLES.map((role_id) => {
      const lift = plan.band >= 10 ? 2 : plan.band <= -10 ? -1 : 0;
      return {
        role_id,
        productivity: 5 + lift,
        teamwork: 5 + lift,
        leadership: (role_id === "manager" || role_id === "executive" ? 7 : 4) + lift,
        communication: 5 + lift,
      };
    }),
    benefits_pct: Math.min(
      20,
      Math.max(6, Math.round((base.benefits_per_ee / 55000) * 100))
    ),
    bonus_tier: plan.bonusTier,
  };
}

const email = (n: number) =>
  `demo.student.${String(n).padStart(2, "0")}@${DEMO_EMAIL_DOMAIN}`;

/**
 * The demo session must belong to the instructor who will actually view it,
 * otherwise it is invisible to them. Defaults to INSTRUCTOR_EMAIL, else the
 * account named on the command line, else the oldest instructor.
 */
async function findInstructor() {
  const wanted =
    process.env.INSTRUCTOR_EMAIL ??
    process.argv.find((a) => a.includes("@"));

  if (wanted) {
    let match: { id: string } | null = null;
    for (let page = 1; page <= 10 && !match; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const hit = data.users.find(
        (u) => u.email?.toLowerCase() === wanted.toLowerCase()
      );
      if (hit) match = { id: hit.id };
      if (data.users.length < 200) break;
    }
    if (!match) throw new Error(`No account found for ${wanted}`);
    const { data: profile } = await db
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", match.id)
      .single();
    if (!profile) throw new Error(`No profile for ${wanted}`);
    if (profile.role !== "instructor") {
      throw new Error(
        `${wanted} has role "${profile.role}" — seed against an instructor account.`
      );
    }
    return profile;
  }

  const { data } = await db
    .from("profiles")
    .select("id, display_name")
    .eq("role", "instructor")
    .order("created_at", { ascending: true })
    .limit(1);
  if (!data?.length) {
    throw new Error(
      "No instructor profile found. Register an instructor account first."
    );
  }
  return data[0];
}

async function listDemoUsers() {
  const found: Array<{ id: string; email: string }> = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`)) {
        found.push({ id: u.id, email: u.email });
      }
    }
    if (data.users.length < 200) break;
  }
  return found;
}

async function teardown() {
  console.log("Removing demo data…\n");

  const { data: sessions } = await db
    .from("sessions")
    .select("id, name")
    .like("name", "[DEMO]%");
  for (const s of sessions ?? []) {
    await db.from("sessions").delete().eq("id", s.id);
    console.log(`  removed session  ${s.name}`);
  }

  const users = await listDemoUsers();
  for (const u of users) {
    await db.from("profiles").delete().eq("id", u.id);
    await db.auth.admin.deleteUser(u.id);
  }
  console.log(`  removed ${users.length} demo student account(s)`);
  console.log("\nDone. Nothing else was touched.");
}

async function seed() {
  const instructor = await findInstructor();
  console.log(`Instructor: ${instructor.display_name} (${instructor.id})\n`);

  // Start clean so re-running is safe and idempotent.
  await teardown();
  console.log("");

  const { data: session, error: sErr } = await db
    .from("sessions")
    .insert({
      instructor_id: instructor.id,
      name: DEMO_SESSION_NAME,
      course_code: "MGMT 454",
      semester: "Demo Term",
      rounds_total: 3,
      practice_rounds: 1,
      status: "active",
      announcement:
        "Round 3 is open — submit your decisions before the deadline.",
    })
    .select()
    .single();
  if (sErr) throw sErr;
  console.log(`Created session  ${session.name}`);

  // 1 practice + 2 competitive. The last one is left OPEN and partly submitted.
  const roundSpecs = [
    { round_number: 1, round_type: "practice", economy_condition: "normal", status: "closed" },
    { round_number: 2, round_type: "competitive", economy_condition: "boom", status: "closed" },
    { round_number: 3, round_type: "competitive", economy_condition: "recession", status: "open" },
  ];
  const { data: rounds, error: rErr } = await db
    .from("rounds")
    .insert(
      roundSpecs.map((r) => ({
        ...r,
        session_id: session.id,
        opened_at: new Date().toISOString(),
        closed_at: r.status === "closed" ? new Date().toISOString() : null,
        leaderboard_released: r.round_number === 2,
      }))
    )
    .select()
    .order("round_number");
  if (rErr) throw rErr;
  console.log(`Created ${rounds.length} rounds (2 closed, 1 open)`);

  // Teams seeded with their industry's real baseline state.
  const teamRows = TEAMS.map((t) => {
    const cfg = getIndustryConfig(t.industry);
    return {
      session_id: session.id,
      name: t.name,
      industry: t.industry,
      strategy: t.strategy,
      headcount: cfg.base_headcount,
      revenue: cfg.base_revenue,
      stock_price: cfg.base_stock_price,
      market_share: cfg.base_market_share,
      profit_margin: cfg.base_profit_margin,
      satisfaction: cfg.base_satisfaction,
      engagement: cfg.base_engagement,
    };
  });
  const { data: teams, error: tErr } = await db
    .from("teams")
    .insert(teamRows)
    .select();
  if (tErr) throw tErr;
  console.log(`Created ${teams.length} teams`);

  // 4 students per team.
  let n = 0;
  for (const [i, team] of teams.entries()) {
    for (let k = 0; k < 4; k++) {
      const first = STUDENT_FIRST[(i * 4 + k) % STUDENT_FIRST.length];
      n += 1;
      const addr = email(n);
      const { data: created, error: uErr } = await db.auth.admin.createUser({
        email: addr,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          role: "student",
          display_name: `${first} ${team.name.split(" ")[0]}`,
        },
      });
      if (uErr) throw uErr;
      await db
        .from("team_members")
        .insert({ team_id: team.id, user_id: created.user.id });
    }
  }
  console.log(`Created ${n} students (4 per team) and enrolled them`);

  // Decisions + real engine outcomes, round by round, carrying state forward.
  for (const [roundIndex, round] of rounds.entries()) {
    const isOpen = round.status === "open";
    let submittedCount = 0;

    for (const [teamIndex, team] of teams.entries()) {
      // On the open round, leave two teams mid-flight so the professor sees a
      // partially-submitted window rather than a finished one.
      const stillWorking = isOpen && teamIndex >= teams.length - 2;

      const { data: members } = await db
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id)
        .limit(1);

      const decision = {
        team_id: team.id,
        round_id: round.id,
        ...decisionFor(TEAMS[teamIndex].persona, roundIndex),
        is_submitted: !stillWorking,
        submitted_by: stillWorking ? null : members?.[0]?.user_id ?? null,
        submitted_at: stillWorking ? null : new Date().toISOString(),
      };
      const { data: decisionRow, error: dErr } = await db
        .from("decisions")
        .insert(decision)
        .select()
        .single();
      if (dErr) throw dErr;
      if (!stillWorking) submittedCount += 1;

      // Only closed rounds get computed, exactly as the app does.
      if (round.status !== "closed") continue;

      const prior = roundIndex > 0 ? rounds[roundIndex - 1] : null;
      let priorMetrics = null;
      if (prior) {
        const { data: priorOutcome } = await db
          .from("outcomes")
          .select("*")
          .eq("team_id", team.id)
          .eq("round_id", prior.id)
          .maybeSingle();
        if (priorOutcome) priorMetrics = priorMetricsFromOutcome(priorOutcome);
      }

      const { data: freshTeam } = await db
        .from("teams")
        .select("*")
        .eq("id", team.id)
        .single();

      const { outcome, newCarryover } = computeTeamOutcome(
        decisionRow,
        freshTeam as unknown as Team,
        round.economy_condition as EconomyCondition,
        priorMetrics
      );

      await db
        .from("outcomes")
        .upsert(outcomeToDbRow(team.id, round.id, outcome), {
          onConflict: "team_id,round_id",
        });
      await db
        .from("teams")
        .update(teamStateUpdateFromOutcome(outcome, newCarryover))
        .eq("id", team.id);
    }

    console.log(
      `  round ${round.round_number} (${round.round_type}, ${round.economy_condition}) ` +
        `${round.status} — ${submittedCount}/${teams.length} submitted` +
        (round.status === "closed" ? ", outcomes computed" : "")
    );
  }

  console.log(`
Done.

  Session      ${DEMO_SESSION_NAME}
  Teams        ${teams.length} across all 5 industries
  Students     ${n}  (${email(1)} … ${email(n)})
  Password     ${DEMO_PASSWORD}
  Rounds       1 practice + 2 competitive; round 3 open with ${teams.length - 2}/${teams.length} submitted

Sign in as your instructor and open /sessions to see it.
Remove it all with:  npx tsx scripts/seed-demo.ts teardown
`);
}

const mode = process.argv.includes("teardown") ? "teardown" : "seed";
(mode === "teardown" ? teardown() : seed()).catch((e) => {
  console.error("\nFailed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
