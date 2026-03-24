# Story Bank — Extended Source Narratives

These are the extended narrative versions of each story for use as reference material by the rewrite engine.

---

## Story 001 — SmartPlayer: Turning Model Outputs into User-Facing Analysis

**Context:**
The platform's core computer vision model was producing rich biomechanical data — joint angles, movement timing, force estimates, pattern classifications. But the end users of the system, primarily coaches and athletes, couldn't interpret those raw outputs. They'd see a number or a chart and have no idea whether it was good, bad, meaningful, or noise. The product needed an interpretation layer.

**What I Owned:**
I owned the product definition for what I think of as the SmartPlayer layer — the user-facing interface that took raw model outputs and rendered them as understandable, actionable analysis. This included: deciding which outputs to surface (and which to suppress), defining the interpretation thresholds that determined how outputs were categorized (e.g., "within normal range" vs. "flagged"), writing the feature specs and acceptance criteria for how those outputs should display, and running QA cycles to validate that what the model produced mapped correctly to what the user saw.

**The Core Challenge:**
The hardest part wasn't technical — it was defining what "good" looked like. The ML team could tell me what the model was producing. But what does a 12-degree hip flexion variance actually mean to a coach? When is it meaningful enough to surface? When does surfacing it create confusion? These were product decisions, not engineering decisions, and I owned them.

**What I Did:**
- Worked with ML and domain experts to establish meaningful thresholds for each key output
- Defined the information architecture for the display — what's primary, what's secondary, what's hidden unless requested
- Wrote detailed specs for every display state, including edge cases and out-of-range outputs
- Created acceptance criteria that QA could run against model outputs
- Ran structured user testing with coaches to validate that the interpretation logic matched their mental model
- Iterated based on feedback — several thresholds were adjusted after user testing revealed they created more confusion than clarity

**Result:**
Shipped a working interpretation layer that coaches and athletes could actually use. Reduced interpretation-related support requests. Improved session completion rates in coached workflows because users weren't getting confused and dropping out mid-session.

---

## Story 002 — Voice Assist: Feedback System Product Definition

**Context:**
In-session, the platform needed to give users real-time feedback — not just a report afterward. The idea was to create a voice feedback system that would convert model outputs into verbal coaching cues as the user performed. This is harder than it sounds, because the feedback needs to feel like a knowledgeable coach, not a robot reading sensor data.

**What I Owned:**
I owned the product requirements and logic architecture for the feedback system. This included: defining the feedback taxonomy (what types of feedback the system could produce), building the heuristic input mapping that determined when and how feedback should trigger, defining the logic for coverage (how much of the session should have feedback), verbosity (how much the system says per trigger), specificity (how precise vs. general the language should be), and result framing (how outcomes are communicated). I also defined persona configurations for different user contexts — a beginner athlete gets different feedback framing than a competitive one.

**The Core Challenge:**
The challenge was that raw model triggers — "hip angle exceeded threshold at frame 847" — needed to become natural coaching language without becoming generic or annoying. Too much feedback is noise. Too little feedback is useless. The wrong tone undermines trust. Getting the logic right required thinking about feedback as a product experience, not a data pipeline.

**What I Did:**
- Defined the full feedback taxonomy from scratch — categories, types, trigger conditions
- Built the heuristic input mapping: which model signals map to which feedback responses
- Designed the persona system: beginner, intermediate, competitive, recovery mode
- Defined verbosity and coverage parameters and their defaults by context
- Worked with the content team to ensure feedback language matched the persona and context
- Ran usability testing specifically on feedback experience — was it annoying? Was it useful? Did it feel credible?
- Iterated feedback density and trigger logic multiple times based on field testing

**Result:**
Delivered a feedback system that could produce contextually appropriate, well-calibrated output across varied user contexts. Increased feedback relevance ratings in user testing. Reduced "confusing feedback" flags from field operators after each major iteration.

---

## Story 003 — QA and Diagnostic Workflows for Model Behavior

**Context:**
As the platform scaled, model output reliability became a trust issue. The team was seeing inconsistent outputs in edge cases — unusual body types, non-standard setups, specific movement patterns — and there was no systematic way to catch these before they reached customers. The QA process was ad hoc: engineers would manually check a few outputs before release and call it done.

**What I Owned:**
I led the definition and implementation of systematic QA workflows and diagnostic processes for model output quality. I owned the criteria, the process, and the tooling requirements. Engineering owned the implementation of the diagnostic tools; I defined what they needed to do.

**What I Did:**
- Audited the existing QA approach and identified the key gaps
- Designed a structured test case library — representative cases, edge cases, failure modes
- Established evaluation criteria for what constitutes a "valid" model output for each output type
- Defined thresholds for when outputs should be flagged, suppressed, or surfaced with a caveat
- Wrote tooling requirements for internal diagnostic dashboards the engineering team built
- Trained the team on evaluation standards so QA wasn't dependent on one person
- Integrated QA checkpoints into the release process

**Result:**
Significantly improved internal confidence in model output quality. Reduced release-blocking QA failures. Created a repeatable evaluation process that could scale as the team grew and the model evolved. Improved time-to-diagnosis for model behavior issues when they did occur.

---

## Story 004 — Onsite Workflow Design: Capture and Calibration

**Context:**
The platform required physical setup at customer sites — cameras needed to be positioned, calibrated, and validated before data collection could begin. Early in the product's life, this process was loosely documented and highly variable. Different operators set up differently. Calibration failures were common. And because bad calibration meant bad data, which meant bad model outputs, it was a product quality problem, not just an ops problem.

**What I Owned:**
I owned the operational workflow design and product requirements for the onsite capture and calibration process. This was end-to-end PM work in a physical environment — from operator arrival through validated data capture.

**What I Did:**
- Mapped the full onsite workflow with field operators to understand where failures were occurring
- Identified the top failure modes (improper camera positioning, skipped validation steps, incorrect environment setup)
- Designed structured operator checklists covering each setup phase
- Specified the software-side calibration UX — status indicators, error states, retry logic, validation confirmation
- Worked with engineering to build validation feedback directly into the capture flow
- Created operator training materials based on the new workflow

**Result:**
Reduced calibration failures and setup errors significantly. Improved data validity rates from capture sessions. Made the onsite process trainable and repeatable — new operators could follow the workflow without needing an expert present.

---

## Story 005 — PRD and Roadmap Structure

**Context:**
When I joined the product team, documentation was minimal. What was being built existed primarily in engineering tickets and informal Slack conversations. As the team grew and external stakeholders — including investors and commercial partners — needed visibility, the lack of structured product documentation was becoming a risk.

**What I Owned:**
I owned the transition to structured product documentation. I introduced PRD templates, user story formats, acceptance criteria standards, and roadmap artifacts.

**What I Did:**
- Audited what documentation existed and identified the key gaps
- Introduced PRD templates calibrated to the team's existing workflow — lightweight enough to adopt, rigorous enough to matter
- Backfilled documentation for in-flight features
- Defined user story and acceptance criteria formats
- Created a roadmap structure that made prioritization visible and defensible to stakeholders
- Facilitated prioritization sessions with technical and business stakeholders using the new artifacts

**Result:**
Improved cross-functional alignment on what was being built and why. Reduced engineering rework caused by unclear requirements. Gave stakeholders a credible visibility layer. Faster onboarding for new team members.

---

## Story 006 — Stakeholder Alignment on Model Interpretation Standards

**Context:**
There was a recurring conflict between the ML team, the product team, and commercial stakeholders about what the model output "meant" and how it should be presented to users. The ML team thought in probabilities and distributions; the commercial team wanted definitive statements; and product was trying to find language users could trust. Every product decision about display thresholds or output language turned into a debate.

**What I Owned:**
I facilitated the alignment process and produced the shared standard document that resolved the recurring disputes.

**What I Did:**
- Identified that the root cause was different mental models of what outputs represented, not bad faith
- Organized structured working sessions with ML, product, engineering, and commercial teams
- Translated the ML team's probabilistic framing into product-compatible language
- Produced a shared reference document defining what each output type meant, how it should be displayed, and what language was appropriate
- Used this document as a decision anchor for subsequent disputes — instead of relitigating from scratch, teams referenced the standard

**Result:**
Reached durable alignment on output interpretation standards. Reduced recurring disputes. Enabled faster product decisions on output-related questions.

---

## Story 007 — Prioritization Under Constraint

**Context:**
During a planning cycle with a constrained engineering team (3 engineers), there were competing requests from commercial (customer-committed features), ML (infrastructure work needed for model accuracy), and operations (field workflow fixes). All of it was legitimate. None of it could all fit.

**What I Owned:**
I led the prioritization process and owned the final recommendation.

**What I Did:**
- Audited all competing requests and their stated rationale
- Built a scoring framework weighted by customer-facing value, technical risk, and commercial dependency
- Ran structured prioritization reviews with each stakeholder group
- Made the final call with clear written rationale
- Communicated tradeoffs explicitly — what was being cut and why, not just what was being built

**Result:**
Delivered a prioritized plan that all stakeholders understood and could work within. The cycle shipped on scope. No major re-prioritization mid-cycle.

---

## Story 008 — Failure: Misreading User Needs in Feature Design

**Context:**
An early version of the analysis display was designed based on internal assumptions — primarily from the engineering and ML teams — about what coaches wanted to see. We assumed coaches wanted the raw metric data. We were wrong.

**What I Owned:**
I owned the product definition, including the assumption. This was my mistake.

**What I Did:**
- Recognized the adoption and negative feedback signals quickly after launch
- Ran retrospective discovery sessions with actual users
- Identified the real gap: coaches didn't want raw numbers, they wanted interpretation and recommendation
- Rebuilt the product requirements around interpreted output
- Drove the redesign effort

**Result:**
Redesigned feature showed significantly improved adoption. Established a team principle: raw model output is never a finished product feature. Every output needs an interpretation layer.
