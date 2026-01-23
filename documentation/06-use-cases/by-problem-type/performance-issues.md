# Use Case: Performance Issues

**Diagnosing and fixing performance problems**

---

## Overview

Performance issues require systematic investigation, profiling, and targeted optimization. SiftCoder provides tools for the entire performance debugging workflow.

---

## Performance Investigation Workflow

### Step 1: Identify the Issue

```bash
# 1. Investigate slow code
/siftcoder:investigate "Page load is slow"

# 2. Search for performance patterns
/siftcoder:search "performance bottleneck"
```

### Step 2: Profile and Analyze

```bash
# 3. Profile the code
npm run build -- --profile

# 4. Check for expensive operations
/siftcoder:investigate "Database query performance"
```

### Step 3: Optimize

```bash
# 5. Suggest optimizations
/siftcoder:optimize

# 6. Apply fixes
/siftcoder:fix "Optimize database queries"
```

### Step 4: Validate

```bash
# 7. Test performance
npm run benchmark

# 8. Verify no regressions
/siftcoder:blast-radius
```

---

## Common Performance Issues

### Issue 1: Slow Database Queries

```bash
# 1. Investigate queries
/siftcoder:investigate "Slow user list query"

# 2. Analyze query patterns
[Output shows missing index, N+1 queries]

# 3. Fix with boundaries
/siftcoder:scope add src/models/User.ts
/siftcoder:scope add src/repositories/userRepository.ts
/siftcoder:fix "Add indexes and optimize queries"

# 4. Verify
npm test
```

### Issue 2: Large Bundle Size

```bash
# 1. Analyze bundle
npm run build -- --analyze

# 2. Identify large dependencies
[Output shows lodash, moment, etc.]

# 3. Optimize imports
/siftcoder:optimize "Replace lodash with native methods"

# 4. Verify bundle size reduction
npm run build
```

### Issue 3: Memory Leaks

```bash
# 1. Profile memory
npm run profile --memory

# 2. Investigate leak
/siftcoder:investigate "Memory leak in event handlers"

# 3. Fix cleanup
/siftcoder:fix "Add cleanup for event listeners"

# 4. Verify
npm run test:memory
```

### Issue 4: N+1 Query Problem

```bash
# 1. Detect N+1 queries
/siftcoder:investigate "N+1 queries in user posts"

# 2. Find the issue
[Shows nested queries in loop]

# 3. Fix with batch loading
/siftcoder:fix "Implement data loader pattern"

# 4. Verify query reduction
npm run test:performance
```

---

## Optimization Strategies

### Frontend Optimization

```bash
# 1. Code splitting
/siftcoder:add-feature "Implement code splitting"

# 2. Lazy loading
/siftcoder:add-feature "Add lazy loading for images"

# 3. Memoization
/siftcoder:add-feature "Add React.memo for expensive components"

# 4. Virtual scrolling
/siftcoder:add-feature "Implement virtual scrolling for lists"
```

### Backend Optimization

```bash
# 1. Database indexing
/siftcoder:add-feature "Add database indexes"

# 2. Query optimization
/siftcoder:optimize "Rewrite inefficient queries"

# 3. Caching
/siftcoder:add-feature "Add Redis caching layer"

# 4. Connection pooling
/siftcoder:add-feature "Implement database connection pool"
```

### API Optimization

```bash
# 1. Pagination
/siftcoder:add-feature "Add pagination to list endpoints"

# 2. Field selection
/siftcoder:add-feature "Add GraphQL-like field selection"

# 3. Compression
/siftcoder:add-feature "Enable response compression"

# 4. Rate limiting
/siftcoder:add-feature "Implement API rate limiting"
```

---

## Performance Testing

### Load Testing

```bash
# 1. Generate load tests
/siftcoder:test load

# 2. Run load test
npm run test:load

# 3. Analyze results
[Identify bottlenecks]

# 4. Optimize
/siftcoder:optimize "Fix bottlenecks"
```

### Benchmarking

```bash
# 1. Create benchmarks
/siftcoder:test benchmark

# 2. Run benchmarks
npm run benchmark

# 3. Compare before/after
[Verify improvements]
```

---

## Example: Complete Performance Debugging

```bash
# Problem: API endpoint takes 5 seconds

# 1. Investigate
/siftcoder:investigate "GET /api/users is slow"

# Output:
# 🔍 INVESTIGATION RESULTS:
#
# Issue: N+1 query problem
# Location: src/repositories/userRepository.ts:45
#
# For each user, making additional query for posts:
# - Query 1: SELECT * FROM users (100ms)
# - Queries 2-101: SELECT * FROM posts WHERE user_id = ? (100 × 50ms = 5000ms)
# - Total: 5100ms
#
# Recommendation: Use JOIN or data loader

# 2. Set boundaries
/siftcoder:scope add src/repositories/userRepository.ts

# 3. Fix
/siftcoder:fix "Implement JOIN query for users with posts"

# 4. Verify fix
npm test

# 5. Benchmark
npm run benchmark

# Output:
# Before: 5100ms
# After: 150ms
# Improvement: 97% reduction
```

---

## Performance Monitoring

### Continuous Monitoring

```bash
# 1. Add monitoring
/siftcoder:add-feature "Application performance monitoring"

# 2. Track metrics
- Response times
- Database query times
- Memory usage
- CPU usage
- Error rates

# 3. Set up alerts
/siftcoder:add-feature "Performance alerting"
```

### Production Debugging

```bash
# 1. Check performance logs
/siftcoder:monitor

# 2. Investigate production issue
/siftcoder:investigate "Production API latency spike"

# 3. Reproduce locally
/siftcoder:debug reproduce

# 4. Fix and deploy
/siftcoder:fix "Optimize slow query"
git push
[CI/CD deploys]
```

---

## Quick Reference

| Issue | Investigation | Fix |
|-------|--------------|-----|
| **Slow query** | `/investigate "slow query"` | `/fix "add index"` |
| **Large bundle** | `npm run build --analyze` | `/optimize "code splitting"` |
| **N+1 queries** | `/investigate "N+1"` | `/fix "data loader"` |
| **Memory leak** | `npm run profile --memory` | `/fix "cleanup listeners"` |
| **Slow API** | `/investigate "slow API"` | `/fix "add caching"` |

---

## Best Practices

### ✅ DO

- Profile before optimizing
- Set performance budgets
- Monitor in production
- Test before/after
- Document performance decisions

### ❌ DON'T

- Optimize without measuring
- Premature optimization
- Ignore database indexes
- Skip caching strategies
- Break functionality for speed

---

## See Also

- [Workflow: Investigate & Fix](../../05-workflows/investigate-fix.md)
- [Command: Optimize](../../02-command-reference/by-category/remaining-workflows.md)
- [Best Practices: Performance](../../09-best-practices/index.md)
