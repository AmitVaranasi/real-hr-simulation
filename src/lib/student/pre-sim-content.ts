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
  whatIsTitle: string;
  whatIs: string;
  whyCards: Array<{ title: string; body: string }>;
  decisions: string[];
  thinkLike: string;
  connectingTitle: string;
  connecting: string;
  flow: {
    decisionsLabel: string;
    decisionsItems: string[];
    workforceItems: string[];
    orgItems: string[];
  };
  beforeQuestions: string[];
  challenge: string;
  heroImage: string;
};

export const PRE_SIM_MODULES: Record<PreSimSlug, PreSimContent> = {
  recruitment: {
    title: "Recruitment & Selection",
    subtitle: "Building the Workforce Your Organization Needs",
    intro:
      "Recruitment and Selection is the process of identifying workforce needs, attracting qualified candidates, evaluating talent, and making hiring decisions that support organizational goals. In the Real HR Simulation, recruitment is not simply about filling open positions. Your team must consider how talent decisions affect workforce capability, organizational performance, and the resources available for other HR priorities.",
    whatIsTitle: "1. What Is Recruitment & Selection?",
    whatIs:
      "Organizations need the right people, with the right capabilities, at the right time. Recruitment focuses on attracting potential employees, while selection involves determining which candidates best meet organizational needs. Effective talent acquisition requires HR professionals to balance multiple considerations—including cost, speed, candidate quality, workforce demand, and organizational strategy. The simulation will ask your team to make these decisions within a broader organizational environment rather than treating recruitment as an isolated HR activity.",
    whyCards: [
      {
        title: "Talent Availability",
        body: "Recruitment determines whether the organization has enough employees with the capabilities needed to perform its work.",
      },
      {
        title: "Workforce Quality",
        body: "Hiring decisions influence the knowledge, skills, capabilities, and potential brought into the organization.",
      },
      {
        title: "Employee Experience",
        body: "Recruitment and onboarding create some of the earliest experiences employees have with an organization.",
      },
      {
        title: "Organizational Performance",
        body: "Talent decisions can influence workforce capacity, productivity, costs, retention, and ultimately business performance.",
      },
    ],
    decisions: [
      "Workforce hiring needs",
      "Recruitment spending and resource allocation",
      "Recruiting channels and approaches",
      "Time and resources devoted to filling positions",
      "Candidate quality and selection priorities",
      "Onboarding investments",
      "Staffing levels and workforce capacity",
      "Tradeoffs between recruitment and other HR investments",
    ],
    thinkLike:
      "Every recruitment decision involves tradeoffs. Faster hiring may require additional resources. Greater investment does not automatically guarantee better results. Your responsibility is to consider what your organization needs and make decisions consistent with its strategy, workforce conditions, and available resources.",
    connectingTitle: "4. Connecting Recruitment to the Organization",
    connecting:
      "Recruitment decisions do not operate independently. Decisions made in this area may interact with Compensation & Benefits, Training & Development, Performance Management, Employee Relations, DEI Initiatives, and other areas of the simulation.",
    flow: {
      decisionsLabel: "Recruitment Decisions",
      decisionsItems: [
        "Hiring",
        "Recruiting Investment",
        "Selection",
        "Onboarding",
      ],
      workforceItems: [
        "Staffing",
        "Hiring Quality",
        "Employee Experience",
        "Retention",
        "Capability",
      ],
      orgItems: [
        "Productivity",
        "Costs",
        "Financial Performance",
        "Strategic Performance",
      ],
    },
    beforeQuestions: [
      "What talent does our organization need to execute its strategy?",
      "What tradeoffs might we face between hiring speed, cost, and workforce quality?",
      "How could today's recruitment decisions affect the organization in future rounds?",
    ],
    challenge:
      "The challenge is to manage the workforce as an interconnected system.",
    heroImage: "/pre-sim/recruitment.jpg",
  },
  performance: {
    title: "Performance Management",
    subtitle: "Driving Performance, Development, and Results",
    intro:
      "Performance Management is the process of setting expectations, providing feedback, evaluating results, and supporting employee growth. In the Real HR Simulation, your team's performance management decisions influence employee motivation, capability, retention, and organizational outcomes. Effective performance management aligns individual performance with organizational goals and creates a culture of accountability and continuous improvement.",
    whatIsTitle: "1. What Is Performance Management?",
    whatIs:
      "Performance Management ensures that employees understand what is expected of them, receive ongoing feedback, and are evaluated fairly based on their contributions and competencies. It includes goal setting, performance monitoring, feedback, evaluation, recognition, and development planning. In the simulation, you will make decisions that affect how employees are evaluated, developed, and rewarded for their contributions to the organization.",
    whyCards: [
      {
        title: "Aligns Effort with Strategy",
        body: "Helps ensure employees focus on activities that support organizational priorities and goals.",
      },
      {
        title: "Improves Performance and Productivity",
        body: "Clear expectations, feedback, and coaching help employees improve and contribute more effectively.",
      },
      {
        title: "Supports Employee Growth and Retention",
        body: "Ongoing feedback and development opportunities increase engagement, satisfaction, and retention.",
      },
      {
        title: "Drives Organizational Results",
        body: "Strong performance management practices influence quality, efficiency, costs, and financial outcomes.",
      },
    ],
    decisions: [
      "Performance expectations and goal setting",
      "Performance evaluation criteria and standards",
      "Feedback frequency and quality",
      "Performance review process design",
      "Recognition and rewards for high performance",
      "Corrective action and performance improvement support",
      "Development plans and career growth opportunities",
      "Allocating time and resources to performance programs",
    ],
    thinkLike:
      "Performance management is about more than evaluation. Consider how your decisions will impact employee motivation, behavior, skill development, and long-term organizational success. Every choice involves tradeoffs and should align with your strategy and available resources.",
    connectingTitle: "4. Connecting Performance Management to the Organization",
    connecting:
      "Performance management decisions interact with many other HR areas and influence results across the organization.",
    flow: {
      decisionsLabel: "Performance Management Decisions",
      decisionsItems: [
        "Goal Setting",
        "Evaluations",
        "Feedback",
        "Recognition",
        "Development Support",
      ],
      workforceItems: [
        "Employee Performance",
        "Engagement",
        "Skills and Capability",
        "Motivation",
        "Retention",
      ],
      orgItems: [
        "Productivity",
        "Quality",
        "Costs",
        "Financial Performance",
        "Strategic Performance",
      ],
    },
    beforeQuestions: [
      "What performance expectations will help our organization achieve its goals?",
      "How will we balance recognition, feedback, and development in our approach?",
      "How could our performance management decisions impact employees in future rounds?",
    ],
    challenge:
      "The challenge is to create a performance culture that drives results while developing people and sustaining engagement.",
    heroImage: "/pre-sim/performance.jpg",
  },
  training: {
    title: "Training & Development",
    subtitle: "Building Skills, Strengthening Capability, Driving Growth",
    intro:
      "Training & Development (T&D) helps employees build the knowledge, skills, and capabilities they need to perform today and prepare for tomorrow. In the Real HR Simulation, your team's T&D decisions influence employee capability, productivity, innovation, retention, and long-term organizational results. Effective T&D ensures that your workforce has the right skills, at the right time, to support organizational strategy and adapt to change.",
    whatIsTitle: "1. What Is Training & Development?",
    whatIs:
      "Training & Development involves planned activities that improve employee skills, expand competencies, and enhance performance. It includes onboarding and foundational training, technical training, leadership development, compliance training, and career development. In the simulation, you will decide how to invest in learning and development to close skill gaps, improve performance, and support your organization's future needs.",
    whyCards: [
      {
        title: "Enhances Skills and Capability",
        body: "Employees gain the knowledge and skills they need to perform effectively in their current roles and future roles.",
      },
      {
        title: "Improves Performance and Innovation",
        body: "Well-designed training improves productivity, quality, and supports innovation and continuous improvement.",
      },
      {
        title: "Supports Engagement and Retention",
        body: "Investing in employee growth increases engagement, motivation, and the likelihood that employees stay.",
      },
      {
        title: "Drives Organizational Growth",
        body: "A capable workforce helps organizations adapt to change, compete more effectively, and achieve strategic objectives.",
      },
    ],
    decisions: [
      "Identifying skill gaps and training needs",
      "Allocating training budgets across programs",
      "Choosing training types and delivery methods",
      "Balancing mandatory (compliance) vs. developmental training",
      "Investing in leadership and career development",
      "Scheduling training and managing time away from work",
      "Measuring training effectiveness",
      "Tradeoffs between training investment and other HR priorities",
    ],
    thinkLike:
      "Training is an investment, and every investment involves tradeoffs. More training is not always the answer. Consider the needs of your workforce, the returns you expect, and how your decisions align with your strategy, resources, and other HR priorities.",
    connectingTitle: "4. Connecting Training & Development to the Organization",
    connecting:
      "Training & Development decisions interact with many other HR areas and influence results across the organization.",
    flow: {
      decisionsLabel: "T&D Decisions",
      decisionsItems: [
        "Needs Assessment",
        "Training Investment",
        "Program Selection",
        "Delivery Methods",
        "Development Support",
      ],
      workforceItems: [
        "Skills and Capability",
        "Employee Performance",
        "Engagement",
        "Adaptability",
        "Retention",
      ],
      orgItems: [
        "Productivity",
        "Quality",
        "Innovation",
        "Costs",
        "Financial Performance",
        "Strategic Performance",
      ],
    },
    beforeQuestions: [
      "What skills and capabilities are most critical for our organization right now?",
      "How will we balance short-term performance needs with long-term development?",
      "How could our training decisions impact employees and results in future rounds?",
    ],
    challenge:
      "The challenge is to build a learning culture that strengthens capability today and prepares your organization for future success.",
    heroImage: "/pre-sim/training.jpg",
  },
  relations: {
    title: "Employee Relations",
    subtitle:
      "Building Respectful Relationships, Resolving Issues, Strengthening the Workplace",
    intro:
      "Employee Relations (ER) focuses on creating a fair, respectful, and productive work environment. It involves managing workplace concerns, resolving conflicts, ensuring policy compliance, and fostering open communication. In the Real HR Simulation, your ER decisions influence employee satisfaction, trust, productivity, retention, and overall organizational health.",
    whatIsTitle: "1. What Is Employee Relations?",
    whatIs:
      "Employee Relations involves managing the employee experience by addressing concerns, resolving conflicts, enforcing workplace policies, and supporting a positive and inclusive culture. It includes employee communication, conflict resolution, investigations, discipline management, workplace safety, and compliance with labor laws and regulations. In the simulation, you will make decisions that affect how workplace issues are handled and how your organization maintains trust, fairness, and a positive work environment.",
    whyCards: [
      {
        title: "Strengthens Trust and Culture",
        body: "Fair treatment and open communication build trust and create a positive workplace culture.",
      },
      {
        title: "Reduces Workplace Issues and Risk",
        body: "Proactive ER practices can help reduce conflicts, complaints, turnover, and legal risks.",
      },
      {
        title: "Improves Engagement and Retention",
        body: "Employees who feel heard and supported are more engaged, committed, and likely to stay.",
      },
      {
        title: "Supports Organizational Performance",
        body: "A healthy work environment improves productivity, collaboration, quality, and overall results.",
      },
    ],
    decisions: [
      "Responding to employee concerns and complaints",
      "Conflict resolution and mediation strategies",
      "Discipline and corrective action decisions",
      "Workplace policy enforcement and updates",
      "Employee communication and feedback channels",
      "Workplace safety and well-being initiatives",
      "Diversity, equity, and inclusion (DEI) practices",
      "Balancing ER resources with other HR priorities",
    ],
    thinkLike:
      "Every ER decision involves people and consequences. Consider fairness, consistency, compliance, and the long-term impact on employee trust and organizational culture. The way you handle issues today can influence retention, engagement, and performance in future rounds.",
    connectingTitle: "4. Connecting Employee Relations to the Organization",
    connecting:
      "Employee Relations decisions interact with many other HR areas and influence results across the organization.",
    flow: {
      decisionsLabel: "ER Decisions",
      decisionsItems: [
        "Issue Resolution",
        "Policy Enforcement",
        "Communication",
        "Discipline Decisions",
        "Workplace Initiatives",
      ],
      workforceItems: [
        "Employee Satisfaction",
        "Engagement",
        "Trust and Culture",
        "Retention",
        "Productivity",
      ],
      orgItems: [
        "Productivity",
        "Quality",
        "Costs",
        "Financial Performance",
        "Strategic Performance",
      ],
    },
    beforeQuestions: [
      "How will we ensure employees feel heard and treated fairly?",
      "What ER approaches will help prevent issues before they escalate?",
      "How could our ER decisions impact engagement and results in future rounds?",
    ],
    challenge:
      "The challenge is to create a respectful, fair, and supportive workplace that enables people to do their best work.",
    heroImage: "/pre-sim/relations.jpg",
  },
  compensation: {
    title: "Compensation & Benefits",
    subtitle: "Rewarding Performance, Supporting Well-Being, Driving Results",
    intro:
      "Compensation & Benefits (C&B) includes the wages, salaries, incentives, and benefits organizations provide in exchange for employee contributions. In the Real HR Simulation, your C&B decisions influence employee motivation, financial security, retention, engagement, and the organization's ability to attract and keep top talent while managing costs and supporting strategy.",
    whatIsTitle: "1. What Is Compensation & Benefits?",
    whatIs:
      "Compensation & Benefits involves designing and managing total rewards that attract, motivate, and retain a skilled workforce. It includes base pay, variable pay, health and welfare benefits, retirement plans, paid time off, and other programs that support employees and their families. In the simulation, you will make decisions about how to invest in total rewards to balance employee needs, organizational strategy, and financial sustainability.",
    whyCards: [
      {
        title: "Attracts and Retains Talent",
        body: "Competitive total rewards help attract qualified candidates and encourage employees to stay.",
      },
      {
        title: "Motivates Performance and Productivity",
        body: "Pay and benefits that are linked to performance and outcomes can increase motivation and drive stronger results.",
      },
      {
        title: "Supports Well-Being and Financial Security",
        body: "Benefits and work-life programs support the health, security, and satisfaction of employees and their families.",
      },
      {
        title: "Drives Organizational Results",
        body: "Effective total rewards strategies support engagement, retention, quality, productivity, and financial performance.",
      },
    ],
    decisions: [
      "Setting base pay levels and structures",
      "Designing incentive and bonus programs",
      "Allocating compensation budgets across roles and levels",
      "Choosing health and welfare benefits options",
      "Managing retirement and savings plan contributions",
      "Providing paid time off and leave programs",
      "Supporting work-life balance and flexible work options",
      "Balancing total rewards investment with other HR priorities",
    ],
    thinkLike:
      "Total rewards involve tradeoffs between competitiveness, affordability, equity, and long-term sustainability. Consider what will motivate your employees, support your strategy, and strengthen your organization now and over time.",
    connectingTitle: "4. Connecting Compensation & Benefits to the Organization",
    connecting:
      "C&B decisions interact with many other HR areas and influence results across the organization.",
    flow: {
      decisionsLabel: "C&B Decisions",
      decisionsItems: [
        "Base Pay",
        "Incentives",
        "Benefits Design",
        "Retirement Plans",
        "Work-Life Programs",
      ],
      workforceItems: [
        "Motivation",
        "Engagement",
        "Satisfaction",
        "Retention",
        "Financial Security",
      ],
      orgItems: [
        "Productivity",
        "Quality",
        "Costs",
        "Financial Performance",
        "Strategic Performance",
      ],
    },
    beforeQuestions: [
      "What total rewards will help us attract, motivate, and retain the right talent?",
      "How will we balance competitiveness, equity, and cost in our approach?",
      "How could our compensation and benefits decisions impact employees and results in future rounds?",
    ],
    challenge:
      "The challenge is to design total rewards that attract and motivate talent while supporting the financial health and strategic goals of the organization.",
    heroImage: "/pre-sim/compensation.jpg",
  },
  "org-design": {
    title: "Org Design & Change",
    subtitle: "Designing Structure, Managing Change, Building Agility",
    intro:
      "Organization Design & Change (OD&C) involves shaping the structure, roles, processes, and ways of working that enable your organization to execute strategy and adapt to a changing environment. In the Real HR Simulation, your OD&C decisions influence collaboration, efficiency, innovation, employee experience, and your organization's ability to respond to opportunities and challenges.",
    whatIsTitle: "1. What Is Org Design & Change?",
    whatIs:
      "Org Design & Change involves aligning your organization's structure, roles, responsibilities, and processes with strategy and the needs of your workforce. It includes decisions about reporting relationships, span of control, team structure, workflows, roles and responsibilities, and leading change initiatives. In the simulation, you will make decisions about how to design your organization and lead change to improve effectiveness, agility, and performance.",
    whyCards: [
      {
        title: "Aligns Structure with Strategy",
        body: "A well-designed organization helps ensure the right people, roles, and accountabilities are in place to execute your strategy.",
      },
      {
        title: "Improves Efficiency and Collaboration",
        body: "Clear structures and processes reduce friction, eliminate duplication, and enable teams to work together more effectively.",
      },
      {
        title: "Builds Agility and Adaptability",
        body: "Effective change management helps your organization adapt quickly to market shifts, technology, and other external forces.",
      },
      {
        title: "Drives Organizational Performance",
        body: "The right design and successful change initiatives can improve innovation, speed, quality, employee experience, and financial results.",
      },
    ],
    decisions: [
      "Designing organizational structure and reporting relationships",
      "Defining roles, responsibilities, and span of control",
      "Aligning teams and resources with strategic priorities",
      "Improving workflows, processes, and coordination",
      "Restructuring departments or functions",
      "Managing change communication and stakeholder engagement",
      "Investing in change management and capability building",
      "Balancing design and change investments with other HR priorities",
    ],
    thinkLike:
      "Every design choice shapes how work gets done. Every change initiative impacts people. Consider the tradeoffs between control and flexibility, short-term disruption and long-term benefits, cost and capability, and how your decisions support your strategy.",
    connectingTitle: "4. Connecting Org Design & Change to the Organization",
    connecting:
      "Org Design & Change decisions interact with many other HR areas and influence results across the organization.",
    flow: {
      decisionsLabel: "OD&C Decisions",
      decisionsItems: [
        "Structure Design",
        "Role Alignment",
        "Process Improvement",
        "Change Initiatives",
        "Capability Building",
      ],
      workforceItems: [
        "Collaboration",
        "Agility",
        "Engagement",
        "Productivity",
        "Adaptability",
      ],
      orgItems: [
        "Efficiency",
        "Innovation",
        "Quality",
        "Financial Performance",
        "Strategic Performance",
      ],
    },
    beforeQuestions: [
      "What design changes might help us execute our strategy more effectively?",
      "How will we manage change while keeping employees engaged and productive?",
      "How could our design and change decisions impact results in future rounds?",
    ],
    challenge:
      "The challenge is to design an organization that executes today and adapts for tomorrow.",
    heroImage: "/pre-sim/org-design.jpg",
  },
  dei: {
    title: "DEI Initiatives",
    subtitle:
      "Promoting Diversity, Advancing Equity, Building Inclusion, Strengthening Culture",
    intro:
      "Diversity, Equity, and Inclusion (DEI) initiatives help create an environment where every employee feels valued, respected, and able to contribute fully. In the Real HR Simulation, your DEI decisions influence inclusion, employee experience, collaboration, innovation, retention, and your organization's ability to attract and develop diverse talent.",
    whatIsTitle: "1. What Is DEI?",
    whatIs:
      "DEI initiatives focus on creating a fair and inclusive environment where all employees have equal access to opportunities, resources, and support to succeed. It includes practices that promote diverse representation, equitable treatment, inclusion and belonging, and the removal of barriers that can limit potential. In the simulation, you will make decisions about how to invest in DEI to strengthen culture, improve outcomes, and support long-term organizational success.",
    whyCards: [
      {
        title: "Strengthens Inclusion and Belonging",
        body: "Inclusive environments help employees feel valued, respected, and able to contribute their best.",
      },
      {
        title: "Expands Talent Access and Retention",
        body: "DEI initiatives can help attract a more diverse talent pool and improve retention across all groups.",
      },
      {
        title: "Improves Collaboration and Innovation",
        body: "Diverse perspectives and an inclusive culture can drive better ideas, stronger problem solving, and innovation.",
      },
      {
        title: "Drives Organizational Performance",
        body: "Strong DEI practices can positively influence engagement, productivity, quality, customer impact, and financial results.",
      },
    ],
    decisions: [
      "Expanding diverse recruitment and talent pipelines",
      "Providing equity and unconscious bias training",
      "Developing employee resource groups and inclusion networks",
      "Improving fair and equitable policies and processes",
      "Addressing pay equity and opportunity gaps",
      "Enhancing inclusive leadership and manager capability",
      "Supporting accessibility and accommodation initiatives",
      "Balancing DEI investment with other HR priorities",
    ],
    thinkLike:
      "DEI is more than programs—it is a long-term commitment to fairness, respect, and opportunity. Consider how your decisions impact people, culture, and results today and how they build a more inclusive and adaptive organization for the future.",
    connectingTitle: "4. Connecting DEI Initiatives to the Organization",
    connecting:
      "DEI decisions interact with many other HR areas and influence results across the organization.",
    flow: {
      decisionsLabel: "DEI Decisions",
      decisionsItems: [
        "Diverse Recruitment",
        "Equity Practices",
        "Inclusion Initiatives",
        "Training & Education",
        "Accessibility & Support",
      ],
      workforceItems: [
        "Inclusion & Belonging",
        "Engagement",
        "Collaboration",
        "Retention",
        "Employee Experience",
      ],
      orgItems: [
        "Innovation",
        "Productivity",
        "Quality",
        "Financial Performance",
        "Strategic Performance",
      ],
    },
    beforeQuestions: [
      "How will we ensure everyone has equal access to opportunities and resources?",
      "What DEI initiatives will help build an inclusive and respectful workplace?",
      "How could our DEI decisions impact employees and results in future rounds?",
    ],
    challenge:
      "The challenge is to build an inclusive culture where everyone can thrive and the organization can achieve its goals.",
    heroImage: "/pre-sim/dei.jpg",
  },
};
