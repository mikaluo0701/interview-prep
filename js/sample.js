// Sample job, résumé, questions, answers and reviews: used when no API key is entered.
// The company, school and candidate are fictional.

export const SAMPLE_JD = `Product Manager, Small Business Payments (MBA)
Ledgerline · New York or Remote (US) · Full-time · Starts summer 2027

About Ledgerline
Ledgerline helps 40,000 small businesses send invoices and get paid. Our customers are bakeries, landscapers, agencies and clinics that can't wait 60 days for cash. The Small Business Payments team owns everything between "invoice sent" and "money in the bank."

What you'll do
- Own the invoicing and payments experience for small businesses and the customers who pay them
- Turn customer research and data into a roadmap, and make hard prioritization calls
- Set success metrics, design experiments, and decide what ships
- Lead engineering, design, risk and sales partners without direct authority
- Present strategy and results to the executive team

What we're looking for
- MBA graduating in 2027, with 3+ years of experience in consulting, banking, operations or product
- Strong analytical skills; comfortable with SQL and reading experiment results
- Evidence of leading cross-functional work and influencing without authority
- Customer empathy and comfort with ambiguity
- Interest in fintech or small business is a plus`;

export const SAMPLE_RESUME = `PRIYA SHAH
MBA Candidate, Class of 2027 · priya.shah@example.com

EDUCATION
Hartwell School of Business — MBA Candidate, 2027
- VP of Product, Tech Club; organized a 40-person PM case competition
Riverside University — B.A. Economics, 2019

EXPERIENCE
Brightcart — Product Management Intern, Summer 2026
- Shipped a seller payout dashboard used by 3,000 sellers in six weeks
- Cut payout-related support tickets by 35% in the first month after launch

Northgate Consulting — Senior Consultant, 2021–2025; Analyst, 2019–2021
- Led a 4-person team redesigning small-business onboarding for a regional bank; cut onboarding time from 9 days to 3
- Built a pricing model for a payments client, sizing a $400M opportunity
- Ran workshops with C-suite clients; managed and coached 3 analysts
- As an analyst: market sizing and commercial due diligence for private equity clients

SKILLS
Excel modeling, SQL (intermediate), Figma (basic), customer interviews, experiment design`;

// Each question carries a sample answer and the review of that answer, so the whole flow
// (including skill scores) can be tried without an API key.
export const SAMPLE_OUTPUT = {
  track: "product",
  behavioral: [
    {
      question: "Walk me through your résumé, and tell me why product management is the right next step after four years in consulting.",
      testing: "Whether you can tell a crisp two-minute career story with a clear thread, and whether your move into product is pulled by real interest rather than pushed by leaving consulting.",
      anchor: "Résumé: Northgate Consulting → MBA → PM internship",
      themes: ["Career story"],
      rubric: [
        "Tells a concise, chronological story with a clear thread",
        "Explains the pivot to product with concrete evidence of interest and fit",
        "Connects the story to this role at Ledgerline"
      ],
      sampleAnswer: "Sure. I studied economics, then joined Northgate Consulting as an analyst, where I did market sizing and due diligence. I got promoted to senior consultant and led teams on projects like a small-business onboarding redesign for a regional bank. I really enjoyed working with the product and engineering teams on that project, more than the slide work honestly. So I decided to get my MBA to pivot into product. Over the summer I interned at Brightcart as a PM and shipped a seller payout dashboard. Now I'm excited to go into product full time, and payments is a space I find really interesting.",
      sampleReview: {
        scores: [
          { criterion: "Tells a concise, chronological story with a clear thread", score: 3, justification: "Chronological and easy to follow, but it lists roles instead of building a thread, and spends too long on the analyst years." },
          { criterion: "Explains the pivot to product with concrete evidence of interest and fit", score: 3, justification: "The onboarding project and the internship are real evidence, but \"more than the slide work\" frames product as an escape from consulting." },
          { criterion: "Connects the story to this role at Ledgerline", score: 2, justification: "\"Payments is a space I find really interesting\" is the only link to Ledgerline, and it's generic." }
        ],
        skills: { structure: 3, specificity: 3, impact: 2, relevance: 2, concision: 3 },
        worked: [
          "Clear chronological order that's easy to follow",
          "Uses the onboarding redesign and the internship as proof of interest in product",
          "Fits comfortably inside two minutes"
        ],
        missing: [
          "A one-line thread up front, e.g. \"I've spent my career helping small businesses get paid faster\"",
          "Why Ledgerline and small-business payments specifically",
          "One result from the internship (the 35% ticket drop) to show you can ship"
        ],
        weakest_sentence: {
          original: "Now I'm excited to go into product full time, and payments is a space I find really interesting.",
          rewrite: "That's why Ledgerline is my first choice: you're solving the exact problem I saw at the bank, where small businesses waited [nine days] just to start taking payments."
        }
      }
    },
    {
      question: "Why Ledgerline, and why small-business payments rather than the bigger consumer fintech players?",
      testing: "Genuine, researched interest in the company and its customers, rather than a generic \"fintech is exciting\" answer.",
      anchor: "JD: Small Business Payments team",
      themes: ["Career story"],
      rubric: [
        "Shows specific knowledge of Ledgerline's product, customers or strategy",
        "Gives a personal reason tied to their experience",
        "Explains why small business over consumer fintech"
      ],
      sampleAnswer: "I used Ledgerline's invoicing when I was helping a friend's bakery with their books, and it was really easy to use. I also think small businesses are underserved compared to consumers, and there's a lot of opportunity there. And from my consulting work with the bank I know how painful onboarding and getting paid can be for small businesses. I like that Ledgerline is mission driven.",
      sampleReview: {
        scores: [
          { criterion: "Shows specific knowledge of Ledgerline's product, customers or strategy", score: 2, justification: "Using the product once is a start, but there's nothing about Ledgerline's strategy, customers or recent launches." },
          { criterion: "Gives a personal reason tied to their experience", score: 4, justification: "The bakery and the bank project are real, personal reasons, though they're stated rather than told as a story." },
          { criterion: "Explains why small business over consumer fintech", score: 2, justification: "\"Underserved\" is asserted without saying what makes the problem harder or more interesting than consumer payments." }
        ],
        skills: { structure: 2, specificity: 3, impact: 2, relevance: 3, concision: 4 },
        worked: [
          "The bakery is a memorable personal connection",
          "Links back to your consulting project"
        ],
        missing: [
          "One specific fact about Ledgerline (a product, metric or launch) that shows research",
          "What exactly is underserved: cash-flow gaps, late payments, onboarding friction",
          "Why the business-payments problem excites you more than consumer fintech"
        ],
        weakest_sentence: {
          original: "I like that Ledgerline is mission driven.",
          rewrite: "What pulls me to Ledgerline is [your focus on getting invoices paid faster]: at the bank I saw small businesses wait weeks for cash, and that's the problem I want to spend the next five years on."
        }
      }
    },
    {
      question: "Tell me about the small-business onboarding redesign. How did you get the bank's engineering and risk teams to change how they worked when you had no authority over them?",
      testing: "Influence without authority, the core of the PM job. They'll look for how you built trust, used data, and handled the risk team's concerns.",
      anchor: "Résumé: onboarding cut from 9 days to 3 · JD: lead partners without direct authority",
      themes: ["Influence without authority", "Leadership"],
      rubric: [
        "Describes the specific resistance and why each team pushed back",
        "Shows concrete tactics used to win buy-in",
        "States a measurable outcome and their personal role"
      ],
      sampleAnswer: "The bank's onboarding took nine days, mostly because risk reviewed every application by hand. Risk didn't want to change because they'd been burned by fraud before, and engineering was busy with a core banking migration. I sat with the risk analysts for two days to see which checks actually caught fraud, and found that 80% of applications were low risk and could be auto-approved with three data checks. I brought that analysis to the risk lead first, privately, and we agreed to pilot it on 10% of applications. For engineering, I scoped the pilot to reuse an existing rules engine, so it took two sprints instead of a quarter. After the pilot showed no increase in fraud, we rolled it out, and onboarding went from nine days to three.",
      sampleReview: {
        scores: [
          { criterion: "Describes the specific resistance and why each team pushed back", score: 5, justification: "Clear about why each team resisted: risk's past fraud losses and engineering's competing migration." },
          { criterion: "Shows concrete tactics used to win buy-in", score: 4, justification: "Shadowing the analysts, pre-wiring the risk lead and shrinking the engineering ask are concrete, credible tactics." },
          { criterion: "States a measurable outcome and their personal role", score: 4, justification: "Nine days to three is a strong result; you could say more about what you personally owned versus the team." }
        ],
        skills: { structure: 5, specificity: 4, impact: 4, relevance: 4, concision: 3 },
        worked: [
          "Diagnoses each team's motivation before proposing a fix",
          "Pre-wiring the risk lead privately is a mature influence move",
          "Ends on a clear, quantified result"
        ],
        missing: [
          "One line on what you'd do differently",
          "Who else was on your team, and what was yours alone"
        ],
        weakest_sentence: {
          original: "After the pilot showed no increase in fraud, we rolled it out, and onboarding went from nine days to three.",
          rewrite: "After [six weeks] the pilot showed no rise in fraud, so I made the case to the COO to roll it out bank-wide, and onboarding dropped from nine days to three."
        }
      }
    },
    {
      question: "Tell me about a time a client or senior stakeholder strongly disagreed with your recommendation. What did you do?",
      testing: "How you handle conflict with senior people: whether you listen, adapt, and still stand behind your analysis.",
      anchor: "Résumé: ran workshops with C-suite clients",
      themes: ["Conflict"],
      rubric: [
        "Describes the disagreement and the stakes clearly",
        "Shows how they listened and adapted, not just persuaded",
        "Explains the outcome and the relationship afterwards"
      ],
      sampleAnswer: "On a pricing project, the client's CFO disagreed with our recommendation to raise prices for their largest customers. He thought they would leave. I listened to his concerns and then we went back and did more analysis. We showed him the data and eventually he agreed with us. The project was a success and the client extended our contract.",
      sampleReview: {
        scores: [
          { criterion: "Describes the disagreement and the stakes clearly", score: 2, justification: "The stakes are missing: how big was the price change, and how much revenue was at risk?" },
          { criterion: "Shows how they listened and adapted, not just persuaded", score: 2, justification: "\"We did more analysis\" hides what you changed; it reads as persuading him until he gave in." },
          { criterion: "Explains the outcome and the relationship afterwards", score: 3, justification: "A contract extension is a real outcome, but there's nothing about the relationship with the CFO." }
        ],
        skills: { structure: 3, specificity: 2, impact: 3, relevance: 3, concision: 4 },
        worked: [
          "Picks a genuinely senior stakeholder",
          "Shows you didn't just escalate or give up"
        ],
        missing: [
          "What the CFO's concern taught you, and what you changed in the recommendation",
          "Numbers: the price change, revenue at risk, churn after launch",
          "Your own role versus \"we\""
        ],
        weakest_sentence: {
          original: "We showed him the data and eventually he agreed with us.",
          rewrite: "I rebuilt the model with his churn assumptions, which showed only [3 of 40] accounts at risk, and we agreed to phase the increase in over two quarters with a retention plan for those three."
        }
      }
    },
    {
      question: "At Brightcart you shipped a seller payout dashboard in six weeks. What did you cut to get there, and how did you decide?",
      testing: "Prioritization under a deadline, and whether you made the trade-offs yourself using customer evidence.",
      anchor: "Résumé: payout dashboard shipped in six weeks · JD: make hard prioritization calls",
      themes: ["Prioritization", "Ambiguity"],
      rubric: [
        "Names specific features that were cut or deferred",
        "Explains the decision criteria, ideally with customer evidence",
        "Reflects on the outcome of the trade-offs"
      ],
      sampleAnswer: "We had a long list of feature requests, so I prioritized based on impact and effort. We decided to focus on the most important features for sellers, like seeing when their payout would arrive. Some nice-to-have features like exporting to CSV were cut. We launched on time and sellers liked it, and support tickets went down 35%.",
      sampleReview: {
        scores: [
          { criterion: "Names specific features that were cut or deferred", score: 3, justification: "CSV export is one concrete cut; the other decisions stay vague." },
          { criterion: "Explains the decision criteria, ideally with customer evidence", score: 2, justification: "\"Impact and effort\" names a framework but gives no reason; there's no customer evidence behind \"most important\"." },
          { criterion: "Reflects on the outcome of the trade-offs", score: 3, justification: "The 35% ticket drop is a good result, but you don't say whether the cuts hurt anyone." }
        ],
        skills: { structure: 3, specificity: 2, impact: 3, relevance: 4, concision: 4 },
        worked: [
          "Clear headline result (35% fewer tickets)",
          "Shows you shipped against a hard deadline"
        ],
        missing: [
          "How you knew payout timing mattered most (tickets, interviews, data)",
          "One hard trade-off you argued for or against",
          "What happened to the cut features afterwards"
        ],
        weakest_sentence: {
          original: "We decided to focus on the most important features for sellers, like seeing when their payout would arrive.",
          rewrite: "[Six in ten] payout tickets asked \"when will I get paid?\", so I made the payout date the one thing the dashboard had to get right and pushed CSV export to v2."
        }
      }
    },
    {
      question: "Tell me about a time something you owned didn't go as planned.",
      testing: "Self-awareness and ownership. Strong answers own the mistake, show what was learned, and prove the behavior changed.",
      anchor: "Classic MBA behavioral question",
      themes: ["Failure", "Ownership"],
      rubric: [
        "Owns a real failure with consequences",
        "Explains the root cause honestly",
        "Shows a lasting change in behavior"
      ],
      sampleAnswer: "In my first year at Northgate, I built a market sizing model for a client and made a formula error that overstated the market by about 20%. My manager caught it before the client meeting, luckily. Since then I always double-check my work.",
      sampleReview: {
        scores: [
          { criterion: "Owns a real failure with consequences", score: 3, justification: "A real mistake with a number attached, but the consequence was avoided, so the stakes feel low." },
          { criterion: "Explains the root cause honestly", score: 2, justification: "There's no root cause: why did the error happen, and why didn't you catch it?" },
          { criterion: "Shows a lasting change in behavior", score: 2, justification: "\"I always double-check my work\" is generic; there's no specific change or later example." }
        ],
        skills: { structure: 3, specificity: 3, impact: 2, relevance: 3, concision: 5 },
        worked: [
          "A concrete mistake with a size (20%)",
          "Short and honest"
        ],
        missing: [
          "Why it happened (rushing, no review step, unclear ownership)",
          "What you built or changed afterwards, such as a model-check routine you taught others",
          "A later example where the change paid off"
        ],
        weakest_sentence: {
          original: "Since then I always double-check my work.",
          rewrite: "Since then I build a [three-line] sanity check into every model, comparing the total to a top-down estimate, and I taught it to the analysts I later managed."
        }
      }
    }
  ],
  technical: [
    {
      question: "How would you measure the success of Ledgerline's invoicing product? Pick one north-star metric and defend it.",
      testing: "Product-metrics judgment: choosing a metric that reflects customer value and the business, and knowing its weak spots.",
      anchor: "JD: set success metrics and design experiments",
      themes: ["Product metrics"],
      rubric: [
        "Picks one clear north-star metric tied to customer value",
        "Explains why it beats obvious alternatives",
        "Names guardrail metrics or how the metric could mislead"
      ],
      sampleAnswer: "I'd use the number of invoices sent per month as the north-star metric, because it shows that businesses are using the product. I'd also look at revenue and customer satisfaction. If invoices sent is going up, the product is doing well.",
      sampleReview: {
        scores: [
          { criterion: "Picks one clear north-star metric tied to customer value", score: 2, justification: "Invoices sent measures activity, not whether customers got paid, which is the value Ledgerline promises." },
          { criterion: "Explains why it beats obvious alternatives", score: 1, justification: "No alternatives are compared." },
          { criterion: "Names guardrail metrics or how the metric could mislead", score: 2, justification: "Revenue and satisfaction are listed, but not as guardrails, and there's no mention of how the metric could mislead." }
        ],
        skills: { structure: 2, specificity: 2, impact: 2, relevance: 3, concision: 4 },
        worked: [
          "Commits to a single metric",
          "Short and direct"
        ],
        missing: [
          "A metric tied to getting paid, such as invoices paid through Ledgerline within 30 days",
          "Why it beats invoices sent or payment volume",
          "Guardrails: time to payment, failed payments, churn"
        ],
        weakest_sentence: {
          original: "If invoices sent is going up, the product is doing well.",
          rewrite: "I'd pick invoice volume paid through Ledgerline within 30 days, because it captures both adoption and the outcome customers care about, with time to payment and payment failures as guardrails."
        }
      }
    },
    {
      question: "Small businesses send invoices with us, but only 40% get paid through Ledgerline; the rest are paid by check or other apps. How would you raise that number?",
      testing: "Product sense: diagnosing the problem from the payer's side before jumping to features, then prioritizing a few ideas.",
      anchor: "JD: own the invoicing and payments experience",
      themes: ["Product sense"],
      rubric: [
        "Diagnoses why payers choose other methods before proposing fixes",
        "Proposes a few prioritized solutions for payers and businesses",
        "Says how they'd test the solutions"
      ],
      sampleAnswer: "First I would talk to customers to understand why. Then I would add more payment options like Apple Pay and lower the fees. I could also send reminders to people who haven't paid. Finally I'd A/B test these changes.",
      sampleReview: {
        scores: [
          { criterion: "Diagnoses why payers choose other methods before proposing fixes", score: 2, justification: "\"Talk to customers\" is the right instinct, but there are no hypotheses about why payers still use checks." },
          { criterion: "Proposes a few prioritized solutions for payers and businesses", score: 3, justification: "Wallets, fees and reminders are sensible, but they aren't prioritized, and fees affect the business model." },
          { criterion: "Says how they'd test the solutions", score: 2, justification: "\"A/B test these changes\" with no metric or design." }
        ],
        skills: { structure: 3, specificity: 2, impact: 2, relevance: 4, concision: 4 },
        worked: [
          "Starts with the customer before features",
          "Covers both payment options and follow-up"
        ],
        missing: [
          "Separating the payer from the business: who chooses the payment method",
          "Two or three hypotheses (habit, fees passed on, trust, approval workflows)",
          "A prioritized first bet with a success metric"
        ],
        weakest_sentence: {
          original: "Then I would add more payment options like Apple Pay and lower the fees.",
          rewrite: "My first bet would be [a one-click pay button with saved bank details for repeat payers], since checks usually come from repeat business customers paying out of habit; I'd measure the share of repeat invoices paid online."
        }
      }
    },
    {
      question: "Engineering has capacity for one of three: recurring invoices, instant payouts, or QuickBooks sync. How do you decide?",
      testing: "Prioritization with incomplete data: a clear framework, the right inputs, and a decision you're willing to defend.",
      anchor: "JD: turn research and data into a roadmap",
      themes: ["Roadmap prioritization"],
      rubric: [
        "Uses a clear framework with stated criteria",
        "Identifies the data they'd gather for each option",
        "Makes and defends an actual decision"
      ],
      sampleAnswer: "I'd use a framework like RICE to score each feature on reach, impact, confidence and effort. I'd talk to customers and look at the data. I think QuickBooks sync might be the most valuable because a lot of small businesses use QuickBooks, but it depends on the data.",
      sampleReview: {
        scores: [
          { criterion: "Uses a clear framework with stated criteria", score: 3, justification: "RICE is a reasonable framework, though you don't apply it to the three options." },
          { criterion: "Identifies the data they'd gather for each option", score: 2, justification: "\"Talk to customers and look at the data\" doesn't say which data." },
          { criterion: "Makes and defends an actual decision", score: 2, justification: "A tentative pick hedged with \"it depends\" isn't a decision." }
        ],
        skills: { structure: 3, specificity: 2, impact: 2, relevance: 3, concision: 4 },
        worked: [
          "Names a structured approach",
          "Leans toward a choice"
        ],
        missing: [
          "Tie each option to the north-star metric (getting paid faster)",
          "Specific data: share of users on QuickBooks, churn reasons, payout-speed complaints",
          "A committed recommendation, plus what would change your mind"
        ],
        weakest_sentence: {
          original: "I think QuickBooks sync might be the most valuable because a lot of small businesses use QuickBooks, but it depends on the data.",
          rewrite: "I'd build instant payouts first, because cash flow is the top reason small businesses churn [in our exit surveys], and I'd revisit QuickBooks sync if more than [half] of new sign-ups ask for it."
        }
      }
    },
    {
      question: "An A/B test of a new checkout page shows conversion up 4%, but refund requests also rose. What do you do?",
      testing: "Experiment judgment: checking significance, weighing a guardrail against the main metric, and deciding on net impact.",
      anchor: "JD: design experiments and decide what ships",
      themes: ["Experimentation"],
      rubric: [
        "Checks whether the results are statistically and practically significant",
        "Investigates why refunds rose before deciding",
        "Weighs net impact and makes a recommendation"
      ],
      sampleAnswer: "I would check if the results are statistically significant. If conversion is up 4%, that's good, but refunds going up is bad. I'd look into why refunds went up, maybe the new page is confusing people. Then I'd decide whether to launch based on the overall impact.",
      sampleReview: {
        scores: [
          { criterion: "Checks whether the results are statistically and practically significant", score: 3, justification: "Mentions significance, but not sample size, test length, or the fact that refunds lag purchases." },
          { criterion: "Investigates why refunds rose before deciding", score: 3, justification: "\"Maybe the page is confusing\" is a fair hypothesis, but there's no way to check it." },
          { criterion: "Weighs net impact and makes a recommendation", score: 2, justification: "\"Decide based on the overall impact\" leaves out the actual comparison and the call." }
        ],
        skills: { structure: 4, specificity: 2, impact: 3, relevance: 4, concision: 4 },
        worked: [
          "Treats refunds as a guardrail, not noise",
          "Right order: validate, diagnose, then decide"
        ],
        missing: [
          "Net revenue per visitor as the deciding metric",
          "Segmenting refunds by reason and by new versus returning buyers",
          "A concrete call, such as holding the launch and fixing the cause first"
        ],
        weakest_sentence: {
          original: "Then I'd decide whether to launch based on the overall impact.",
          rewrite: "If net revenue per visitor is still up after refunds, I'd launch to [50%] while we fix the cause; if not, I'd hold the launch and test a version that keeps the faster flow but fixes [the unclear pricing step]."
        }
      }
    }
  ]
};
