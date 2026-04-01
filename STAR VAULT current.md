# STAR Story Vault V3: Austin Stretz — Technical Product Architect
**Version:** 3.0 | **Source:** Derived from Master Context Blocks V1
**Changes from V2:** All stories enriched with decision reasoning, corrected metrics (6,075 permutations), MPN insight layer added to Action and Result sections. Stories 1-5 most significantly updated.

## Weighting System
- **TD (Technical Depth):** 1-10
- **PI (Product Impact):** 1-10
- **TR (Transferability):** 1-10

---

## Tier 1: Core Identity & High Impact

### Story 1: AI Agent Orchestration & Behavioral Architecture (C-01, C-02, C-24)

**Interview Questions:**
- "Tell me about a time you had to balance user expectations for an AI agent with the technical limitations of the underlying LLM. How did you manage that tension?"
- "Describe your experience designing human-AI interaction models. How do you ensure AI behavior aligns with user needs?"
- "Walk me through a project where you made a conscious choice to accept engineering complexity in service of user experience."

**Situation:** Voice Assist v0 was an extremely rigid and robotic feedback system that was entirely unusable — single variable, fixed language examples, robotic tone, no user control. The platform needed a sophisticated AI coaching system that could deliver real-time, personalized feedback during live practice sessions. The underlying problem: no one had defined what "good" AI feedback behavior meant before building it. There was no behavioral architecture.

**Task:** Rebuild Voice Assist from scratch as a fully configurable, LLM-powered coaching engine with a real-time natural language override model — moving from a single-variable failure to a production-ready system that could feel like a genuine coach.

**Action:** Designed the system architecture by working backward from how a human coach actually controls a session. Identified 8 configurable behavioral variables: Coverage (5 options), Verbosity (3), Specificity (3), Result (3), Encouragement (3), Tone (3), Cadence (5), plus a separate Voice Prompt Adjustment layer for real-time natural language overrides. This structure produced 6,075 unique base permutations (5 × 3 × 3 × 3 × 3 × 3 × 5).

Made a deliberate architectural decision to use LLM-based generation over a rule-based system, accepting latency overhead as the cost of authenticity. Used ChatGPT for rapid prototyping of linguistic patterns and for refining context-aware phrasing and behavioral guardrails.

Designed user-based Voice Prompt Adjustments as an architecturally distinct override layer — not another variable, but a real-time natural language interface on top of any active configuration. "Coach, keep it simple" instantly drops verbosity and specificity. "Coach, hype me up" switches tone to use more enthusiasm. This created two modes of personalization: structured presets plus live conversational adjustment.

Also discovered the critical constraint: timing is a feature. Post-session feedback is technically simpler to build but fundamentally different from live feedback. The ability to deliver coaching mid-motion, without screen disruption, is the core value proposition — not a nice-to-have.

**Result:** Transformed a failed single-variable system into a 6,075-permutation coaching engine with a differentiated market position. No competitor was measuring micro-biomechanics (index finger to palm angle at 60fps) and delivering personalized coaching feedback in real time. Testing showed significantly longer engagement and measurable technique improvement. The behavioral architecture became the foundation for all future AI coaching feature development.

**Debrief:** This story demonstrates AI product architecture — specifically designing behavioral constraints, guardrails, and personalization models for LLM-powered systems. The decision reasoning (LLM over rule-based, timing as feature) is what distinguishes this from generic "I built an AI feature" narratives. Lead with the architectural decision and its tradeoffs, not the permutation count.

**Weighting:** TD: 9 | PI: 9 | TR: 9

---

### Story 2: Knowledge Engineering & Complex Data Schema Design (C-03, C-04, C-14)

**Interview Questions:**
- "Describe a project where you had to translate complex domain expertise into structured, engineering-ready systems. What was your methodology?"
- "Tell me about a time you established a single source of truth across teams with conflicting definitions. How did you get buy-in?"
- "How do you approach data governance when the subject matter experts and the engineers don't share a common language?"

**Situation:** The platform's core model config — the instructions governing what to measure, how, and when — was discovered forensically to be riddled with inaccurate mappings, wrong body part assignments, inconsistent naming, bad math, and LSTM model failures compounding downstream errors. No one had systematically translated coach intent into a machine-readable format. The system was a patchwork of ad hoc coaching notes, and disagreements between engineering, data science, and biomechanics teams about metric definitions had created years of technical debt.

**Task:** Lead a complete redesign of the platform's movement interpretation layer (Heuristic Profile v4) — developing both the knowledge extraction methodology and the technical architecture — to establish a single, scientifically grounded source of truth.

**Action:** Developed a four-stage knowledge engineering methodology. First, worked with coaches using live examples and video review to surface tacit knowledge that couldn't be articulated in the abstract — coaches can't describe their evaluation criteria without seeing real motion. Second, built a structured SME Interview Profile Process that captured each metric's human-readable definition, machine key, rationale, edge cases, temporal phase, frame/window rules, formula, dependencies, and quality requirements. Third, recognized repeating patterns across coaches and sports and built a universal metric inventory from them.

Fourth — and most architecturally significant — designed the Phase Canon: Activities → Phases → Metrics. This abstraction made the platform sport-agnostic; the architecture remained constant while sport-specific logic lived in the instruction layer. Discovered (not planned) when basketball and baseball motions began mapping to the same underlying phase structures.

Field-validated the framework with coaches evaluating real motion and comparing their judgment to model output. Critical finding: different coaches had different terminology and priorities. The architecture was designed to allow interchangeable terminology while maintaining consistent underlying logic — flexibility without chaos.

Framed the stakeholder buy-in as empowerment: each coach's evaluation methodology was embedded in the system, scaling their expertise to hundreds of players. They became architects of the system, not just users.

**Result:** Eliminated years of technical debt and system ambiguity. Codified 12 complex human actions (heuristics) into objective, machine-readable measurement sets with a universal taxonomy that scaled across sports without rebuilding. Cross-functional teams — engineering, data science, biomechanics — aligned around a shared source of truth for the first time. The Phase Canon became the platform's core scalability architecture.

**Debrief:** This story demonstrates knowledge engineering — the ability to extract tacit expertise and translate it into structured systems. The methodology is the differentiator: most PMs gather requirements; this is codifying domain expertise into machine-readable architecture. Highly transferable to any AI system that requires encoding expert knowledge: fintech (compliance rules), healthcare (clinical protocols), legal tech (regulatory interpretation).

**Weighting:** TD: 8 | PI: 9 | TR: 9

---

### Story 3: Forensic AI Validation & Technical QA (C-05, C-06, C-15, C-16, C-17, C-18)

**Interview Questions:**
- "How do you ensure accuracy and reliability of AI/ML models in production? Walk me through your QA methodology."
- "Tell me about a time you had to diagnose a critical system failure that the engineering team hadn't been able to resolve."
- "Describe your experience bridging the gap between data science and engineering when a model wasn't performing as expected."

**Situation:** The platform's 3D computer vision models (BlazePose, YOLO) produced outputs with unquantified errors, jitter, and drift. Users were losing trust in AI-generated metrics because of unexplained instability. Engineering couldn't isolate root causes. Data science had no structured failure mode data for model retraining prioritization. Without knowing which metrics were reliable, product had no defensible precision claim.

**Task:** Build a forensic QA methodology to validate 3D computer vision model outputs, identify and categorize failure modes, and translate findings into actionable inputs for engineering bug fixes and data science retraining priorities.

**Action:** Built a multi-source validation framework using four independent methods to triangulate failures:

1. **Manual mathematical reconstruction:** Using vector calculus, dot products, and normalized vectors, independently reconstructed complex metrics from raw BlazePose keypoint data. Compared results to AI output and identified specific failure types: projection-plane misassignments (3D geometry failures causing systematic 30°-70° errors in angle calculations) and vector directionality errors in joint angle metrics.

2. **High-speed video analysis:** Analyzed hundreds of movement videos to identify jitter and keypoint instability patterns. Finding: ankle and wrist joints exhibited consistently higher jitter under specific rapid movement conditions — specific enough to drive targeted model retraining.

3. **Comparative analysis:** Cross-referenced AI output against manual Kinovea annotations from coaches and biomechanists, and against the independent mathematical models from method one.

4. **Statistical quantification:** Quantified drift rates, jitter magnitudes, and failure mode frequencies across datasets — translating qualitative instability observations into engineering-actionable inputs.

Leveraged Claude Code and Python to build internal testing tools and data collection pipelines that automated the analysis, enabling investigation at scale without waiting for engineering bandwidth.

The translation step was as important as the diagnosis: provided engineering with exact mathematical root causes (projection-plane assignment for the angle errors, directionality sign error for the vector failures) and data science with specific joint instability patterns and failure conditions — not just error rates.

**Result:** Identified and documented model drift and jitter patterns across hundreds of datasets, restoring accuracy to flagship metrics (e.g. upper arm angle, which had been producing systematic errors due to incorrect sagittal plane assignment). Established a multi-source validation framework that became the foundational QA infrastructure for engineering bug fixes and data science model retraining prioritization. Defined latency standards (<250ms) and frame alignment tolerances that stabilized the real-time system.

**Debrief:** This is the strongest technical depth story — it demonstrates that you don't just manage the backlog, you can participate in solving the hardest technical problems. The key differentiator: the findings were translated into engineering-actionable root causes, not just "the model is wrong." That translation is the PM skill; the vector math is the credibility.

**Weighting:** TD: 10 | PI: 8 | TR: 9

---

### Story 4: Operational UX & Hardware-Software Integration (C-07, C-08, C-19, C-23)

**Interview Questions:**
- "Describe a product you managed that involved significant hardware-software integration in an uncontrolled environment."
- "How do you design for operational reliability in high-stakes, real-time field environments?"
- "Tell me about your experience with system architecture for multi-user, high-pressure operational workflows."

**Situation:** Deploying real-time 3D biomechanical analysis at live events required operating multi-camera NVIDIA Jetson edge rigs in unpredictable field environments — uneven surfaces, variable lighting, network instability, operators under pressure managing hardware they'd often never seen before. There were no standardized workflows, no visibility into device health, and no clear operator role definitions. Every deployment was a manual fire-fighting exercise.

**Task:** Design the complete operational system (Onsite App) for multi-lane, multi-user field capture events — including role-based access control, calibration flows, real-time system health visibility, and frame-level synchronization standards.

**Action:** Designed the Onsite App around five non-negotiable operational requirements. First, Role-Based Access Control (RBAC): distinct permission sets for event manager (admin controls, session oversight), analyst (data review, metric access), and technician (hardware management, calibration). The role separation reduced errors by ensuring operators only accessed controls relevant to their function.

Second, multi-lane workflows: simultaneous capture and analysis of multiple athletes without data contamination or interference between lanes.

Third, real-time troubleshooting infrastructure: system health dashboards providing immediate visibility into error states, connectivity status, and remediation paths — making self-resolution possible before a problem escalated to a deployment failure.

Fourth, device readiness indicators: explicit hardware status confirmation before any session could begin, preventing captures from starting on uncalibrated or unstable systems.

Defined performance standards from field data: <250ms latency for real-time multi-camera ecosystem stability; frame-level synchronization rules to ensure 100% alignment across video feed, skeleton overlays, and calculated metrics. These numbers were derived from pre-market live deployments — not arbitrary specs.

**Result:** Standardized event execution across different venues, operators, and hardware configurations. Pre-market deployments revealed failure modes that internal lab testing never would — surface conditions, ambient lighting, and operator fatigue under real event pressure. Those findings drove the specific design decisions that made subsequent deployments predictable. Field operators gained real-time troubleshooting visibility that converted deployment failures into self-resolved issues.

**Debrief:** This story demonstrates systems thinking for hardware-software integration at the edge. The RBAC design and latency standards are the technical depth. The field-derived design decisions are the PM credibility — knowing that lab testing and field deployment are fundamentally different validation environments is an insight most product managers only learn after a failed deployment.

**Weighting:** TD: 8 | PI: 9 | TR: 8

---

### Story 5: Product Transformation — Research Tool to Market Product (C-09, C-10, C-11, C-22)

**Interview Questions:**
- "Tell me about a time you took a product from a research prototype to a market-ready solution. What was your process?"
- "How do you approach defining a product vision when the code already exists but the product doesn't?"
- "Describe a situation where you had to create information architecture for a complex, data-rich interface."

**Situation:** SmartPlayer existed as a research-oriented video viewer — an internal tool engineers and data scientists used to inspect model outputs. It had no coherent user experience, no information architecture, no product vision, and no user outside the internal team. The data existed. The code existed. What didn't exist was any definition of what this was actually for or who it was for.

**Task:** Transform SmartPlayer from an internal research testbed into the platform's flagship user-facing product — a comprehensive 2D/3D biomechanical analysis environment for coaches and athletes.

**Action:** Began with product vision definition before touching the interface: from "video viewer" to "comprehensive motion analysis platform." This required articulating who the primary users were (coaches evaluating technique, athletes reviewing their own performance), what "good" looked like for each, and how the technical outputs of the model mapped to user value.

The central design challenge was information density. High-frequency biomechanical metrics — dozens of measurements per phase of motion — presented simultaneously would be overwhelming and uninterpretable. Solved this by designing the Phase Canon information architecture: Activities → Phases → Metrics. The interface surfaced only phase-relevant data during each moment of review, organized temporally rather than by metric category.

This temporal structure did two things simultaneously: it reduced cognitive load by matching the user's natural review behavior (evaluating motion in sequence), and it created a universal architecture for scaling across sports without rebuilding the interface for each one. The Phase Canon meant basketball and baseball review used the same underlying structure with different activity-specific logic.

Authored comprehensive technical specifications aligning engineering, UX, and data science around a unified user journey — from session selection through metric review through coaching note export.

**Result:** Transformed an unstructured internal testbed into a coherent professional product with a defensible information architecture. The Phase Canon enabled the platform to scale from a single-sport focus toward a universal motion-analysis engine without architectural refactoring. Reduced user overwhelm in testing by surfacing temporally relevant data rather than all data simultaneously — making the tool feel authoritative rather than overwhelming.

**Debrief:** This story demonstrates product vision work — defining what a tool becomes, not just what it is. The Phase Canon is the architectural insight worth leading with: it solved a UX problem and a scalability problem simultaneously. That kind of architectural decision that serves multiple goals is what distinguishes product thinking from feature thinking.

**Weighting:** TD: 7 | PI: 9 | TR: 9

---

## Tier 2: High Impact, Specialized Context

### Story 6: AI Trust & Safety UX — Error State Design (C-13)

**Interview Questions:**
- "How do you design for the failure modes of AI systems? What's your approach to maintaining user trust when a model is unreliable?"
- "Describe a time you had to make AI limitations transparent to users without undermining the product's value proposition."

**Situation:** Following forensic QA work that identified specific model instability patterns (ankle/wrist keypoint jitter, projection-plane errors), the product needed to communicate metric reliability to users in real time — without destroying trust in the system or overwhelming them with technical caveats.

**Task:** Design error-state UX for the SmartPlayer interface that transparently communicated when AI model confidence was low or data was incomplete, while maintaining user trust in the system's overall reliability.

**Action:** Designed a tiered visual indicator system based on the specific failure modes identified in forensic QA. Low-confidence frames received clear visual markers distinguishing them from stable data. Metrics affected by identified instability patterns (specific joints under specific movement conditions) displayed appropriate uncertainty indicators rather than presenting potentially erroneous values as fact.

Worked closely with engineering and data science to understand the underlying model behavior well enough to translate technical confidence thresholds into user-facing language. The design principle: surface reliability information in the user's mental model (e.g. "this measurement is less certain under rapid lateral movement") rather than in technical terms (e.g. "keypoint confidence below 0.7").

**Result:** Reduced user frustration from unexplained metric instability by making system limitations visible and interpretable. Proactive transparency about AI reliability — rather than optimistic hiding of errors — built more durable user trust than a polished interface that occasionally produced confusing outputs.

**Debrief:** This story is specifically valuable for AI product roles where trust, safety, and transparency are design requirements — fintech, healthcare, autonomous systems. The key insight: designing for AI failures is as important as designing for AI successes.

**Weighting:** TD: 7 | PI: 7 | TR: 9

---

### Story 7: GTM Automation & Marketplace Strategy (C-27, C-28)

**Interview Questions:**
- "Tell me about your experience defining product vision and MVP for a new marketplace or platform product."
- "How do you approach scaling business development through automation and systems rather than headcount?"
- "Describe a time you had to improve GTM efficiency through tooling and process rather than adding people."

**Situation:** At 1872 Consulting, two parallel problems: the company needed to scale candidate sourcing beyond manual effort, and the outbound business development process was entirely manual — high effort, low throughput, inconsistent follow-through.

**Task:** Define product vision and MVP scope for an external referral-based bounty platform, and implement automated CRM and business development infrastructure to improve outbound pipeline efficiency.

**Action:** Led product discovery for the bounty platform — a referral marketplace that would productize candidate sourcing by incentivizing the external network to surface qualified candidates. Defined the core user flows (referral submission, candidate tracking, bounty payment), identified the lean MVP (network-driven sourcing only, no internal workflow features), and scoped the build to validate the core value proposition before adding complexity.

Simultaneously implemented CRM and outbound automation using Agency Leads and Clay, converting manual prospecting into systematic pipeline generation. Defined the workflows, built the data structures, and established the cadence that moved from relationship-dependent outreach to process-driven pipeline management.

**Result:** Launched the bounty platform MVP, establishing a new scalable candidate sourcing channel. Improved outbound business development efficiency by approximately 58% compared to the manual baseline — measured by pipeline volume generated per unit of BD effort. Combined effect: two separate scaling levers (candidate supply, client demand) operating simultaneously through systems rather than headcount.

**Debrief:** This story demonstrates product discovery (defining MVP scope for a marketplace), GTM automation (building operational systems), and founder-level business thinking (solving supply and demand scaling simultaneously). Strongest for roles with GTM, growth, or operations components.

**Weighting:** TD: 6 | PI: 8 | TR: 8

---

### Story 8: Data Pipeline Management & ML Velocity (C-31)

**Interview Questions:**
- "Describe your experience managing data pipelines or annotation processes for ML model training."
- "How do you prioritize data collection and labeling to maximize ML team velocity?"
- "Tell me about a project where you had to align data strategy with model performance goals."

**Situation:** The ML team required a sustained, high-volume supply of annotated image data to train and improve 3D computer vision models — but the annotation process was unstructured, creating a bottleneck. Without prioritized annotation cycles aligned to model performance gaps, the team was annotating data that didn't address the model's actual weaknesses.

**Task:** Lead the creation and prioritization of a 1.4M+ image annotation pipeline using CVAT, structured to align annotation effort with model performance gaps and accelerate ML team velocity.

**Action:** Defined annotation requirements by working backward from model performance data — not forward from available data volume. Identified which failure modes and which movement conditions were underrepresented in training data, and prioritized annotation cycles to close those specific gaps first. Collaborated with data scientists to establish a feedback loop: model performance output → annotation prioritization → new training data → model performance re-evaluation.

Selected and configured CVAT as the annotation platform, established quality standards, and built the workflow structure that enabled a high volume of consistent, usable annotations.

**Result:** Aligned 1.4M+ image annotation cycles with specific model performance gaps, accelerating ML team velocity by ensuring new training data addressed actual model weaknesses rather than adding volume to already-covered conditions. Established the data governance framework that connected product QA findings directly to annotation prioritization — making forensic validation findings actionable through the training data pipeline.

**Debrief:** This story is critical for any AI/ML product role. The key differentiator from generic "I managed data labeling" narratives: annotation was prioritized by model performance gaps, not data availability. That backward-from-failures prioritization logic is what makes this a product management contribution rather than a project management one.

**Weighting:** TD: 7 | PI: 8 | TR: 8

---

### Story 9: Information Architecture & Cognitive Load Optimization (C-10)

**Interview Questions:**
- "How do you approach designing user interfaces for complex, data-rich analytical applications?"
- "Describe a time you had to simplify a complex data environment without reducing its analytical value."
- "What's your philosophy on information architecture for high-density interfaces?"

**Situation:** The SmartPlayer 2D/3D performance review interface presented dozens of biomechanical metrics simultaneously — every measurement the model produced, regardless of temporal relevance to the moment being reviewed. Coaches and athletes were overwhelmed rather than informed.

**Task:** Establish an information hierarchy that reduced cognitive load without sacrificing analytical depth — making complex biomechanical data navigable for non-technical users.

**Action:** Applied the Phase Canon temporal structure (Activities → Phases → Metrics) as the organizing principle for the interface. Rather than presenting all metrics simultaneously, the interface surfaced only metrics relevant to the current temporal phase being reviewed. A user reviewing the preparation phase of a basketball shot saw preparation-phase metrics; switching to the execution phase revealed execution-phase metrics. Data wasn't hidden — it was staged to match the user's natural review sequence.

Grouped high-density metrics by phase and within phase by analytical hierarchy (primary indicators first, secondary metrics available on expansion). This created a progressive disclosure model that matched expert and novice user patterns simultaneously.

**Result:** Reduced user overwhelm by matching data presentation to user review behavior rather than to data structure. Made the interface feel authoritative — surfacing the right information at the right moment created a sense that the system understood what mattered when, which is foundational to user trust in analytical tools. The temporal structure also created the architecture that enabled cross-sport scaling without interface redesign.

**Debrief:** This story demonstrates information architecture as a trust mechanism, not just a UX pattern. The Phase Canon connection is worth making explicit — the same architectural decision that solved the cognitive load problem also solved the scalability problem.

**Weighting:** TD: 5 | PI: 7 | TR: 8

---

### Story 10: Digital Transformation & E-Commerce Channel Development (C-30)

**Interview Questions:**
- "Tell me about your experience driving digital transformation and growing online revenue from scratch."
- "Describe a project where you established new distribution channels or entered new markets."
- "How do you manage new product launches across multiple distribution channels simultaneously?"

**Situation:** SFA Companies — a traditional industrial products business with three separate business silos — had no meaningful online presence and no e-commerce infrastructure. An entire revenue channel was unaddressed. The multi-silo structure (industrial hydraulics, professional lifts, automotive retail) made unified channel strategy politically complex; any initiative that appeared to cannibalize existing silo revenue would face resistance.

**Task:** Establish the company's first real online sales channel and launch a new product line into major automotive distribution networks — simultaneously building new channel infrastructure and managing a new product GTM.

**Action:** Built the e-commerce channel by selling directly to Amazon and other online retailers — positioning it as serving customer segments that existing distribution channels didn't address, which defused internal competition concerns. Built the catalog, pricing, and fulfillment structures from zero.

Simultaneously launched a new lighting product line into major automotive tool brands: Snap-on, Matco, Mac Tools, ATD. This required managing a distinct GTM motion — technical product positioning for professional mechanics and shop owners — while the e-commerce channel was scaling on a separate track. Both required different relationship structures, different product framing, and different success metrics.

**Result:** Grew the online sales channel from $50k to $1.47M annually — 2,840% growth — which became a major revenue source for the company. Successfully launched the lighting product line into four major automotive brands, establishing ongoing distribution relationships. Demonstrated the ability to run parallel GTM motions across both new channel development and new product introduction without resource conflicts.

**Debrief:** The 2,840% growth figure is the headline, but the more interesting story is navigating multi-silo organizational dynamics while running two simultaneous GTM motions. That's the transferable PM skill — managing organizational complexity while executing channel strategy.

**Weighting:** TD: 5 | PI: 9 | TR: 8

---

### Story 11: Strategic Cross-Functional Alignment (C-21, C-25)

**Interview Questions:**
- "Tell me about a time you had to align teams with fundamentally different languages and priorities around a shared technical framework."
- "How do you build a shared source of truth in a fragmented organization?"

**Situation:** Engineering, data science, and biomechanics teams at NeoSavant operated with conflicting metric definitions, inconsistent terminology, and no shared reference document. Cross-team decisions were slow because every discussion had to re-establish definitional common ground.

**Task:** Create and drive adoption of a unified knowledge architecture — documentation that served as the shared language across all technical teams.

**Action:** Authored a comprehensive library of internal product documentation: Metric Guides (precise definitions and rationales for every biomechanical measurement), SOPs (standardized procedures for annotation, QA, and feature development), and Schema Definitions (the HPv4 JSON structure with coach-intent documentation). Designed each document for its specific audience — Metric Guides for cross-functional use, SOPs for operational teams, Schema Definitions for engineering and data science.

Drove adoption by making the documentation useful, not mandatory. Each document was designed to answer the questions teams were already asking — which made referring to it the path of least resistance.

**Result:** Elevated company maturity from ad hoc decision-making to structured, knowledge-driven product development. Reduced inter-departmental ambiguity and accelerated development cycles by eliminating the definitional re-establishment step from every cross-team discussion. The documentation library became the institutional memory that onboarded new team members and preserved decisions when team composition changed.

**Weighting:** TD: 6 | PI: 8 | TR: 9

---

### Story 12: Compliance-Driven Product Design (C-32)

**Interview Questions:**
- "Describe a product you built where regulatory compliance was a primary design constraint, not an afterthought."
- "How do you navigate the tension between product velocity and compliance requirements in regulated industries?"

**Situation:** 1872 Consulting's HR tech modernization operated in an industry with heavy compliance requirements — privacy, security, and regulatory audits were required before any system changes could go live. The legacy AS400 infrastructure made this worse: every modernization step had to be sequenced around compliance approval gates.

**Task:** Design and implement a modern HRIS platform that maintained full regulatory compliance throughout the transition — not passing compliance audits after the fact, but designing for compliance from first principles.

**Action:** Approached compliance as architecture rather than a checklist: the system's security model, data handling logic, and API integration structure were all designed within regulatory constraints from the start. This required deep understanding of the specific regulatory requirements (privacy standards, data handling protocols, audit trail requirements) before writing a single technical specification.

Built API-based vendor integration networks that met the privacy and security standards required by the regulatory environment, while improving processing speed and reducing cost — demonstrating that compliance-first architecture can improve performance, not just constrain it.

**Result:** Successfully implemented the modernized platform while maintaining full regulatory compliance throughout the transition — no compliance failures during the migration. The architecture's regulatory defensibility was directly instrumental in securing a $1.1M Fortune 100 energy company contract, where compliance credibility was a prerequisite for vendor consideration.

**Debrief:** This story is specifically high-value for fintech, healthcare, and government tech roles where compliance is a primary design constraint. The insight — compliance as architecture versus compliance as checklist — is the PM-level framing that distinguishes strategic thinking from procedural compliance management.

**Weighting:** TD: 6 | PI: 9 | TR: 8

---

### Story 13: Revenue Operations & Territory Growth (C-29)

**Interview Questions:**
- "Tell me about a time you drove significant revenue growth through disciplined KPI management and execution."
- "How do you translate technical product complexity into customer-facing value propositions?"

**Situation:** As a territory sales representative for Nidec Shimpo America, responsible for scientific and industrial measurement instrumentation — technically complex products requiring translation from specification language to business value for non-technical buyers.

**Task:** Grow territory revenue through KPI-disciplined execution and product enablement support for distribution partners.

**Action:** Established structured KPI tracking across 25 targets, achieving 22/25 in year one. Built customer-level business cases that translated technical specifications (torque measurement accuracy, load cell precision) into operational ROI (reduced defect rates, faster QA cycles). Developed product enablement materials that gave distribution partners the language to sell technical products without requiring deep instrumentation expertise.

**Result:** Grew territory revenue 10.2% ($110k) in year one, achieving record-setting quarterly revenue through disciplined KPI execution and partner enablement investment.

**Debrief:** Use this story when asked about business acumen, revenue operations, or the sales-to-product career transition. The PM insight from this experience: understanding what it takes to close a technical sale — translating ROI in the customer's language, handling objections — informs product decisions that user research alone doesn't reveal.

**Weighting:** TD: 4 | PI: 8 | TR: 8

---

### Story 14: Rapid Prototyping & Internal Tooling with AI Coding (C-20)

**Interview Questions:**
- "Describe a time you built a technical solution yourself in a non-engineering role."
- "How do you use AI-assisted development tools in your product work?"
- "Tell me about a time you had to close a gap between what engineering could build and what the product needed."

**Situation:** Forensic validation of 3D computer vision model outputs required tools that didn't exist — data collection pipelines, analysis scripts, and validation dashboards that engineering didn't have bandwidth to build and product couldn't wait for.

**Task:** Build internal testing and data collection tools independently, using AI-assisted coding to bridge the gap between engineering capacity and product investigation needs.

**Action:** Used Claude Code and Python to build autonomous data pipelines that collected, processed, and analyzed model output data across hundreds of video samples. Built validation dashboards that made jitter patterns, drift rates, and failure modes visible across the dataset. Iterated rapidly because the tools were built for internal use — optimizing for investigation speed over production quality.

**Result:** Delivered forensic validation findings that would have taken weeks of engineering time to produce through traditional channels, within the timeline the product needed. Demonstrated that AI-assisted coding enables PMs to ship technical solutions that change the speed and depth of product investigation — not just the depth of product specification.

**Debrief:** This story is most effective for roles that value technical PMs who can build alongside engineering, not just direct them. Lead with the business problem (we needed findings faster than engineering could support), not the technology.

**Weighting:** TD: 7 | PI: 7 | TR: 9

---

### Story 15: Product Vision & Platform Scalability (C-22)

**Interview Questions:**
- "Tell me about a time you designed a system that could scale beyond its initial use case."
- "How do you architect platform features that serve multiple user segments without rebuilding for each one?"

**Situation:** The NeoSavant platform was built initially for basketball. Expanding to additional sports would naively require rebuilding the interpretation layer, coaching logic, and UI for each sport separately — an unsustainable scaling model.

**Task:** Design an abstraction architecture that enabled the platform to scale across sports without sport-specific rebuilds.

**Action:** Designed the Phase Canon — a universal movement taxonomy abstracting sport-specific data into a common framework: Activities (the overall action), Phases (ordered temporal segments), and Metrics (specific measurements per phase). Sport-specific behavior lived entirely in the logic instruction layer; the architecture remained constant. YOLO detection models identified sport-specific objects; BlazePose keypoints provided consistent body references; temporal logic triggered on sport-specific events. The inputs stayed the same. The instructions changed.

**Result:** Enabled the platform to scale from a single-sport focus toward a universal motion-analysis engine without architectural refactoring. The Phase Canon also became the interface architecture for SmartPlayer — the same abstraction that enabled sports scalability also solved the cognitive load problem in the user-facing product.

**Weighting:** TD: 8 | PI: 8 | TR: 8

---

### Story 16: Conflict Resolution Through Structured Documentation (C-21)

**Interview Questions:**
- "Tell me about a time you resolved a recurring technical conflict between teams using a systemic solution rather than arbitrating individual disagreements."
- "How do you handle situations where cross-functional teams can't agree on definitions or priorities?"

**Situation:** Engineering and data science teams at NeoSavant had recurring disputes about metric definitions — disagreements that re-emerged in every sprint because there was no authoritative reference to resolve them. Each team had its own working understanding, and no one could escalate to a shared source of truth.

**Task:** Resolve the definitional conflict systemically — not by arbitrating individual disputes, but by establishing the shared reference that made disputes unnecessary.

**Action:** Built the Heuristic Profile documentation as the authoritative source of truth: precise metric definitions with the biomechanical rationale, coach-intent documentation explaining why each measurement existed, and exact keypoint terminology using BlazePose naming conventions. Made it accessible to all teams and positioned it not as a constraint but as the shared language that would accelerate every decision.

**Result:** Eliminated the recurring definitional conflict by removing ambiguity from the source. Cross-functional alignment accelerated development cycles — teams could reference the document rather than re-litigating definitions in meetings. The documentation became the institutional memory that onboarded new team members without requiring tribal knowledge transfer.

**Weighting:** TD: 7 | PI: 8 | TR: 9

---

### Story 17: Technical Troubleshooting Under Pressure (C-06)

**Interview Questions:**
- "Describe a time a critical feature was failing in ways the engineering team couldn't diagnose."
- "How do you approach debugging complex AI systems when conventional debugging doesn't surface the root cause?"

**Situation:** Flagship 3D geometry metrics — including upper arm angle, a core coaching metric — were failing unpredictably in production. The engineering team was working from noisy data without a clear mathematical root cause.

**Task:** Diagnose the exact root cause of the geometric failures and provide engineering with actionable fix specifications.

**Action:** Dove into raw keypoint data and manually traced the 3D calculations frame-by-frame using vector math and coordinate reconstruction. Identified two distinct failure types: incorrect projection-plane assignments (calculations using the frontal plane when the sagittal plane was correct for the movement), causing systematic 30°-70° angular errors; and vector directionality errors where the sign convention was inconsistent across frames.

Documented both failure types with mathematical precision — not "the angle is wrong" but "the upper arm angle calculation is using the chest plane instead of the sagittal plane for this movement phase, producing a systematic positive bias of 30°-70°."

**Result:** Provided engineering with the exact mathematical root cause specifications needed to deploy targeted fixes. Restored accuracy to flagship metrics and established the diagnostic methodology (frame-by-frame mathematical tracing) as a repeatable approach for future geometry debugging.

**Weighting:** TD: 10 | PI: 8 | TR: 7

---

### Story 18: Systems Integration & Data Synchronization (C-12)

**Interview Questions:**
- "Tell me about a time you had to ensure seamless integration between multiple complex, time-sensitive data streams."
- "Describe your experience with real-time synchronization requirements in a production system."

**Situation:** The 2D/3D playback system was experiencing drift between three data streams — raw video, AI-generated skeleton overlays, and calculated biomechanical metrics — creating a disjointed review experience where the skeleton didn't align with the video and the metrics didn't correspond to the displayed frame.

**Task:** Establish robust synchronization standards to ensure 100% data alignment across all visual and analytical layers.

**Action:** Defined frame-level synchronization protocols for the time-series data — explicit alignment rules for how video timestamps, skeleton keyframe data, and metric calculation windows were matched. Worked with engineering to implement latency compensation and alignment logic that handled the variable processing times of each data stream. Established the synchronization tolerance standards that defined when the system was "aligned" versus when a frame was flagged as unreliable.

**Result:** Achieved reliable synchronization across all three data streams, producing a performance review interface where video, skeleton, and metrics aligned accurately enough to be used for coaching decisions. The synchronization standards became the foundation for the reliability indicators in the AI Trust UX design.

**Weighting:** TD: 8 | PI: 7 | TR: 8

---

### Story 19: AI Content Architecture & Prompt Engineering (C-24)

**Interview Questions:**
- "How do you design scalable content systems for AI agents that need to produce contextually relevant outputs at volume?"
- "Describe your experience with prompt engineering and managing LLM outputs in a production environment."

**Situation:** The Voice Assist feature needed to generate coaching cues that were specific to the exact biomechanical data from each shot — not generic feedback templates, but precise, phase-aware coaching that referenced the actual measurement outcomes. Hardcoding responses for every possible combination was impossible at scale.

**Task:** Design a scalable AI content architecture that automated the generation of highly specific, contextually relevant coaching cues based on real-time biomechanical data.

**Action:** Designed the CueGen token-chain system: a heuristic input map that took the measurement outputs from the Heuristic Profile (what was measured, what the result was, what phase it occurred in), combined them with the active feedback settings (Coverage, Verbosity, Specificity, Tone, etc.), and fed the structured token set to the LLM with specific behavioral guardrails. The LLM generated natural-sounding coaching language from the structured inputs — not templated responses.

Used ChatGPT to iterate on token structures and prototype linguistic patterns, and Claude to refine behavioral guardrails and context-aware phrasing. The token-chain architecture meant that coaching cues were generated fresh for each shot from the actual measurement data, not drawn from a library of pre-written responses.

**Result:** Automated the generation of coaching cues that referenced specific measurement outcomes, scaled across 6,075 configuration permutations without requiring manual content creation for each combination, and maintained natural-sounding language through LLM generation rather than template assembly.

**Weighting:** TD: 8 | PI: 8 | TR: 9

---

### Story 20: Product Launch & MVP Definition (C-27)

**Interview Questions:**
- "Walk me through your process for taking a product from 0 to 1."
- "How do you define MVP scope when there are many possible features competing for inclusion?"

**Situation:** At 1872 Consulting, identified a product opportunity to convert the internal recruiting process into an external marketplace — a referral-based bounty platform where the network would source and surface qualified candidates in exchange for bounty payments.

**Task:** Define product vision and MVP scope for a new marketplace product, taking it from concept to launch.

**Action:** Led the product discovery phase: defined the primary user flows (referrer submits candidate, company tracks and evaluates, bounty is paid on hire), identified the core value proposition (network-driven candidate sourcing without internal recruiter overhead), and ruthlessly scoped the MVP to that single value proposition. Excluded internal workflow features, advanced tracking, and payment automation from V1 — the MVP needed to validate whether the network would actually refer quality candidates, not whether every downstream workflow was automated.

Conducted market research, designed the core user flows, and defined the build scope around the minimum feature set that would answer the most important product risk: would referrers participate?

**Result:** Launched the MVP, validated the network-driven sourcing model, and established a scalable candidate acquisition channel that operated in parallel with the internal outbound effort. The bounty platform became an additional supply lever alongside the BD pipeline improvement from the CRM automation work.

**Weighting:** TD: 5 | PI: 8 | TR: 9

---

## Story Selection Matrix

| Interview Vibe / Competency | Primary Story | Backup Story |
|:---|:---|:---|
| **"Highly Technical PM" test** | Story 3: Forensic AI Validation | Story 17: Technical Troubleshooting |
| **"AI/LLM Product" deep dive** | Story 1: AI Agent Orchestration | Story 19: AI Content Architecture |
| **"0 to 1 / Builder" question** | Story 20: MVP Definition | Story 5: Research Tool to Product |
| **"Scaling & Transformation"** | Story 5: Product Transformation | Story 15: Platform Scalability |
| **"Cross-functional Conflict"** | Story 16: Conflict Resolution | Story 11: Strategic Alignment |
| **"Data & Architecture"** | Story 2: Knowledge Engineering | Story 18: Systems Integration |
| **"Hardware / IoT / Edge"** | Story 4: Operational UX | Story 8: Data Pipeline |
| **"Business Impact / Revenue"** | Story 13: Revenue Operations | Story 10: Digital Transformation |
| **"User Trust & UX"** | Story 6: AI Trust & Safety UX | Story 9: Information Architecture |
| **"Compliance / Regulated Industry"** | Story 12: Compliance-Driven Design | Story 2: Knowledge Engineering |
| **"Internal Tooling / Builder PM"** | Story 14: Rapid Prototyping (Claude Code) | Story 3: Forensic AI Validation |
| **"Vision & Strategy"** | Story 15: Platform Scalability | Story 5: Product Transformation |

---

*Version 3.0 — All stories rebuilt from Master Context Blocks V1*
*Key corrections from V2: 6,075 permutations (not 81); RVSE identified as the earlier 81-permutation version; Phase Canon explicitly named in Stories 2, 5, 9, 15; multi-source validation framework made explicit in Story 3; field-vs-lab validation distinction added to Story 4*
