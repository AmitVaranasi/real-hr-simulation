export const HELP_POPULAR_SEARCHES = [
  { label: "Submitting decisions", href: "/help/faq#submit-decisions" },
  { label: "Workforce Brief", href: "/help/reports" },
  { label: "Changing an HR decision", href: "/help/decisions" },
  { label: "Team access", href: "/help/faq#team" },
  { label: "Understanding scores", href: "/help/reports" },
] as const;

export const HELP_CATEGORIES = [
  {
    href: "/help/getting-started",
    title: "Getting Started",
    description:
      "Learn how the simulation works and how to prepare for your first round.",
    action: "Explore Getting Started",
    iconKey: "rocket" as const,
    accent: "blue" as const,
  },
  {
    href: "/help/navigation",
    title: "Simulation Navigation",
    description:
      "Learn where simulation functions are located and how to move through the student portal.",
    action: "Explore Simulation Navigation",
    iconKey: "map" as const,
    accent: "green" as const,
  },
  {
    href: "/help/decisions",
    title: "Making HR Decisions",
    description:
      "Learn how to enter, save, revise, and review HR decisions and understand interface features such as ranges and warnings.",
    action: "Explore Decision Guidance",
    iconKey: "sliders" as const,
    accent: "orange" as const,
  },
  {
    href: "/help/reports",
    title: "Reports & Results",
    description:
      "Learn how to locate and navigate The Workforce Brief, HR Balance Scorecard, workforce metrics, and financial reports.",
    action: "Understand Reports & Results",
    iconKey: "chart" as const,
    accent: "purple" as const,
  },
  {
    href: "/help/faq",
    title: "Frequently Asked Questions",
    description:
      "Provide quick answers to common questions about rounds, teams, decisions, submissions, reports, and simulation functions.",
    action: "View FAQs",
    iconKey: "faq" as const,
    accent: "teal" as const,
  },
  {
    href: "/help/technical-support",
    title: "Technical Support",
    description:
      "Provide troubleshooting for login, loading, saving, submission, browser, team-access, and system-error issues.",
    action: "Troubleshoot a Problem",
    iconKey: "wrench" as const,
    accent: "pink" as const,
  },
] as const;

export const HELP_QUICK_LINKS = [
  {
    href: "/help/getting-started#where-do-i-start",
    title: "Where Do I Start?",
    description: "Return to the Getting Started pathway.",
    iconKey: "play" as const,
  },
  {
    href: "/help/faq#submit-decisions",
    title: "How Do I Submit Decisions?",
    description: "Review the decision submission process.",
    iconKey: "submit" as const,
  },
  {
    href: "/help/reports",
    title: "Where Are My Results?",
    description: "Locate The Workforce Brief and reports.",
    iconKey: "results" as const,
  },
  {
    href: "/help/reports",
    title: "Understanding My Score",
    description: "Learn how performance information is organized.",
    iconKey: "score" as const,
  },
  {
    href: "/help/technical-support",
    title: "I Can't Log In",
    description: "Get help with login and access issues.",
    iconKey: "login" as const,
  },
] as const;

export const GETTING_STARTED_QUESTIONS = [
  {
    id: "where-do-i-start",
    title: "1. Where Do I Start?",
    summary:
      "Learn the recommended pathway after first signing in and the key areas to review before entering your first round.",
    answer:
      "After signing in, begin with Getting Started for orientation. Review Welcome & Orientation, then Industry & Strategy Brief, Team & Company information, and relevant Resources. When ready, move to Dashboard and HR Decisions.",
    links: [
      { label: "Go to Getting Started →", href: "/dashboard/getting-started" },
      { label: "Go to Dashboard →", href: "/dashboard" },
    ],
  },
  {
    id: "review-before-round-1",
    title: "2. What Should I Review Before Round 1?",
    summary:
      "See the important preparation steps and resources that will help your team make more informed decisions.",
    answer:
      "Before Round 1, review Welcome & Orientation, Company Profile, Industry & Strategy Brief, team information, HR Decision Learning materials, Simulation Resources, and current round status. Do not treat this as strategy advice—use it to orient yourself.",
    links: [
      { label: "Company Profile →", href: "/team" },
      { label: "Industry & Strategy Brief →", href: "/team/industry-strategy" },
      { label: "Learning Guides →", href: "/resources/learning-guides" },
    ],
  },
  {
    id: "getting-started-vs-dashboard",
    title: "3. What Is the Difference Between Getting Started and Dashboard?",
    summary:
      "Understand how these two areas work together and when to use each one.",
    answer:
      "Getting Started is preparation and orientation. Dashboard is your active simulation status and operational overview—round status, alerts, and quick access to important tasks.",
    links: [
      { label: "Getting Started →", href: "/dashboard/getting-started" },
      { label: "Dashboard →", href: "/dashboard" },
    ],
  },
  {
    id: "what-round",
    title: "4. How Do I Know What Round I Am In?",
    summary:
      "Learn how rounds work and where to find your current round, industry, strategy, and economy information.",
    answer:
      "Your current round, round status, industry, strategy, and economy appear on the Dashboard and in Your Simulation context across the portal. Round status tells you whether the round is open for decisions.",
    links: [{ label: "Go to Dashboard →", href: "/dashboard" }],
  },
  {
    id: "company-team",
    title: "5. Where Do I Find My Company and Team Information?",
    summary:
      "Find your company profile, team members, instructor info, industry, and strategy brief.",
    answer:
      "Review organization and team information under Team & Company.",
    links: [
      { label: "Go to Company Profile →", href: "/team" },
      { label: "Go to My Team →", href: "/team/members" },
      { label: "Instructor Information →", href: "/team/instructor" },
    ],
  },
  {
    id: "ready-to-begin",
    title: "6. How Do I Know When I Am Ready to Begin?",
    summary:
      "Use this checklist to make sure your team is prepared before making your first decisions.",
    answer:
      "You are ready when you have reviewed orientation, company and industry context, team roles, and key Resources. Then enter HR Decisions while the round is open.",
    links: [
      { label: "Go to Getting Started →", href: "/dashboard/getting-started" },
      { label: "Go to HR Decisions →", href: "/decisions" },
    ],
  },
] as const;

export const NAVIGATION_AREAS = [
  {
    href: "/dashboard/getting-started",
    title: "Getting Started",
    description:
      "Complete orientation, review company and industry information, and prepare for your first round.",
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    description:
      "See round status, key alerts, financial snapshot, progress, and quick access to important tasks.",
  },
  {
    href: "/decisions",
    title: "HR Decisions",
    description:
      "Make strategic HR decisions across the seven functional areas that influence organizational performance.",
  },
  {
    href: "/review",
    title: "Review & Submit",
    description:
      "Review all decisions, identify inconsistencies, examine budget impact and projections, and submit the team's decisions.",
  },
  {
    href: "/reports/workforce-brief",
    title: "Reports & HR Analytics",
    description:
      "Analyze results through The Workforce Brief, scorecards, workforce metrics, feedback, and financial reports.",
  },
  {
    href: "/team",
    title: "Team & Company",
    description:
      "Access team members, company information, instructor information, and the Industry & Strategy Brief.",
  },
  {
    href: "/resources",
    title: "Resources",
    description:
      "Access HR Decision Learning Guides, Simulation Reference Center, HR Metrics Reference, and course resources.",
  },
  {
    href: "/help",
    title: "Help Center",
    description:
      "Access navigation guidance, FAQs, troubleshooting, and technical support.",
  },
] as const;

export const DECISION_TOPICS = [
  {
    href: "/help/decisions#overview",
    number: "1",
    title: "Overview",
    description:
      "Understand the decision process from selecting an HR module through reviewing and submitting decisions.",
  },
  {
    href: "/help/decisions#interface",
    number: "2",
    title: "How the Interface Works",
    description:
      "Explain sliders, dropdowns, input fields, decision cards, and other interface controls.",
  },
  {
    href: "/help/decisions#ranges",
    number: "3",
    title: "Suggested Ranges",
    description:
      "Explain what suggested ranges represent and how students should use them as contextual guidance.",
  },
  {
    href: "/help/decisions#warnings",
    number: "4",
    title: "Warnings & Alerts",
    description:
      "Explain the meaning of warnings and alerts and how students can review potential issues before submission.",
  },
  {
    href: "/help/decisions#budget",
    number: "5",
    title: "Budget Impact",
    description:
      "Explain how decisions affect the discretionary HR budget, module investment, remaining budget, and total HR spending.",
  },
  {
    href: "/help/decisions#save",
    number: "6",
    title: "Save & Edit Decisions",
    description:
      "Explain how decisions are saved, how students can return to a module, and how decisions can be revised while the round remains open.",
  },
  {
    href: "/help/decisions#review",
    number: "7",
    title: "Review Before Submitting",
    description:
      "Explain how students use Review & Submit to review all seven HR Decision areas and prepare the team's final decisions.",
  },
  {
    href: "/help/decisions#modules",
    number: "8",
    title: "Moving Between Modules",
    description:
      "Explain how students navigate among the seven HR Decision modules and how decisions across modules form overall HR strategy.",
  },
] as const;

export const REPORT_TOPICS = [
  {
    href: "/help/reports#overview",
    number: "1",
    title: "Overview",
    description:
      "Understand the reporting system and how results are generated in the simulation.",
  },
  {
    href: "/reports/workforce-brief",
    number: "2",
    title: "The Workforce Brief",
    description:
      "Learn how to read and navigate The Workforce Brief and what each section means.",
  },
  {
    href: "/help/reports#scorecard",
    number: "3",
    title: "HR Balance Scorecard",
    description:
      "Understand the four perspectives, how scores are organized, and what drives performance.",
  },
  {
    href: "/help/reports#workforce",
    number: "4",
    title: "Workforce Performance",
    description:
      "Explore workforce metrics including engagement, retention, productivity, and diversity.",
  },
  {
    href: "/reports/balance-sheet",
    number: "5",
    title: "Financial Reports",
    description:
      "Understand the financial statements, ratios, and what they reveal about your company.",
  },
  {
    href: "/help/reports#feedback",
    number: "6",
    title: "Feedback & Coaching",
    description:
      "Learn how to use feedback from the system to guide your team's next actions.",
  },
  {
    href: "/help/reports#trends",
    number: "7",
    title: "Trends & Benchmarks",
    description:
      "See how to analyze trends over time and compare performance to benchmarks.",
  },
  {
    href: "/help/reports#export",
    number: "8",
    title: "Export & Save Reports",
    description:
      "Learn how to download, save, and share reports for team and course requirements.",
  },
] as const;

export const FAQ_TOPICS = [
  { id: "getting-started", title: "Getting Started", count: 8 },
  { id: "decisions", title: "Making Decisions", count: 10 },
  { id: "reports", title: "Reports & Results", count: 9 },
  { id: "team", title: "Team & Company", count: 7 },
  { id: "technical", title: "Technical", count: 6 },
  { id: "account", title: "Account & Access", count: 6 },
] as const;

export const FAQ_QUESTIONS = [
  {
    id: "find-reports",
    topic: "reports",
    question: "Where can I find my reports and results?",
    answer:
      "Access reports from Reports & HR Analytics in the left menu. Open The Workforce Brief for your team's performance summary, scorecards, metrics, and feedback.",
    links: [
      { label: "Go to The Workforce Brief →", href: "/reports/workforce-brief" },
    ],
  },
  {
    id: "submit-decisions",
    topic: "decisions",
    question: "How do I submit my team's decisions?",
    answer:
      "Complete decisions in each HR module, then go to Review & Submit. Review budget impact and warnings, then submit while the round is open.",
    links: [{ label: "Go to Review & Submit →", href: "/review" }],
  },
  {
    id: "change-after-submit",
    topic: "decisions",
    question: "Can we change our decisions after submitting?",
    answer:
      "While the round remains open, your team may revise decisions according to simulation rules. After the instructor closes the round, submitted decisions are locked for that round.",
    links: [{ label: "Making HR Decisions Help →", href: "/help/decisions" }],
  },
  {
    id: "suggested-ranges",
    topic: "decisions",
    question: "What do the suggested ranges mean?",
    answer:
      "Suggested ranges provide contextual guidance based on industry, strategy, and conditions. They are not correct answers, and decisions outside a range may be intentional.",
    links: [{ label: "Suggested Ranges topic →", href: "/help/decisions#ranges" }],
  },
  {
    id: "score-calculated",
    topic: "reports",
    question: "How is our team's overall score calculated?",
    answer:
      "Overall performance is organized through the HR Balance Scorecard perspectives. Help Center explains where to find scores; deeper metric definitions live in Resources.",
    links: [
      { label: "Reports & Results Help →", href: "/help/reports" },
      { label: "HR Metrics Reference →", href: "/resources/metrics" },
    ],
  },
  {
    id: "learn-metrics",
    topic: "reports",
    question: "Where can I learn more about the metrics?",
    answer:
      "Use Resources → HR Metrics Reference for definitions and why metrics matter. The Workforce Brief shows your team's actual values.",
    links: [{ label: "HR Metrics Reference →", href: "/resources/metrics" }],
  },
  {
    id: "over-budget",
    topic: "decisions",
    question: "What happens if we go over the HR budget?",
    answer:
      "Budget displays show discretionary HR budget, amount used, and remaining. Warnings may appear when decisions create budget pressure. Review budget impact before submitting.",
    links: [{ label: "Budget Impact topic →", href: "/help/decisions#budget" }],
  },
  {
    id: "contact-support",
    topic: "technical",
    question: "How do I contact technical support?",
    answer:
      "Use Help Center → Technical Support to troubleshoot common issues or report a technical problem. Course-specific questions should go to your instructor.",
    links: [
      { label: "Technical Support →", href: "/help/technical-support" },
      { label: "Instructor Information →", href: "/team/instructor" },
    ],
  },
] as const;

export const TROUBLESHOOT_CATEGORIES = [
  {
    title: "Login & Access",
    description:
      "Problems signing in, password reset, or accessing your simulation.",
  },
  {
    title: "Navigation & Pages",
    description:
      "Can't find a page, buttons not working, or screens not loading correctly.",
  },
  {
    title: "Decisions & Submissions",
    description:
      "Issues submitting decisions, errors, or missing confirmation messages.",
  },
  {
    title: "Reports & Results",
    description:
      "Can't view reports, missing data, or reports not updating as expected.",
  },
  {
    title: "Technical Issues",
    description:
      "Errors, slow performance, display problems, or other technical difficulties.",
  },
] as const;

export const TECH_SUPPORT_STEPS = [
  "Refresh the page.",
  "Confirm you are connected to the internet.",
  "Sign out and sign back in.",
  "Try a supported/current browser.",
  "Check the Technical Support guide.",
] as const;
