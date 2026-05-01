---
description: Dedicated performance profiling — measure, profile, identify hotspots. Different from /optimize (which fixes). See skills/coding/perf/SKILL.md
argument-hint: [target] [--metric <wall|cpu|mem|allocs|queries|net>]
allowed-tools: Read, Bash, Grep, Glob
---

# /siftcoder:perf

Profile + measure. Multi-iteration, deterministic-workload, top-N hotspots. Output is a baseline + Pareto-ranked hotspot list. Pair with `/siftcoder:optimize` to actually fix.

See `skills/coding/perf/SKILL.md`.
