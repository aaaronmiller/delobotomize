# Delobotomize

> **Stop the Blind Gardener. Restore your codebase's memory and cognition.**

## The Problem

You ask AI to fix one bug. It "goes to town like a blind gardener" - pruning healthy code, breaking working features, and turning a minor issue into a catastrophic mess.

This is **Context Collapse**: AI loses track of what works vs what's broken, makes changes without understanding the codebase structure, and creates cascade failures.

## The Solution

**Delobotomize** creates a persistent "memory bank" that AI can see before it starts cutting. A 5-phase emergency triage system for mid-project AI disasters.

### Key Features

- **Persistent Memory Bank** - AI never forgets what works
- **Claim Verification** - Don't trust AI fixes, verify them
- **Emergency Recovery** - Circuit breaker when AI goes blind
- **Solo Dev Focused** - Lightweight processes, not corporate bureaucracy
- **Context Preservation** - 5 safety gates prevent cascade failures

## Quick Start

```bash
# Install
npm install -g delobotomize

# Initialize in your project
cd your-broken-project
delobotomize init --profile solo

# Run emergency audit
delobotomize audit --depth deep

# Review findings
cat .delobotomize/audit-reports/summary.md

# Archive out-of-scope files
delobotomize triage
delobotomize archive

# Validate system still works
delobotomize validate

# Fix remaining bugs with context
delobotomize remediate --interactive
```

## When to Use Delobotomize

Use this tool when you experience:

- ✅ AI making "blind" changes without understanding your code
- ✅ Minor bug fix breaking 3 other working features
- ✅ Model suggesting same wrong fix repeatedly
- ✅ Feature creep creating out-of-scope files
- ✅ Lost track of what's working vs broken
- ✅ Mid-project development has stalled

## Status

🚧 **In Development** - Week 1-2 of 10-week roadmap

**Current Phase:** Foundation & Core Scanner
**Next Release:** v0.1.0 MVP (Audit + Reports)

See [COMPLETE_INTEGRATION_PLAN.md](analysis/COMPLETE_INTEGRATION_PLAN.md) for full roadmap.

## Documentation

- [Installation Guide](docs/INSTALLATION.md) (Coming soon)
- [Usage Guide](docs/USAGE.md) (Coming soon)
- [Architecture](docs/ARCHITECTURE.md) (Coming soon)
- [Debugging Methodology](docs/DEBUGGING_METHODOLOGY.md) (Coming soon)

## Project Background

Delobotomize was built from real-world experience recovering from AI-assisted development disasters. All methodologies are extracted from actual debugging sessions and backed by research on LLM context degradation.

See the [analysis/](analysis/) directory for complete extraction of patterns, methodologies, and insights.

## Contributing

This project is in active development. Contributions welcome once v1.0.0 is released.

## License

MIT License - See [LICENSE](LICENSE) file

## Credits

Built from patterns discovered in DataKiln project recovery.
Research-backed methodologies for context preservation.

---

**Stop the blind gardener. Start with `delobotomize init`.**
