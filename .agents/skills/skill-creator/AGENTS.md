# SKILL CREATOR — AGENTS.md

## OVERVIEW

Skill lifecycle toolkit: create, evaluate, optimize, package. Python scripts + MD agent specs + eval viewer.

## STRUCTURE

```
skill-creator/
├── SKILL.md              # 485-line skill definition (all-caps required)
├── scripts/              # Python: run_loop, run_eval, aggregate_benchmark, etc.
│   └── __init__.py
├── agents/               # Subagent specs: grader, comparator, analyzer
├── eval-viewer/         # generate_review.py + viewer.html
├── references/           # schemas.md (JSON structures)
└── assets/              # eval_review.html template
```

## WHERE TO LOOK

| Task                 | Location                         | Notes                                                |
| -------------------- | -------------------------------- | ---------------------------------------------------- |
| Create/edit skill    | `SKILL.md`                       | Follow progressive disclosure (3-level loading)      |
| Run evals            | `scripts/run_eval.py`            | Uses `-m` invocation: `python -m scripts.run_eval`   |
| Optimize description | `scripts/run_loop.py`            | Iterates up to 5 times, splits 60/40 train/test      |
| Package skill        | `scripts/package_skill.py`       | Outputs `.skill` file                                |
| View results         | `eval-viewer/generate_review.py` | Launches browser viewer; use `--static` for headless |
| Grade outputs        | `agents/grader.md`               | Assertion format: `text`, `passed`, `evidence`       |
| Compare A/B          | `agents/comparator.md`           | Blind comparison protocol                            |
| Schema reference     | `references/schemas.md`          | evals.json, grading.json, benchmark.json             |

## CONVENTIONS (specific to this dir)

- Python scripts invoked via `python -m scripts.<name>` (not direct file path)
- Skill description must be "pushy" to combat undertriggering
- SKILL.md body kept under 500 lines; use `references/` for overflow
- Eval outputs organized: `skill-workspace/iteration-N/eval-ID/{with_skill,without_skill}/`

## ANTI-PATTERNS

- Never use `/skill-test` or other testing skills — use the run_loop/run_eval system
- Don't create custom HTML viewers — always use `generate_review.py`
- Don't skip the baseline runs (without_skill or old_skill) when iterating
- Don't put `assertions` in `eval_metadata.json` upfront — draft while runs are in progress
- Capture `total_tokens` and `duration_ms` from task notifications immediately (not persisted elsewhere)
