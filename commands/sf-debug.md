---
description: Salesforce debug log analysis — parse, find bottlenecks, governor limits
argument-hint: [parse <logfile>|tail|limits]
allowed-tools: Bash, Read
---

# /siftcoder:sf-debug

## Subactions

- `parse <logfile>` — parse a downloaded debug log; surface SOQL count, DML count, CPU spikes, callout latency
- `tail` — `sf apex tail-log` against the configured user
- `limits` — fetch a recent log and report governor-limit utilisation per phase

Output: timeline view + top 5 hotspots with line citations.
