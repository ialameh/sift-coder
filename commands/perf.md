# /siftcoder:perf - Performance Analysis & Optimization

Analyze, profile, and optimize application performance.

## Usage

```
/siftcoder:perf [subcommand] [target]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `analyze` | Static performance analysis (default) |
| `profile` | Runtime profiling guidance |
| `optimize` | Suggest optimizations |
| `benchmark` | Create performance benchmarks |
| `bundle` | Bundle size analysis |

## Arguments
- `$ARGUMENTS` - Subcommand and target file/path

## Instructions

You are a performance expert. Identify bottlenecks, suggest optimizations, and help create fast, efficient applications.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What performance aspect do you want to focus on?"
Header: "Focus"
Options:
- "Full Analysis (Recommended)" - "Check code, queries, bundle, and more"
- "Database Queries" - "Focus on N+1, slow queries"
- "Bundle Size" - "Analyze JavaScript bundle"
- "Memory Usage" - "Find memory leaks and bloat"
```

---

## Subcommand: analyze

### Phase 1: Static Performance Analysis

```
ANALYZING PERFORMANCE...

Target: src/
Files analyzed: 156
```

```
PERFORMANCE ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFORMANCE SCORE: 68/100

┌─────────────────────────────────────────────────────────────┐
│ Performance Breakdown                                       │
│                                                             │
│ Database Queries   ██████░░░░░░░░░░░░░░  28%  (Poor)       │
│ API Efficiency     ████████████░░░░░░░░  58%  (Fair)       │
│ Frontend Bundle    ██████████████░░░░░░  68%  (Fair)       │
│ Memory Patterns    ████████████████░░░░  78%  (Good)       │
│ Async Handling     ████████████████████  92%  (Excellent)  │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE ISSUES (Critical)

1. N+1 QUERY DETECTED
   File: src/api/routes/orders.ts:34
   Severity: HIGH

   Problem:
   ```javascript
   const orders = await Order.findAll();
   for (const order of orders) {
     order.items = await OrderItem.findByOrderId(order.id);  // N queries!
     order.user = await User.findById(order.userId);         // N more!
   }
   ```

   Impact: 100 orders = 201 queries (1 + 100 + 100)
   Expected load: ~2000ms for 100 orders

   Fix:
   ```javascript
   const orders = await Order.findAll({
     include: [
       { model: OrderItem, as: 'items' },
       { model: User, as: 'user' }
     ]
   });
   ```

   Impact after fix: 1 query (~50ms)

2. MISSING INDEX
   File: src/repositories/user.ts:23
   Query: `SELECT * FROM users WHERE email = ?`

   Current: Full table scan
   Suggestion: `CREATE INDEX idx_users_email ON users(email);`
   Impact: 500ms → 5ms for large tables

3. SELECT * DETECTED
   File: src/repositories/product.ts:45
   Query: `SELECT * FROM products WHERE category_id = ?`

   Problem: Fetching all 25 columns when only 5 needed
   Fix: `SELECT id, name, price, thumbnail, slug FROM products...`
   Impact: 30% less data transfer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API ISSUES

1. UNBOUNDED QUERY
   File: src/api/routes/products.ts:12
   Endpoint: GET /api/products

   ```javascript
   const products = await Product.findAll();  // No limit!
   ```

   Problem: Returns all products (could be 100,000+)
   Fix: Add pagination
   ```javascript
   const products = await Product.findAll({
     limit: req.query.limit || 20,
     offset: req.query.offset || 0
   });
   ```

2. MISSING CACHING
   File: src/api/routes/config.ts:23
   Endpoint: GET /api/config

   Problem: Fetches config from DB on every request
   Frequency: Called on every page load
   Fix: Cache in memory or Redis
   ```javascript
   const config = await cache.getOrSet('app-config', async () => {
     return await Config.findAll();
   }, { ttl: 300 }); // 5 min cache
   ```

3. SEQUENTIAL API CALLS
   File: src/services/dashboard.ts:34

   ```javascript
   const users = await fetchUsers();
   const orders = await fetchOrders();      // Waits for users
   const products = await fetchProducts();  // Waits for orders
   ```

   Problem: 3 sequential requests = sum of all latencies
   Fix: Parallel execution
   ```javascript
   const [users, orders, products] = await Promise.all([
     fetchUsers(),
     fetchOrders(),
     fetchProducts()
   ]);
   ```
   Impact: 300ms + 200ms + 150ms → max(300, 200, 150) = 300ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND ISSUES

1. LARGE COMPONENT RE-RENDERS
   File: src/components/ProductList.tsx:12

   ```jsx
   const ProductList = ({ products }) => {
     return products.map(p => <Product key={p.id} {...p} />);
   };
   ```

   Problem: All products re-render when any product changes
   Fix: Memoize Product component
   ```jsx
   const Product = React.memo(({ id, name, price }) => {...});
   ```

2. MISSING VIRTUALIZATION
   File: src/components/OrderHistory.tsx:45

   Problem: Rendering 500+ order items in DOM
   Fix: Use virtualization (react-window)
   ```jsx
   import { FixedSizeList } from 'react-window';

   <FixedSizeList
     height={400}
     itemCount={orders.length}
     itemSize={50}
   >
     {({ index, style }) => (
       <OrderRow order={orders[index]} style={style} />
     )}
   </FixedSizeList>
   ```

3. UNOPTIMIZED IMAGES
   Files: src/components/ProductCard.tsx, Gallery.tsx

   Problem: Loading full-size images for thumbnails
   Fix: Use responsive images with srcset
   ```jsx
   <img
     src={product.thumbnail}
     srcSet={`
       ${product.thumbnail}?w=200 200w,
       ${product.thumbnail}?w=400 400w
     `}
     sizes="(max-width: 600px) 200px, 400px"
     loading="lazy"
   />
   ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEMORY ISSUES

1. EVENT LISTENER LEAK
   File: src/hooks/useWebSocket.ts:23

   ```javascript
   useEffect(() => {
     socket.on('message', handleMessage);
     // Missing cleanup!
   }, []);
   ```

   Fix:
   ```javascript
   useEffect(() => {
     socket.on('message', handleMessage);
     return () => socket.off('message', handleMessage);
   }, []);
   ```

2. LARGE OBJECT IN CLOSURE
   File: src/services/analytics.ts:45

   Problem: Entire response stored in closure
   Impact: Memory grows with each API call
   Fix: Extract only needed data before storing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY

| Category | Issues | Priority |
|----------|--------|----------|
| N+1 Queries | 1 | CRITICAL |
| Missing Index | 1 | HIGH |
| Unbounded Query | 1 | HIGH |
| Missing Cache | 1 | MEDIUM |
| Re-renders | 2 | MEDIUM |
| Memory Leaks | 1 | MEDIUM |

ESTIMATED IMPACT OF FIXES:

Current page load: ~2500ms
After N+1 fix: ~800ms (-68%)
After all fixes: ~400ms (-84%)

NEXT STEPS:
→ /siftcoder:fix "N+1 query in orders endpoint"
→ /siftcoder:perf benchmark src/api/routes/orders.ts
```

---

## Subcommand: profile

### Runtime Profiling Guide

```
/siftcoder:perf profile
```

```
PROFILING GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDED PROFILING APPROACH

1. CPU PROFILING (Node.js)

   Start with profiling:
   ```bash
   node --prof app.js
   # Run your workload
   # Process the output:
   node --prof-process isolate-*.log > profile.txt
   ```

   Or use Chrome DevTools:
   ```bash
   node --inspect app.js
   # Open chrome://inspect
   # Go to "Performance" tab
   ```

   What to look for:
   ├── Functions with high "self" time
   ├── Excessive function calls
   └── Synchronous operations blocking event loop

2. MEMORY PROFILING

   Take heap snapshots:
   ```javascript
   // Add to your code
   const v8 = require('v8');
   const fs = require('fs');

   function takeHeapSnapshot() {
     const snapshotStream = v8.writeHeapSnapshot();
     console.log('Heap snapshot written to', snapshotStream);
   }

   // Call before and after suspected leak
   takeHeapSnapshot(); // baseline
   // ... do operations
   takeHeapSnapshot(); // compare
   ```

   Compare in Chrome DevTools:
   ├── Objects allocated between snapshots
   ├── Retained size (memory held by object)
   └── Retainers (what's keeping object alive)

3. DATABASE PROFILING

   Enable query logging:
   ```javascript
   // Sequelize
   const sequelize = new Sequelize({
     logging: (sql, timing) => {
       console.log(`[${timing}ms] ${sql}`);
     },
     benchmark: true
   });
   ```

   What to look for:
   ├── Queries taking >100ms
   ├── Repeated similar queries (N+1)
   └── Full table scans (EXPLAIN)

4. FRONTEND PROFILING

   React DevTools Profiler:
   ├── Component render times
   ├── What caused re-render
   └── Wasted renders

   Lighthouse:
   ```bash
   npx lighthouse http://localhost:3000 --view
   ```
   Metrics: FCP, LCP, TBT, CLS

AUTOMATED PROFILING SETUP:

I'll add profiling endpoints to your app:

```javascript
// src/utils/profiler.ts
import { performance, PerformanceObserver } from 'perf_hooks';

// Measure function execution time
export function measure<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  return result;
}

// Measure async function
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  return result;
}

// Add to your endpoint:
app.get('/api/orders', async (req, res) => {
  const orders = await measureAsync('fetchOrders', () =>
    Order.findAll({ include: [OrderItem, User] })
  );
  res.json(orders);
});
```

Want me to add profiling to specific files?
```

---

## Subcommand: bundle

### Bundle Size Analysis

```
/siftcoder:perf bundle
```

```
BUNDLE SIZE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Building for analysis...

BUNDLE COMPOSITION

Total size: 1.2 MB (gzipped: 380 KB)

┌─────────────────────────────────────────────────────────────┐
│ main.js                     450 KB    37.5%                 │
│ ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░│
│                                                             │
│ vendor.js                   380 KB    31.7%                 │
│ ██████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                             │
│ charts.js                   220 KB    18.3%                 │
│ ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                             │
│ other chunks                150 KB    12.5%                 │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────────────────────────┘

LARGEST DEPENDENCIES

1. moment.js - 232 KB (67 KB gzip)
   Usage: Date formatting
   Alternative: date-fns (tree-shakeable, 12 KB for same functions)
   Savings: ~55 KB gzipped

2. lodash - 71 KB (24 KB gzip)
   Usage: 3 functions (get, debounce, cloneDeep)
   Fix: Import only what you use
   ```javascript
   // Before
   import _ from 'lodash';
   _.debounce(fn, 100);

   // After
   import debounce from 'lodash/debounce';
   debounce(fn, 100);
   ```
   Savings: ~20 KB gzipped

3. chart.js - 196 KB (65 KB gzip)
   Usage: 2 chart types (line, bar)
   Fix: Use tree-shaking
   ```javascript
   import {
     Chart,
     LineController,
     BarController,
     CategoryScale,
     LinearScale,
     PointElement,
     LineElement,
     BarElement
   } from 'chart.js';

   Chart.register(
     LineController, BarController,
     CategoryScale, LinearScale,
     PointElement, LineElement, BarElement
   );
   ```
   Savings: ~30 KB gzipped

4. @mui/material - 89 KB (28 KB gzip)
   Issue: Importing entire library
   Fix: Use path imports
   ```javascript
   // Before
   import { Button, TextField } from '@mui/material';

   // After
   import Button from '@mui/material/Button';
   import TextField from '@mui/material/TextField';
   ```

DUPLICATE DEPENDENCIES

⚠ Found 3 versions of core-js
   Versions: 2.6.12, 3.21.1, 3.23.4
   Impact: 45 KB duplicated
   Fix: Align versions in package.json

⚠ Found 2 versions of tslib
   Versions: 1.14.1, 2.4.0
   Impact: 12 KB duplicated

UNUSED CODE DETECTED

Dead exports found:
├── src/utils/legacy.ts - 100% unused (15 KB)
├── src/components/OldDashboard.tsx - 100% unused (8 KB)
└── src/services/deprecated.ts - 100% unused (5 KB)

Total unused: 28 KB
Action: Remove or mark as side-effect free

CODE SPLITTING OPPORTUNITIES

1. Charts page (220 KB)
   Currently: Loaded on initial bundle
   Users who visit: 15%
   Fix: Lazy load
   ```javascript
   const Charts = React.lazy(() => import('./pages/Charts'));
   ```

2. Admin section (85 KB)
   Currently: Loaded for all users
   Users with access: 2%
   Fix: Lazy load behind auth check

3. PDF generator (45 KB)
   Currently: Always loaded
   Usage: On-demand only
   Fix: Dynamic import when needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTIMIZATION SUMMARY

Current: 1.2 MB (380 KB gzip)

After optimizations:
├── Replace moment.js:     -55 KB
├── Tree-shake lodash:     -20 KB
├── Tree-shake chart.js:   -30 KB
├── Remove duplicates:     -57 KB
├── Remove dead code:      -28 KB
├── Code splitting:        -180 KB (from initial)
└── ─────────────────────────────
    Total savings:         ~370 KB (98 KB gzip)

Expected: 830 KB (282 KB gzip) - 26% smaller

RECOMMENDED ACTIONS:
1. npm uninstall moment && npm install date-fns
2. Update lodash imports to path imports
3. Configure chart.js tree-shaking
4. Add lazy loading for Charts, Admin, PDF
5. Run: npx depcheck to find unused deps
```

---

## Subcommand: benchmark

### Create Performance Benchmarks

```
/siftcoder:perf benchmark src/api/routes/orders.ts
```

```
CREATING BENCHMARKS

Target: src/api/routes/orders.ts

BENCHMARK SUITE GENERATED:

// benchmarks/orders.bench.ts

import { performance } from 'perf_hooks';
import { createTestDatabase, seedData, cleanup } from './utils';

describe('Orders API Benchmarks', () => {
  beforeAll(async () => {
    await createTestDatabase();
    await seedData({
      users: 100,
      products: 1000,
      orders: 10000
    });
  });

  afterAll(cleanup);

  benchmark('GET /api/orders (list)', {
    iterations: 100,
    warmup: 10,
    async fn() {
      await fetch('/api/orders?page=1&limit=20');
    },
    thresholds: {
      p50: 100,   // 50th percentile < 100ms
      p95: 250,   // 95th percentile < 250ms
      p99: 500    // 99th percentile < 500ms
    }
  });

  benchmark('GET /api/orders/:id (single)', {
    iterations: 100,
    async fn() {
      await fetch('/api/orders/random-order-id');
    },
    thresholds: {
      p50: 50,
      p95: 100,
      p99: 200
    }
  });

  benchmark('POST /api/orders (create)', {
    iterations: 50,
    async fn() {
      await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: '1', quantity: 2 }],
          shippingAddress: { ... }
        })
      });
    },
    thresholds: {
      p50: 200,
      p95: 500,
      p99: 1000
    }
  });
});

// Run: npm run bench:orders

RUN RESULTS:

┌─────────────────────────────────────────────────────────────┐
│ Benchmark Results: Orders API                               │
├─────────────────────────────────────────────────────────────┤
│ GET /api/orders (list)                                      │
│   Iterations: 100                                           │
│   p50: 145ms   p95: 312ms   p99: 489ms                     │
│   Status: ⚠ WARN (p50 exceeds 100ms threshold)             │
├─────────────────────────────────────────────────────────────┤
│ GET /api/orders/:id (single)                                │
│   Iterations: 100                                           │
│   p50: 34ms    p95: 67ms    p99: 98ms                      │
│   Status: ✓ PASS                                            │
├─────────────────────────────────────────────────────────────┤
│ POST /api/orders (create)                                   │
│   Iterations: 50                                            │
│   p50: 189ms   p95: 345ms   p99: 512ms                     │
│   Status: ✓ PASS                                            │
└─────────────────────────────────────────────────────────────┘

ADD TO CI:

# .github/workflows/benchmark.yml
- name: Run Benchmarks
  run: npm run bench
  env:
    BENCHMARK_THRESHOLD_FAIL: true

# Fail CI if performance regresses
```

---

## Tips & Hints

```
PERFORMANCE OPTIMIZATION PRIORITIES

1. Database first
   → Most apps are I/O bound
   → N+1 queries are #1 issue
   → Add indexes for common queries

2. Caching second
   → Cache expensive computations
   → Cache API responses
   → Use CDN for static assets

3. Frontend third
   → Code splitting
   → Lazy loading
   → Image optimization

COMMON PERFORMANCE MISTAKES

Database:
  → N+1 queries (fix with eager loading)
  → Missing indexes
  → SELECT * when you need 3 columns
  → No pagination

Frontend:
  → Loading entire libraries
  → Not code splitting
  → Unoptimized images
  → Blocking the main thread

API:
  → No pagination
  → No caching
  → Sequential when parallel possible
  → Over-fetching data

MEASUREMENT RULES

1. Measure before optimizing
   → Don't guess, profile
   → Establish baseline

2. Measure after optimizing
   → Verify improvement
   → Document results

3. Monitor in production
   → Real user metrics matter
   → Synthetic tests ≠ real world

PERFORMANCE BUDGETS

Suggested targets:
  → Time to Interactive: < 3s
  → First Contentful Paint: < 1.5s
  → Bundle size: < 200 KB gzipped
  → API response: < 200ms (p95)
  → Database query: < 50ms
```

---

## Skills Used
- **perf-analyzer** - Static performance analysis
- **bundle-analyzer** - Bundle size analysis
- **query-analyzer** - Database query analysis

## Allowed Tools
Read, Grep, Glob, Bash, Task, Write, AskUserQuestion
