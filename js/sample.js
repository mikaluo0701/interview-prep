// Sample job, résumé, questions, answers and reviews: used when no API key is entered.

export const SAMPLE_JD = `Senior Backend Engineer — Payments Platform
Ledgerline · Remote (US) · Full-time

About the role
Ledgerline moves money for 4,000+ small businesses. Our Payments Platform team owns the services that authorize, capture, refund, and settle roughly 2 million transactions a day. We're looking for a senior engineer to help us scale the core ledger and harden our money-movement APIs.

What you'll do
- Design and build backend services in Go (some legacy Java) that process card and ACH payments
- Own the double-entry ledger and nightly settlement/reconciliation against bank files
- Make our public APIs safe to retry: idempotency, exactly-once side effects, clear failure modes
- Work with Kafka-based event pipelines that feed risk, reporting, and customer notifications
- Partner with Product, Finance, and Compliance on requirements and trade-offs
- Participate in a weekly on-call rotation and lead incident reviews
- Mentor mid-level engineers and raise the bar on design reviews

What we're looking for
- 5+ years building production backend systems; 2+ in Go, Java, or similar
- Strong PostgreSQL skills: schema design, transactions, isolation levels, query tuning
- Experience with distributed systems and message queues (Kafka preferred)
- A track record of improving reliability or performance with measurable results
- Payments, fintech, or other correctness-critical domain experience is a plus`;

export const SAMPLE_RESUME = `JORDAN REYES
Backend Engineer · Denver, CO · jordan.reyes@example.com

EXPERIENCE

Brightcart — Senior Software Engineer, Checkout Team        2021 – Present
- Led the migration of checkout from a Rails monolith to four Go services over 14 months with zero customer-facing downtime
- Cut checkout API p99 latency from 480ms to 120ms by removing N+1 queries, adding a read replica, and moving tax calculation off the hot path
- Designed a Kafka order-events pipeline (~600k events/day) consumed by fulfillment, email, and analytics
- Introduced idempotency keys on the payment-capture endpoint, reducing duplicate-charge support tickets by 92%
- Mentored two junior engineers through their first on-call rotations; both promoted within 18 months
- Wrote the team's incident review template, now used across engineering

Routewise (logistics startup) — Software Engineer          2018 – 2021
- Built route-optimization APIs in Python/Django and PostgreSQL serving 300 fleet customers
- Reduced nightly batch job runtime from 5 hours to 40 minutes by partitioning work and parallelizing with Celery
- Owned the carrier-integration service; handled on-call for 12 external carrier APIs

SKILLS
Go, Python, Ruby, SQL · PostgreSQL, Redis, Kafka · AWS (ECS, RDS, SQS) · Datadog, OpenTelemetry

EDUCATION
B.S. Computer Science, Colorado State University, 2018`;

// Each sample question carries a sample answer and the review of that answer,
// so the whole flow can be tried without an API key.
export const SAMPLE_OUTPUT = {
  behavioral: [
    {
      question: "Walk me through the checkout migration at Brightcart. How did you decide what to carve out of the monolith first, and who did you have to convince?",
      testing: "Judgment on sequencing a risky migration, and influence without authority. They'll listen for whether you drove the decisions or executed someone else's plan.",
      anchor: "Résumé: monolith → Go migration with zero downtime",
      themes: ["Influence without authority", "Ownership"],
      rubric: [
        "Explains how the first slice was chosen, with a concrete rationale",
        "Describes who needed convincing and how buy-in was earned",
        "Makes their own role and decisions clear, distinct from the team's"
      ],
      sampleAnswer: "At Brightcart the checkout monolith was getting really slow and hard to deploy. We decided to start with the tax calculation piece because it was fairly self-contained. I wrote a proposal doc and presented it at architecture review, and after some discussion people agreed. We used a strangler pattern with a proxy in front, so we could route traffic gradually. Over 14 months we moved everything into four Go services and there was no downtime. It was a big team effort and I learned a lot about migrations.",
      sampleReview: {
        scores: [
          { criterion: "Explains how the first slice was chosen, with a concrete rationale", score: 3, justification: "Names tax calculation and says it was self-contained, but never weighs it against other candidates or says why low coupling beat higher value." },
          { criterion: "Describes who needed convincing and how buy-in was earned", score: 2, justification: "\"After some discussion people agreed\" skips the actual objections and how you answered them." },
          { criterion: "Makes their own role and decisions clear, distinct from the team's", score: 2, justification: "Mostly \"we\"; the proposal doc is the only decision clearly attributed to you." }
        ],
        worked: [
          "A concrete first slice (tax calculation) rather than a vague \"we started small\"",
          "Strangler pattern with gradual routing shows you de-risked the cutover",
          "Ties back to the 14-month, zero-downtime result on your résumé"
        ],
        missing: [
          "Who pushed back and what their concern was",
          "Why tax first instead of, say, payment capture: the trade-off you made",
          "Any evidence the first slice worked before you continued"
        ],
        weakest_sentence: {
          original: "It was a big team effort and I learned a lot about migrations.",
          rewrite: "My call was to ship tax first and hold payment capture until the proxy had run at 100% for [two weeks]; that sequencing is why we never had a customer-facing outage."
        }
      }
    },
    {
      question: "Tell me about an incident you were on call for where the root cause turned out to be different from what you first assumed.",
      testing: "How you debug under pressure, communicate while an incident is live, and whether you avoid anchoring on the first hypothesis.",
      anchor: "JD: weekly on-call rotation and leading incident reviews",
      themes: ["Ambiguity", "Ownership"],
      rubric: [
        "Describes the initial hypothesis and the evidence that disproved it",
        "Shows how they communicated during the incident",
        "Names a concrete follow-up that prevented recurrence"
      ],
      sampleAnswer: "One night I got paged because checkout error rates spiked to about 8%. I assumed it was a bad deploy since we had shipped that afternoon, so I rolled it back, but errors kept happening. Then I looked in Datadog and saw timeouts to our tax provider. It turned out they were having an outage. We added a fallback that uses cached tax rates if the provider is slow. I posted updates in the incident channel.",
      sampleReview: {
        scores: [
          { criterion: "Describes the initial hypothesis and the evidence that disproved it", score: 4, justification: "Clear wrong hypothesis (the deploy) and the evidence that overturned it (errors persisted after rollback, timeouts in Datadog)." },
          { criterion: "Shows how they communicated during the incident", score: 2, justification: "One sentence about posting updates; no cadence, audience, or customer-facing messaging." },
          { criterion: "Names a concrete follow-up that prevented recurrence", score: 4, justification: "Cached tax-rate fallback is a real fix, though you don't say whether it was tested or has fired since." }
        ],
        worked: [
          "Opens with a specific signal (8% error rate) instead of \"something broke\"",
          "Rolling back first is a defensible move, and you say why you did it",
          "Ends with a real fix, not just \"we monitored it\""
        ],
        missing: [
          "How long the incident lasted and how many customers were affected",
          "Who you updated (support, leadership) and how often",
          "What you changed in your own debugging habits, since the question is about wrong assumptions"
        ],
        weakest_sentence: {
          original: "I posted updates in the incident channel.",
          rewrite: "Every [15] minutes I posted status in the incident channel and gave support a one-line customer message, so they weren't guessing while I debugged."
        }
      }
    },
    {
      question: "Describe a time you pushed back on a product or business deadline because you thought the change was risky. What happened?",
      testing: "Whether you can hold a line on correctness in a money-moving system while still finding a path forward with Product and Finance.",
      anchor: "JD: partner with Product, Finance, and Compliance on trade-offs",
      themes: ["Conflict", "Influence without authority"],
      rubric: [
        "Identifies the specific risk and why it mattered",
        "Shows constructive disagreement with concrete alternatives",
        "States the outcome honestly, including any cost"
      ],
      sampleAnswer: "Our PM wanted to launch a buy-now-pay-later option before Black Friday. I thought it was too risky because we hadn't tested refunds. I told them I didn't think it was a good idea and we had a few meetings about it. Eventually we delayed it by two weeks and it launched fine.",
      sampleReview: {
        scores: [
          { criterion: "Identifies the specific risk and why it mattered", score: 3, justification: "Untested refunds is a real risk, but you don't say what could have gone wrong or what was at stake." },
          { criterion: "Shows constructive disagreement with concrete alternatives", score: 2, justification: "\"I told them I didn't think it was a good idea\" is a veto, not a proposal; no alternatives offered." },
          { criterion: "States the outcome honestly, including any cost", score: 2, justification: "\"Launched fine\" skips the cost of missing Black Friday and whether the PM agreed in the end." }
        ],
        worked: [
          "A real, recognisable scenario with a hard deadline",
          "Names the specific gap (refunds untested) rather than general unease"
        ],
        missing: [
          "An alternative you proposed, such as a limited launch or a feature flag",
          "The business cost of the two-week delay and who signed off on it",
          "Any data you used to make the case"
        ],
        weakest_sentence: {
          original: "I told them I didn't think it was a good idea and we had a few meetings about it.",
          rewrite: "I showed the PM that a failed refund would leave customers charged with no way to reverse it, and offered two options: launch to [5%] of merchants with manual refunds, or slip two weeks and test the full flow."
        }
      }
    },
    {
      question: "You mentored two junior engineers through on-call. Tell me about a moment one of them struggled, and what you changed in how you supported them.",
      testing: "Mentorship as a real part of the senior role: patience, adapting your approach, and giving people ownership rather than taking over.",
      anchor: "Résumé: mentored two engineers, both promoted · JD: mentor mid-level engineers",
      themes: ["Mentoring", "Leadership"],
      rubric: [
        "Describes a specific struggle with concrete detail",
        "Explains what they changed in their own approach and why",
        "Shows the result for the mentee, with evidence"
      ],
      sampleAnswer: "One of the engineers I mentored, Sam, was really anxious about his first on-call week. He would escalate everything to me, even small alerts. At first I just helped him fix things, but I realized that wasn't helping him learn. So I started asking him what he thought the problem was before giving answers. I also paired with him on writing runbooks for our most common alerts. By his third rotation he was handling almost everything himself, and he later got promoted.",
      sampleReview: {
        scores: [
          { criterion: "Describes a specific struggle with concrete detail", score: 5, justification: "Escalating every alert during a first on-call week is specific, believable, and sets up the rest of the story." },
          { criterion: "Explains what they changed in their own approach and why", score: 4, justification: "Clear shift from fixing to asking, and you name why the first approach failed." },
          { criterion: "Shows the result for the mentee, with evidence", score: 3, justification: "\"Almost everything himself\" is vague, and the promotion likely had many causes." }
        ],
        worked: [
          "You admit your first approach was wrong, which is exactly what this question probes",
          "Runbooks are a durable fix that helped the whole team, not just Sam",
          "Clear arc: problem, change, result"
        ],
        missing: [
          "A number for the improvement, such as escalations per week before and after",
          "How you balanced coaching against incident speed while he was still learning"
        ],
        weakest_sentence: {
          original: "By his third rotation he was handling almost everything himself, and he later got promoted.",
          rewrite: "By his third rotation he escalated [two] alerts in a week instead of [fifteen], and he now runs on-call onboarding for new hires."
        }
      }
    },
    {
      question: "What's a technical decision you made in the last few years that you'd reverse if you could?",
      testing: "Self-awareness and honesty. Strong answers name a real cost, explain what signal they missed, and describe what they do differently now.",
      anchor: "General seniority check",
      themes: ["Failure"],
      rubric: [
        "Names a real decision with meaningful consequences",
        "Explains what signal they missed at the time",
        "Describes what they do differently now, with an example"
      ],
      sampleAnswer: "Probably choosing to use Redis for our session store at Routewise. It worked fine but it added operational complexity. Looking back, Postgres would have been enough. Now I try to use boring technology when I can.",
      sampleReview: {
        scores: [
          { criterion: "Names a real decision with meaningful consequences", score: 3, justification: "A genuine choice, but \"it worked fine\" undercuts the idea that it had real costs." },
          { criterion: "Explains what signal they missed at the time", score: 1, justification: "Nothing on what you knew then or why the choice seemed right." },
          { criterion: "Describes what they do differently now, with an example", score: 2, justification: "\"Boring technology\" is a slogan; no example of applying it since." }
        ],
        worked: [
          "Picks a real technical decision rather than a disguised strength",
          "Concise and doesn't get defensive"
        ],
        missing: [
          "The concrete cost: incidents, on-call load, or hours spent running Redis",
          "Why Redis seemed right at the time, which shows your reasoning",
          "A later decision where you applied the lesson"
        ],
        weakest_sentence: {
          original: "Now I try to use boring technology when I can.",
          rewrite: "When we picked a job queue at Brightcart, I argued for a Postgres-backed queue over adding SQS, because I'd seen what a second datastore cost a [three]-person team at Routewise."
        }
      }
    }
  ],
  technical: [
    {
      question: "A client times out on a payment request and retries, and the customer is charged twice. How would you design the API and storage so that can't happen?",
      testing: "Idempotency keys with a unique constraint, storing and replaying the original response, and handling a retry that arrives while the first request is still in flight.",
      anchor: "Résumé: idempotency keys cut duplicate charges 92% · JD: make APIs safe to retry",
      themes: ["Idempotency"],
      rubric: [
        "Uses a client-supplied idempotency key with a uniqueness guarantee in storage",
        "Returns the stored original response on retry",
        "Handles a retry that arrives while the first request is still in flight",
        "Defines key scope and retention"
      ],
      sampleAnswer: "I'd have the client send an idempotency key header with each payment request. On the server, before charging, we check if we've seen that key before in a table. If we have, we return the saved response instead of charging again. If not, we process the charge and save the key with the response. That's basically what I built at Brightcart and it cut duplicate charges by 92%.",
      sampleReview: {
        scores: [
          { criterion: "Uses a client-supplied idempotency key with a uniqueness guarantee in storage", score: 3, justification: "Key plus lookup table is right, but check-then-insert without a unique constraint lets two concurrent requests both pass." },
          { criterion: "Returns the stored original response on retry", score: 5, justification: "Returning the saved response is exactly right and stated clearly." },
          { criterion: "Handles a retry that arrives while the first request is still in flight", score: 1, justification: "Not addressed, and it's the exact scenario in the question." },
          { criterion: "Defines key scope and retention", score: 1, justification: "No mention of scoping keys per merchant or how long they're kept." }
        ],
        worked: [
          "Correct core pattern, explained simply",
          "Ties it to a real result from your résumé"
        ],
        missing: [
          "A unique constraint, or insert-first with a 'processing' status, so concurrent requests can't both charge",
          "What a retry gets while the first request is still processing (e.g. 409 or wait)",
          "Key scope per merchant and a retention window",
          "What happens if the processor charge succeeds but saving the response fails"
        ],
        weakest_sentence: {
          original: "On the server, before charging, we check if we've seen that key before in a table.",
          rewrite: "Before charging, we insert the key with status 'processing' under a unique constraint on (merchant_id, key); if the insert fails it's a retry, so we return the stored result, or a 409 if the original is still in flight."
        }
      }
    },
    {
      question: "After a Kafka consumer-group rebalance, some order events were processed twice. How do you make the downstream side effects effectively exactly-once?",
      testing: "Understanding of at-least-once delivery, offset-commit timing, idempotent consumers, dedupe tables, and the transactional outbox pattern.",
      anchor: "Résumé: Kafka order-events pipeline · JD: Kafka event pipelines",
      themes: ["Event streaming"],
      rubric: [
        "Explains why duplicates happen",
        "Proposes a concrete idempotent-consumer or dedupe mechanism",
        "Addresses side effects outside the database"
      ],
      sampleAnswer: "Kafka is at-least-once by default, so if a consumer crashes or there's a rebalance before it commits offsets, messages get redelivered. You could use Kafka's exactly-once semantics with transactions. Or you could make the consumer idempotent by storing processed event IDs.",
      sampleReview: {
        scores: [
          { criterion: "Explains why duplicates happen", score: 4, justification: "Correct cause (redelivery before offset commit), stated concisely." },
          { criterion: "Proposes a concrete idempotent-consumer or dedupe mechanism", score: 3, justification: "Names two options but doesn't choose one or say where the dedupe write happens relative to the side effect." },
          { criterion: "Addresses side effects outside the database", score: 1, justification: "Emails and fulfillment calls aren't covered, and Kafka transactions don't help there." }
        ],
        worked: [
          "Accurate explanation of redelivery after a rebalance",
          "Names two real approaches rather than one"
        ],
        missing: [
          "Writing the dedupe record and the business change in the same database transaction",
          "Why Kafka's exactly-once mode doesn't cover external side effects like sending an email",
          "A recommendation for this system, not just a list of options"
        ],
        weakest_sentence: {
          original: "Or you could make the consumer idempotent by storing processed event IDs.",
          rewrite: "I'd make each consumer idempotent: insert the event ID into a processed_events table in the same transaction as the business write, so a redelivered event hits the unique constraint and is skipped."
        }
      }
    },
    {
      question: "How would you model a double-entry ledger in PostgreSQL? Which invariants would you enforce in the database, and which in the application?",
      testing: "Data modeling for money: integer minor units rather than floats, append-only entries, balanced transactions, constraints, and choosing an isolation level.",
      anchor: "JD: own the double-entry ledger",
      themes: ["Data modeling"],
      rubric: [
        "Proposes a sound schema that supports multi-leg transactions",
        "Enforces balance and immutability, and says where",
        "Addresses concurrency for balance reads and updates"
      ],
      sampleAnswer: "I'd have an accounts table and a transactions table. Each transaction has a debit account, a credit account, and an amount. Amounts should be stored as decimals, not floats. Transactions should never be updated, only reversed with a new transaction. Balances could be calculated by summing transactions for an account.",
      sampleReview: {
        scores: [
          { criterion: "Proposes a sound schema that supports multi-leg transactions", score: 3, justification: "Debit/credit on one row works for simple transfers but can't represent fees or multi-leg transactions." },
          { criterion: "Enforces balance and immutability, and says where", score: 3, justification: "Append-only with reversals is right, but you don't say whether the database or the app enforces it." },
          { criterion: "Addresses concurrency for balance reads and updates", score: 1, justification: "Concurrency isn't mentioned, and summing on every read won't hold up at 2M transactions a day." }
        ],
        worked: [
          "Append-only with reversals is the key ledger principle, and you stated it",
          "Explicitly rejects floats for money"
        ],
        missing: [
          "An entries table, so one transaction can have many legs that sum to zero",
          "Where invariants live, e.g. a deferred constraint or trigger that checks each transaction balances",
          "How balances stay fast and correct under concurrent writes (cached balance with row lock, isolation level)"
        ],
        weakest_sentence: {
          original: "Balances could be calculated by summing transactions for an account.",
          rewrite: "I'd keep a balance column on each account, updated in the same transaction as its entries with SELECT … FOR UPDATE, and run a nightly job that re-sums entries to prove the cached balances match."
        }
      }
    },
    {
      question: "You cut checkout p99 from 480ms to 120ms. Walk me through how you found where the time was actually going.",
      testing: "That the result is yours. Expect follow-ups on tracing, reading query plans, and why p99 can have different causes than p50.",
      anchor: "Résumé: p99 latency 480ms → 120ms",
      themes: ["Performance tuning"],
      rubric: [
        "Describes the measurement method",
        "Identifies specific causes and ties each to a fix",
        "Explains what drove tail latency specifically"
      ],
      sampleAnswer: "We added OpenTelemetry tracing to checkout and looked at the slowest traces in Datadog. We found a lot of N+1 queries when loading cart items, so we fixed those with eager loading. We also found that tax calculation was slow, so we moved it to happen earlier in the flow. And we added a read replica for some queries. Together that got p99 from 480 to 120.",
      sampleReview: {
        scores: [
          { criterion: "Describes the measurement method", score: 4, justification: "Tracing and reading the slowest traces is the right method, clearly stated." },
          { criterion: "Identifies specific causes and ties each to a fix", score: 4, justification: "Three causes, each paired with a specific fix." },
          { criterion: "Explains what drove tail latency specifically", score: 2, justification: "Doesn't say why these hurt p99 in particular, e.g. large carts driving N+1 cost." }
        ],
        worked: [
          "Concrete tools and method, which makes the résumé claim credible",
          "Each cause is paired with a fix"
        ],
        missing: [
          "Which change contributed most, and how you knew",
          "Why the tail was slow: big carts, cold caches, or provider timeouts",
          "Replica-lag trade-offs for checkout reads"
        ],
        weakest_sentence: {
          original: "Together that got p99 from 480 to 120.",
          rewrite: "Fixing the N+1 queries alone took p99 from 480 to [260]ms, because the slowest traces were all carts with [30+] items; moving tax off the hot path got us the rest."
        }
      }
    },
    {
      question: "Our nightly reconciliation of 2M transactions against the bank's settlement file finishes too late. How would you speed it up without risking correctness?",
      testing: "Partitioning and parallelism, checkpointing so a failed run can resume, and how you prove the faster version produces identical results.",
      anchor: "Résumé: batch job 5h → 40m at Routewise · JD: nightly settlement and reconciliation",
      themes: ["Batch processing"],
      rubric: [
        "Proposes a concrete way to partition or parallelize the work",
        "Protects correctness: checkpointing, safe re-runs, and verification",
        "Considers how the bank file is loaded and matched"
      ],
      sampleAnswer: "First I'd profile where the time goes. At Routewise I sped up a batch job by partitioning the work and running it in parallel with Celery, so I'd probably do something similar, maybe split by merchant. I'd also make sure there are the right indexes on the transactions table.",
      sampleReview: {
        scores: [
          { criterion: "Proposes a concrete way to partition or parallelize the work", score: 3, justification: "Profiling first and splitting by merchant is reasonable, but you don't check it against how the bank file is structured." },
          { criterion: "Protects correctness: checkpointing, safe re-runs, and verification", score: 1, justification: "Nothing on checkpointing, re-runs, or proving the faster job gives the same results, which the question explicitly asks." },
          { criterion: "Considers how the bank file is loaded and matched", score: 2, justification: "Indexes are mentioned, but not how the file is loaded or how rows are matched." }
        ],
        worked: [
          "Starts with measuring rather than guessing",
          "Uses relevant prior experience as evidence"
        ],
        missing: [
          "How you'd verify the new job matches the old one, e.g. run both and diff the output",
          "Checkpointing so a failure halfway doesn't restart all 2M rows",
          "Bulk-loading the bank file into a staging table and matching with a set-based join"
        ],
        weakest_sentence: {
          original: "I'd also make sure there are the right indexes on the transactions table.",
          rewrite: "I'd COPY the bank file into a staging table, match it to our transactions with one set-based join on (settlement_date, processor_ref), and only loop over the rows that don't match."
        }
      }
    }
  ]
};
