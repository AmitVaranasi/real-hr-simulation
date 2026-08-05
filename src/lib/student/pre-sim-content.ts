export type PreSimSlug =
  | "recruitment"
  | "performance"
  | "training"
  | "relations"
  | "compensation"
  | "org-design"
  | "dei";

export type PreSimContent = {
  title: string;
  subtitle: string;
  intro: string;
  whatIs: string;
  whyCards: Array<{ title: string; body: string }>;
  decisions: string[];
  thinkLike: string;
  connecting: string;
  pathway: string;
};

export const PRE_SIM_MODULES: Record<PreSimSlug, PreSimContent> = {
  recruitment: {
    title: "Recruitment & Selection",
    subtitle: "Building the Workforce Your Organization Needs",
    intro:
      "Recruitment & Selection involves identifying workforce needs, attracting candidates, evaluating talent, and making hiring decisions that support organizational goals. In the Real HR Simulation, recruitment is not simply filling positions — students must consider workforce capability, strategy, and available resources.",
    whatIs:
      "Attracting potential employees and selecting candidates who meet organizational needs are related but distinct activities. HR professionals balance cost, speed, candidate quality, workforce demand, and organizational strategy within a broader organizational system.",
    whyCards: [
      {
        title: "Talent Availability",
        body: "Recruitment helps determine whether the organization has sufficient employees and capabilities to perform its work.",
      },
      {
        title: "Workforce Quality",
        body: "Hiring decisions influence the knowledge, skills, capabilities, and potential entering the organization.",
      },
      {
        title: "Employee Experience",
        body: "Recruitment and onboarding create some of the employee's earliest organizational experiences.",
      },
      {
        title: "Organizational Performance",
        body: "Talent decisions can influence capacity, productivity, costs, retention, and business performance.",
      },
    ],
    decisions: [
      "Workforce hiring needs",
      "Recruitment spending and resource allocation",
      "Recruiting channels and approaches",
      "Candidate quality and selection priorities",
      "Onboarding investments",
      "Tradeoffs between recruitment and other HR investments",
    ],
    thinkLike:
      "Faster hiring may require additional resources, and greater investment does not automatically produce better outcomes. Consider strategy, workforce conditions, organizational needs, and available resources.",
    connecting:
      "Recruitment & Selection decisions may interact with Compensation & Benefits, Training & Development, Performance Management, Employee Relations, DEI Initiatives, and other areas of the simulation.",
    pathway:
      "Recruitment Decisions → Workforce Outcomes → Organizational Outcomes",
  },
  performance: {
    title: "Performance Management",
    subtitle: "Aligning Effort, Feedback, and Accountability",
    intro:
      "Performance Management helps organizations clarify expectations, evaluate contribution, develop capability, and connect individual work to organizational goals.",
    whatIs:
      "Performance systems include goal setting, feedback, reviews, recognition, and developmental conversations. Effective systems balance accountability with support for growth.",
    whyCards: [
      {
        title: "Clarity",
        body: "Employees perform better when expectations and priorities are clear.",
      },
      {
        title: "Capability",
        body: "Feedback and reviews help identify strengths, gaps, and development needs.",
      },
      {
        title: "Motivation",
        body: "Fair, timely performance conversations influence engagement and effort.",
      },
      {
        title: "Results",
        body: "Aligned performance systems support productivity and strategic execution.",
      },
    ],
    decisions: [
      "Review frequency and cadence",
      "Performance criteria by role",
      "Feedback mechanisms such as 360° input",
      "Balance between evaluation and development",
      "Tradeoffs with compensation and training investments",
    ],
    thinkLike:
      "More frequent reviews or more complex systems are not automatically better. Fit the performance approach to strategy, workforce maturity, and managerial capacity.",
    connecting:
      "Performance Management connects closely with Training & Development, Compensation & Benefits, Employee Relations, and Org Design.",
    pathway:
      "Performance Decisions → Workforce Capability → Organizational Performance",
  },
  training: {
    title: "Training & Development",
    subtitle: "Building Capability for Today and Tomorrow",
    intro:
      "Training & Development investments shape what the workforce can do now and how ready the organization is for future challenges.",
    whatIs:
      "Learning systems include skill programs, leadership development, coverage across the workforce, and succession investments that strengthen the talent pipeline.",
    whyCards: [
      {
        title: "Skill Readiness",
        body: "Training builds the capabilities needed to execute strategy.",
      },
      {
        title: "Adaptability",
        body: "Development helps organizations respond to change and complexity.",
      },
      {
        title: "Retention",
        body: "Growth opportunities influence whether talent stays and advances.",
      },
      {
        title: "Pipeline Strength",
        body: "Succession investment prepares future leaders and critical roles.",
      },
    ],
    decisions: [
      "Developmental program mix",
      "Percentage of employees trained",
      "Training budget intensity",
      "Succession investment",
      "Tradeoffs with recruitment and compensation spend",
    ],
    thinkLike:
      "Spending more on training does not guarantee higher returns. Align learning investments with strategy, skill gaps, and other HR systems.",
    connecting:
      "Training interacts with Performance Management, Recruitment, Compensation, DEI, and Org Design & Change.",
    pathway:
      "Learning Decisions → Capability Outcomes → Organizational Results",
  },
  relations: {
    title: "Employee Relations",
    subtitle: "Shaping Experience, Voice, and Workplace Climate",
    intro:
      "Employee Relations decisions influence how people experience work, resolve conflict, use their voice, and stay engaged.",
    whatIs:
      "This area covers engagement investment, conflict approaches, flexibility, and voice mechanisms that shape the day-to-day employee experience.",
    whyCards: [
      {
        title: "Engagement",
        body: "Investment in the employee experience can strengthen commitment and discretionary effort.",
      },
      {
        title: "Trust",
        body: "Fair conflict handling and voice systems build organizational trust.",
      },
      {
        title: "Flexibility",
        body: "Work arrangements influence satisfaction, retention, and productivity.",
      },
      {
        title: "Climate",
        body: "Relations choices shape collaboration, absenteeism, and turnover risk.",
      },
    ],
    decisions: [
      "Engagement investment levels",
      "Conflict approach",
      "Workplace flexibility",
      "Voice mechanisms",
      "Tradeoffs with DEI inclusion and compensation fairness",
    ],
    thinkLike:
      "Employee Relations is not only about spending. Coherence with equity, inclusion, performance, and leadership practices matters.",
    connecting:
      "Employee Relations connects strongly with DEI Initiatives, Compensation, Performance Management, and Org Design.",
    pathway:
      "Relations Decisions → Employee Experience → Organizational Outcomes",
  },
  compensation: {
    title: "Compensation & Benefits",
    subtitle: "Balancing Competitiveness, Fairness, and Affordability",
    intro:
      "Compensation & Benefits decisions affect talent attraction, retention, motivation, and the organization's financial flexibility.",
    whatIs:
      "Total rewards include salary positioning, benefits, bonuses, equity, and supporting HR technology that enables workforce administration and insight.",
    whyCards: [
      {
        title: "Competitiveness",
        body: "Pay positioning influences ability to attract and retain talent.",
      },
      {
        title: "Motivation",
        body: "Bonus and recognition structures can reinforce desired performance.",
      },
      {
        title: "Fairness",
        body: "Equity and benefits choices affect trust and perceived justice.",
      },
      {
        title: "Financial Impact",
        body: "Compensation decisions directly affect cost structure and budget adherence.",
      },
    ],
    decisions: [
      "Salary bands by role",
      "Benefits intensity",
      "Bonus tiers",
      "Equity offerings",
      "HR technology investment",
    ],
    thinkLike:
      "Compensation should not teach students to spend more — it should teach balance among competitiveness, employee outcomes, and financial performance.",
    connecting:
      "Compensation interacts with Recruitment, Performance, DEI equity practices, and financial results.",
    pathway:
      "Rewards Decisions → Talent & Cost Outcomes → Organizational Performance",
  },
  "org-design": {
    title: "Org Design & Change",
    subtitle: "Structuring Work, Coordination, and Adaptability",
    intro:
      "Org Design & Change decisions shape how work is structured, how managers supervise, how processes operate, and how ready the organization is for change.",
    whatIs:
      "Organizational design includes structure type, span of control, process focus, change capability, and collaboration enablement. There is no universally best design — fit matters.",
    whyCards: [
      {
        title: "Efficiency",
        body: "Structure and process choices influence specialization and coordination costs.",
      },
      {
        title: "Agility",
        body: "Design choices affect how quickly the organization can adapt.",
      },
      {
        title: "Collaboration",
        body: "Enablement tools and practices shape cross-functional problem solving.",
      },
      {
        title: "Change Readiness",
        body: "Change capability supports strategy shifts, restructuring, and transformation.",
      },
    ],
    decisions: [
      "Organizational structure",
      "Span of control",
      "Process focus",
      "Change management capability",
      "Collaboration enablement",
    ],
    thinkLike:
      "Do not treat higher sophistication as automatically better. Ask how well the design fits strategy, industry, workforce, and other HR systems.",
    connecting:
      "Org Design interacts with Performance Management, Training, Employee Relations, DEI, and strategy execution.",
    pathway:
      "Design Decisions → Operating Model Outcomes → Strategic Execution",
  },
  dei: {
    title: "DEI Initiatives",
    subtitle: "Building Inclusive Systems That Support Performance",
    intro:
      "DEI Initiatives focus on how organizations expand opportunity, strengthen equity, foster inclusion, and support accessibility across the workforce.",
    whatIs:
      "DEI is a portfolio of practices — talent pipelines, equity systems, inclusion initiatives, education, and accessibility — not a single spending lever.",
    whyCards: [
      {
        title: "Talent Access",
        body: "Broader pipelines expand the organization's access to capability.",
      },
      {
        title: "Equity",
        body: "Fair processes support trust, opportunity, and retention.",
      },
      {
        title: "Belonging",
        body: "Inclusion initiatives shape employee experience and collaboration.",
      },
      {
        title: "Capability",
        body: "Education and accessibility strengthen participation and innovation.",
      },
    ],
    decisions: [
      "Diverse recruitment & talent pipelines",
      "Equity practices",
      "Inclusion initiatives",
      "Training & education",
      "Accessibility & support",
    ],
    thinkLike:
      "A team can invest heavily in attracting diverse talent but underinvest in inclusion or equity — and still struggle with experience and retention. Coherence matters.",
    connecting:
      "DEI connects with Recruitment, Compensation, Performance, Employee Relations, Training, and Org Design.",
    pathway:
      "DEI Decisions → Workforce Outcomes → Organizational Outcomes",
  },
};
