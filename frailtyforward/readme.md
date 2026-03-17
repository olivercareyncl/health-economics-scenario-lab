# FrailtyForward

**FrailtyForward** is an interactive health economics sandbox for exploring how earlier frailty and community support changes crisis events, admissions, bed use, costs, and cost-effectiveness under different assumptions.

It is part of the broader **Health Economics Scenario Lab** project: a series of interactive decision sandboxes designed to make economic reasoning more transparent, faster to explore, and easier to interrogate than a static spreadsheet.

**Live app:** [FrailtyForward]((https://health-economics-scenario-lab-gp9ar7jzr8kcpnckcwgyuf.streamlit.app/))

## What it does

FrailtyForward lets users test how the economic case for earlier frailty and community support changes under different assumptions.

The app includes:
- multi-year time horizon modelling
- discounting
- annual intervention effect decay
- annual participation / persistence drop-off
- targeting modes
- alternative costing methods
- threshold analysis
- bounded low/base/high uncertainty
- scenario comparison
- comparator-style option appraisal
- assumption confidence and source tags
- validation prompts and structured recommendation outputs

The goal is not to replace a formal economic evaluation.

The goal is to provide an **illustrative decision sandbox** that helps surface:
- what the case depends on
- where it looks fragile
- what should be validated next
- how different support set-ups compare

## Why I built it

Frailty support often sits across prevention, urgent care, admission avoidance, and community care, which makes the economic case important but difficult to explore quickly.

I wanted to explore what a more interactive tool might look like.

FrailtyForward is deliberately bounded and simplified, but that is part of the point:
it is designed to support earlier, faster, and more transparent decision thinking.

## Key questions the app helps explore

- What value might earlier frailty support create?
- Does the case depend more on crisis prevention, admission reduction, or LOS reduction?
- Does the case look stronger when focused on higher-risk or frequent-admitter patients?
- How much does the costing method matter?
- What would need to be true for the support model to look worthwhile?
- What assumptions should be validated next?

## App structure

The app is organised into five main views:

### Overview
Headline outputs, charts, threshold analysis, bounded uncertainty, decision readiness, and yearly results.

### Assumptions
Editable inputs alongside source type and confidence tags to make assumption quality more visible.

### Sensitivity
One-way sensitivity analysis showing which assumptions move discounted cost per QALY the most.

### Scenarios
Comparison of multiple delivery and targeting configurations, with simple ranking for value, efficiency, and impact.

### Interpretation
Rule-based summaries explaining what the result suggests, what it depends on, what looks fragile, and what should be validated next.

## Important disclaimer

**FrailtyForward is an illustrative sandbox for exploratory decision support. It is not a formal economic evaluation and should not be used for real-world decisions without local validation.**

In particular:
- assumptions are synthetic or simplified
- costing approaches are bounded and stylised
- uncertainty is deterministic, not probabilistic
- the model does not represent a full formal appraisal framework

## Tech stack

- Python
- Streamlit
- Pandas
- Plotly

## Current status

FrailtyForward is currently a working prototype / portfolio project.

It is intended to demonstrate:
- health economics thinking
- interactive decision support design
- product-style analytics
- transparent modelling structure
- rule-based interpretation without relying on LLMs

## Possible next steps

Future versions could explore:
- richer comparator logic
- stronger assumption provenance workflows
- more detailed validation layers
- additional community support and ageing modules
- broader Health Economics Scenario Lab tools beyond frailty support

## Related idea

FrailtyForward is designed as one module within a larger **Health Economics Scenario Lab** concept, where each module focuses on a specific decision problem but shares the same principles:
- transparent assumptions
- interactive exploration
- bounded uncertainty
- clear interpretation
- explicit limitations

## Author

Built by Oliver Carey.
