export interface SampleJD {
  id: string;
  title: string;
  company: string;
  level: 'APM' | 'PM' | 'Senior PM' | 'Group PM';
  tagline: string;
  tags: string[];
  description: string;
}

export const SAMPLE_JDS: SampleJD[] = [
  {
    id: 'stripe-senior-pm',
    title: 'Senior Product Manager - Global Payouts & Treasury',
    company: 'Stripe',
    level: 'Senior PM',
    tagline: 'Lead mission-critical payment rails and real-time treasury infrastructure globally.',
    tags: ['Fintech', 'Infrastructure', 'Global Scale', 'B2B'],
    description: `About the Role:
At Stripe, we are building the economic infrastructure for the internet. As a Senior Product Manager on the Global Payouts & Treasury team, you will own the end-to-end architecture and developer experience for how billions of dollars flow seamlessly to millions of businesses, creators, and gig workers across 50+ countries.

Responsibilities:
- Drive multi-year product roadmap for next-gen instant payout rails (RTP, FedNow, Faster Payments, SEPA Instant).
- Balance ultra-high reliability (99.999% availability) with bleeding-edge developer ergonomics and transparent pricing.
- Collaborate deeply with banking partners, compliance, risk engineers, and core infrastructure teams.
- Define north-star metrics around payout latency, unit economics, error reduction, and cross-border conversion.
- Make tough resource trade-offs between legacy compliance integrations and innovative developer APIs.

Requirements:
- 5+ years of PM experience, ideally in fintech, infrastructure, developer platforms, or high-throughput distributed systems.
- Proven track record of shipping complex platforms with measurable revenue and efficiency impact.
- Exceptional analytical horsepower: SQL fluency, financial modeling, and metric triage.
- High degree of comfort operating in high-ambiguity environments and managing executive stakeholders.`
  },
  {
    id: 'uber-senior-pm',
    title: 'Senior Product Manager - Driver Marketplace Dynamics',
    company: 'Uber',
    level: 'Senior PM',
    tagline: 'Balance two-sided marketplace equilibrium, dynamic surge pricing, and driver earnings.',
    tags: ['Marketplace', 'Algorithms', 'Operations', 'Consumer'],
    description: `About the Role:
Uber's Marketplace team builds the brain of our global mobility platform. We manage the matching algorithms, dynamic pricing engines, and driver dispatch systems that power millions of trips every single hour.

Responsibilities:
- Lead the product strategy for Driver Supply Incentives and Real-Time Matching Dynamics.
- Formulate hypotheses and design complex randomized control trials (A/B and switchback cluster experiments) to test supply elasticity.
- Partner with world-class Machine Learning scientists and operations leads across 70+ countries.
- Make principled trade-offs between rider ETA, surge pricing sensitivity, driver gross hourly earnings, and platform take rate.
- Troubleshoot catastrophic supply drops, holiday demand spikes, and regulatory capping mandates.

Requirements:
- 4-7 years product management experience managing two-sided marketplaces, algorithmic systems, or pricing engines.
- Strong econometric and statistical intuition (switchbacks, synthetic controls, cannibalization effects).
- Relentless focus on user experience for drivers who rely on Uber for their livelihood.`
  },
  {
    id: 'airbnb-pm',
    title: 'Product Manager - Host Onboarding & Trust',
    company: 'Airbnb',
    level: 'PM',
    tagline: 'Craft delightful first-time host journeys and intelligent fraud/risk verification.',
    tags: ['Consumer', 'Growth', 'Trust & Safety', 'Mobile'],
    description: `About the Role:
Hosting on Airbnb unlocks economic opportunity for millions. As a Product Manager on the Host Onboarding team, you will craft the magical first-time onboarding journey that turns curious homeowners into successful, verified Superhosts.

Responsibilities:
- Own the funnel conversion from "Interested Host" to "First Live Booking" across iOS, Android, and Web.
- Optimize multi-step listing flows: photo verification, smart pricing defaults, and house rule configurations.
- Synthesize qualitative user research with funnel telemetry to eliminate onboarding friction and anxiety.
- Partner with Trust & Safety to stop fraudulent listings before they go live without harming legitimate host conversion.
- Establish core metrics: Time-to-First-Publish, 30-Day Host Activation, and Early Host Retention.

Requirements:
- 3+ years in product management with strong consumer product craft, growth experimentation, or onboarding design.
- Deep user empathy and a proven eye for design polish and micro-interactions.
- Experience running iterative A/B tests with multivariate cohorts.`
  },
  {
    id: 'google-apm',
    title: 'Associate Product Manager (APM) - Creator Growth',
    company: 'Google / YouTube',
    level: 'APM',
    tagline: 'Help the next generation of video creators find their audience and monetize.',
    tags: ['Consumer', 'Creator Economy', 'Video', 'AI Tools'],
    description: `About the Role:
YouTube's mission is to give everyone a voice and show them the world. As an Associate Product Manager on YouTube Studio, you will empower emerging creators with generative AI tools and actionable audience analytics.

Responsibilities:
- Explore user needs for creators with under 10k subscribers who struggle with burnout and content ideation.
- Prototype lightweight features for video thumbnail optimization and automated chaptering.
- Work closely with UX research, software engineering, and community leads to validate new concepts.
- Track engagement funnels, creator publish frequency, and user satisfaction (CSAT).
- Communicate feature requirements clearly via PRDs and user stories.

Requirements:
- 0-2 years of software engineering, design, or entrepreneurial experience.
- Passion for online communities and digital media.
- Strong problem-solving instincts, analytical curiosity, and excellent communication skills.`
  },
  {
    id: 'shopify-gpm',
    title: 'Group Product Manager - Merchant AI & Automation',
    company: 'Shopify',
    level: 'Group PM',
    tagline: 'Lead multiple PM teams scaling autonomous AI commerce assistants for millions of merchants.',
    tags: ['GenAI', 'Leadership', 'B2B SaaS', 'Platform'],
    description: `About the Role:
Shopify makes commerce better for everyone. As Group Product Manager for Merchant AI, you will manage a team of 4-6 PMs building autonomous AI commerce agents that manage inventory, run marketing campaigns, and resolve buyer inquiries automatically.

Responsibilities:
- Set the 3-year vision and technical strategy for agentic commerce experiences across millions of businesses.
- Mentor and develop a high-performing team of Product Managers and Associate PMs.
- Align executive leadership on resource allocations, model partnerships (Google, OpenAI, Anthropic), and pricing packaging.
- Balance rapid AI experimentation against merchant trust, brand hallucination risks, and data sovereignty.
- Partner with sales, developer ecosystem, and marketing to ensure commercial adoption and net-new merchant acquisition.

Requirements:
- 7+ years of product management experience with at least 2+ years managing other product managers.
- Track record of shipping zero-to-one platform initiatives and scaling mature enterprise or merchant products.
- Exceptional executive presence, narrative clarity, and organizational design capability.`
  }
];
