# ClearPath

**ClearPath** is an interactive health economics sandbox for exploring how earlier diagnosis changes activity, emergency pathway pressure, costs, outcomes, and cost-effectiveness under different assumptions.

It is part of the broader **Health Economics Scenario Lab** project: a series of interactive decision sandboxes designed to make economic reasoning more transparent, faster to explore, and easier to interrogate than a static spreadsheet.

**Live app:** [ClearPath](ADD_YOUR_CLEARPATH_STREAMLIT_LINK_HERE)

## What it does

ClearPath lets users test how the economic case for earlier diagnosis changes under different assumptions.

The app includes:
- multi-year time horizon modelling
- discounting
- annual intervention effect decay
- annual participation drop-off
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
- how different intervention set-ups compare

## Why I built it

A lot of discussion around earlier diagnosis is conceptually persuasive, but harder to test quickly in a structured way.

I wanted to explore what a more interactive tool might look like.

ClearPath is deliberately bounded and simplified, but that is part of the point:
it is designed to support earlier, faster, and more transparent decision thinking.

## Key questions the app helps explore

- How much value might earlier diagnosis create?
- How much does the result depend on the achievable shift in late diagnosis?
- Does the case look stronger under higher-risk targeting?
- How much does the costing method matter?
- What would need to be true for the intervention to look worthwhile?
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

**ClearPath is an illustrative sandbox for exploratory decision support. It is not a formal economic evaluation and should not be used for real-world decisions without local validation.**

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

ClearPath is currently a working prototype / portfolio project.

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
- additional diagnosis-focused modules
- broader Health Economics Scenario Lab tools beyond early diagnosis

## Related idea

ClearPath is designed as one module within a larger **Health Economics Scenario Lab** concept, where each module focuses on a specific decision problem but shares the same principles:
- transparent assumptions
- interactive exploration
- bounded uncertainty
- clear interpretation
- explicit limitations

## Author

Built by Oliver Carey.
