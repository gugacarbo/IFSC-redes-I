# PROJECT KNOWLEDGE BASE

**Updated:** 2026-05-13
**Branch:** main

## OVERVIEW

npm monorepo for IFSC Estrutura de Dados course. Biome linting for root JS/TS config files, Turbo 2.x orchestration, Husky + lint-staged git hooks. `apps/` contains independent Java course projects (javac-only, no Maven). `packages/` empty scaffold.

Contains `apps/udp-iot/` - UDP-based IoT monitoring system with ESP32, Java backend, and React GUIs.

## STRUCTURE

```
IFSC-redes-I/
├── apps/                           # Java TR projects (tr1-playlist, tr2-hash-table)
│   └── udp-iot/                    # UDP-IoT monitoring (workspace)
│       ├── applications/           # Desktop apps — Java src split into subpackages (api/, bridge/, config/, gui/, model/, network/, state/, udp/)
│       └── packages/               # Shared packages (ui, udp-shared)
├── .agents/skills/                 # Skill system (skill-creator toolkit)
├── .husky/                         # Git hooks (husky)
├── biome.json                       # Biome: tabs, double-quote JS
├── turbo.json                       # Turbo pipeline (build, dev, test, lint, typecheck)
├── package.json                     # Root: npm workspaces, packageManager: npm@10.9.2
└── .lintstagedrc.js                # Lint-staged: Biome check on staged JS/TS
```

## WHERE TO LOOK

| Task                | Location                        | Notes                                                          |
| ------------------- | ------------------------------- | -------------------------------------------------------------- |
| Lint config         | `biome.json`                    | Tabs, double-quote JS, ESM root                                |
| Build orchestration | `turbo.json`                    | Turbo 2.x requires `packageManager` field in root package.json |
| Java projects       | `apps/`                         | Each app has own `package.json` with Turbo-compatible scripts  |
| Skill toolkit       | `.agents/skills/skill-creator/` | Python scripts, SKILL.md, eval-viewer                          |

## CONVENTIONS

- **Package manager**: npm@10.9.2 (root `packageManager` field, npm workspaces)
- **JS style**: Tabs, double quotes (Biome), ESM (`"type": "module"` in root)
- **Java apps**: Compile with `javac`, execute with `java` (no Maven/pom.xml)

## ANTI-PATTERNS

- No pnpm — migrated to npm, do not use pnpm commands
- No Maven in apps — all Java projects use javac
- No `.eslintrc`/`.prettierrc` — Biome handles JS/TS
- New code goes to `apps/` or `packages/`, not root

## UNIQUE STYLES

- Skill definitions use all-caps `SKILL.md`
- Skill Python scripts use `-m` invocation (e.g., `python -m scripts.run_loop`)
- Turbo `dev` pipeline has `cache: false`

## COMMANDS

```bash
npm install                     # Setup workspaces
npx turbo run dev               # Compile + run all apps
npx turbo run dev --filter=tr1-playlist  # Run single app
npm run format:check            # Biome check root JS/TS
```

## UDP-IOT COMMANDS

```bash
# Root level (from apps/udp-iot/)
npm run dev:all                # Run all apps via Turbo
npm run dev:java               # Run Java backends only
npm run dev:gui                # Run GUI apps only
npm run build:all              # Build all apps

# Inside applications/*-gui/
npm run dev                    # Vite dev server + Express backend

# Inside applications/*-java/
npm run dev                    # Run Java app via run-java.cjs
npm run build                  # Compile Java with javac
```

## NOTES

- Turbo 2.x errors without `packageManager` field in root `package.json`
- `apps/udp-iot/applications/` Java sources use subpackages (api/, bridge/, config/, gui/, model/, network/, state/, udp/)
- `apps/udp-iot/packages/ui/` shared components used by both matriz-gui and filial-gui
- Lint-staged only runs on staged JS/TS files (ignores Java)
