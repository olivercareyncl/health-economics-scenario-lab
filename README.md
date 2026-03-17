# Health Economics Scenario Lab

Interactive health economics sandboxes for testing how different service changes might affect cost, activity, outcomes, and value under uncertainty.

## Live apps

- **SafeStep** — Falls Prevention ROI Sandbox
- **ClearPath** — Early Diagnosis Value Sandbox
- **WaitWise** — Waiting List Intervention Value Sandbox
- **PathShift** — Service Redesign Value Sandbox
- **FrailtyForward** — Frailty and Community Support Value Sandbox

## What this repo is

Health Economics Scenario Lab is a suite of lightweight Streamlit apps designed to support **early-stage economic thinking**.

These tools are built to help explore questions such as:

- What might need to be true for an intervention to look worthwhile?
- How sensitive is the result to key assumptions?
- Does the case look stronger under targeting?
- How much does costing method matter?
- What should be validated next before using the output in a real decision conversation?

The apps are intentionally designed as **decision-testing sandboxes**, not formal economic models.

They sit somewhere between:
- a rough calculator
- a service design thinking tool
- an early health economics framing aid

## What these apps are for

These apps are useful for:

- exploring intervention logic before building a full business case
- stress-testing assumptions in a structured way
- comparing delivery options or targeting strategies
- supporting conversations between analysts, commissioners, clinicians, and service leads
- making economic reasoning more interactive and transparent

## What these apps are not

These apps are **not**:

- formal NICE-style models
- full cost-effectiveness analyses
- probabilistic sensitivity analyses
- Markov models
- patient-level simulations
- decision tools that should be used without local validation

All outputs should be treated as **illustrative and exploratory**.

## Design principles

Across the suite, each module follows the same broad product pattern:

- clean Streamlit UI
- interactive assumptions
- multi-year horizon where relevant
- threshold analysis
- bounded deterministic uncertainty
- one-way sensitivity analysis
- scenario comparison
- comparator view
- assumption provenance and confidence tags
- structured interpretation and validation prompts

The goal is to make economic reasoning feel more:
- transparent
- testable
- interpretable
- decision-oriented

without overcomplicating the model structure.

## Current modules

### SafeStep
**Falls Prevention ROI Sandbox**

Tests how falls prevention assumptions change:
- falls avoided
- admissions avoided
- bed days avoided
- programme cost
- QALYs
- cost-effectiveness

### ClearPath
**Early Diagnosis Value Sandbox**

Tests how shifting diagnosis earlier changes:
- emergency pathway pressure
- admissions and bed days
- treatment-related cost differences
- QALYs
- cost-effectiveness

### WaitWise
**Waiting List Intervention Value Sandbox**

Tests how waiting list interventions change:
- backlog pressure
- throughput
- escalation while waiting
- admissions and bed days
- programme cost
- QALYs
- cost-effectiveness

### PathShift
**Service Redesign Value Sandbox**

Tests how redesigning a care pathway changes:
- activity by setting
- admissions
- follow-up burden
- bed use
- programme cost
- QALYs
- cost-effectiveness

### FrailtyForward
**Frailty and Community Support Value Sandbox**

Tests how earlier frailty support changes:
- crisis events
- non-elective admissions
- bed use
- programme cost
- QALYs
- cost-effectiveness

## Common features

Most modules include:

- editable synthetic assumptions
- overview KPI cards
- assumptions table with metadata
- one-way sensitivity analysis
- scenario presets
- bounded low/base/high uncertainty views
- comparator view
- yearly results table
- rule-based interpretation
- decision-readiness prompts

## Modelling philosophy

The modelling approach is deliberately bounded.

These apps aim to be:
- simple enough to understand
- flexible enough to explore
- structured enough to be useful

That means making trade-offs.

In most cases, the models:
- use synthetic defaults
- simplify pathway logic
- apply rule-based interpretation rather than LLM reasoning
- avoid heavy formal modelling machinery
- prioritise clarity over realism at all costs

The intention is not to replace formal health economics work, but to improve the stage before it.

## Intended audience

This repo is aimed at people working in or around:

- health economics
- service redesign
- NHS analytics
- commissioning
- operational planning
- improvement
- early business case development

It is especially useful where teams want to think more economically, but do not yet need or have a full formal model.

## Important disclaimer

These apps are **illustrative only**.

They are not formal economic evaluations and should not be used for real-world decisions without:
- local validation
- local costing review
- local activity review
- clinical and operational input
- appropriate analytic governance

## Why this exists

A lot of economic thinking in service change still happens in static decks, spreadsheets, or loosely structured conversations.

This repo is an attempt to make that stage more:
- interactive
- transparent
- testable
- decision-useful

The ambition is modest but practical:
to build lightweight tools that help people explore value before they commit to a full modelling exercise.

## Roadmap

Potential future modules include:

- **StableHeart** — Long-Term Condition Management Value Sandbox
- **SteadyLungs** — Respiratory / COPD Support Value Sandbox
- **KidneyKind** — CKD Pathway Value Sandbox
- **DiabetesForward** — Diabetes Management Value Sandbox

## Author

Built as part of an exploration into interactive health economics tooling and decision support.

---
**Health Economics Scenario Lab**  
Interactive sandboxes for exploring value under uncertainty.