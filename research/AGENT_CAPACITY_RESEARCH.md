# Agent Capacity Research - Concurrent Execution Limits
*Research Date: 2025-10-18*
*Target: Determine optimal concurrent agent count for Delobotomize*

---

## EXECUTIVE SUMMARY

**Key Finding:** Delobotomize will use **API-based agents** (not local LLMs), so limits are determined by **API rate limits** rather than hardware RAM/CPU.

**Recommended Concurrent Agent Counts:**
- **Conservative (Build Tier):** 10-15 concurrent agents
- **Standard (Scale Tier):** 50-100 concurrent agents
- **Aggressive (Enterprise):** 100+ concurrent agents with queuing

---

## RESEARCH FINDINGS

### 1. Claude Code Subagent Limits (Framework Context)

**Hard Limit:** 10 concurrent subagents per Claude Code instance
- This is a software limitation, not hardware
- Can scale to 100+ tasks through intelligent queuing
- Batched execution: Waits for all 10 to complete before starting next 10

**Token Consumption:**
- Multi-agent sessions consume **3-4x more tokens** than single-threaded
- Each task starts with ~20,000 tokens of context loading
- With 10 agents running concurrently, token usage escalates rapidly

**Workarounds for More Parallelism:**
- Run multiple Claude Code instances (tmux, git worktrees, containers)
- Use cloud platforms (Gitpod, Tembo) for parallel sessions

**Source:** Multiple 2025 articles on Claude Code parallel execution

---

### 2. Anthropic API Rate Limits (Critical for Delobotomize)

Since Delobotomize will make direct API calls (not use Claude Code subagents), these are the actual limits:

#### **Tiered Rate Limits (2025)**

| Tier | Requests Per Minute (RPM) | Input Tokens Per Minute | Output Tokens Per Minute |
|------|--------------------------|------------------------|--------------------------|
| **Build Tier** | 50 RPM (Claude 3.5 Sonnet) | Varies by model | Varies by model |
| **Scale Tier** | 1,000+ RPM (Claude 3.5 Sonnet) | Higher limits | Higher limits |
| **API Tier 1** | 50 RPM (Claude 4.5 Sonnet) | Lower limits | Lower limits |

**Note:** New accounts start with low limits (Build Tier), which increase with API spending.

#### **Token Bucket Algorithm**
- Rate limits **continuously replenish** (not reset at fixed intervals)
- Allows bursts followed by slowdown periods
- Smooth distribution of API calls over time

#### **2025 Updates**
- Prompt cache read tokens **no longer count** against Input TPM for Claude 3.7 Sonnet
- Weekly rate limits introduced August 2025 (overall + Opus 4 specific)
- Five-hour limits still in effect

**Source:** Anthropic API documentation, TechCrunch, rate limit analysis articles

---

### 3. MacBook M3 Pro Max (36GB RAM) - Hardware Analysis

**User's Machine:** MacBook M3 Pro Max with 36GB RAM

#### **Local LLM Capabilities (For Reference Only)**
- Can run one large model (30-34B parameters) using ~30-34GB RAM
- Response time: 1-2 minutes per query for 32B models
- **NOT applicable to Delobotomize** (we use APIs, not local models)

#### **API-Based Agent Performance**
- **Hardware is NOT the bottleneck** for API calls
- Limits are:
  1. API rate limits (50-1000 RPM depending on tier)
  2. Network bandwidth
  3. Memory for storing results (~minimal)

**Key Insight:** Even a low-end MacBook M1 (8GB RAM) can handle 100+ concurrent API agents since the processing happens remotely.

**Source:** MacBook M3 performance tests, LLM benchmarks

---

### 4. Multi-Agent Orchestration Best Practices

Research on CrewAI, AutoGen, LangGraph frameworks revealed:

#### **Optimal Concurrency Strategies:**

1. **AutoGen:**
   - Asynchronous event loop
   - Low-overhead, high-throughput
   - Best for dynamic dialogues and frequent role switching

2. **LangGraph:**
   - Graph-based parallel execution
   - Sophisticated state transitions
   - Precise control over workflow

3. **CrewAI:**
   - Role-based orchestration
   - Built-in task management
   - Sequential and parallel task modes

#### **Common Pattern:**
- **Parallel execution within phases**
- **Sequential gates between phases**
- **Error handling and retry logic**

**Recommendation for Delobotomize:** Hybrid approach
- Use simple async/await for API calls (no heavy framework)
- Implement batching (e.g., 50 files at a time)
- Respect API rate limits with exponential backoff

**Source:** Framework comparison articles (Instinctools, Medium, Composio)

---

## RECOMMENDATIONS FOR DELOBOTOMIZE

### Agent Count Configuration (User-Selectable)

```json
{
  "concurrency": {
    "profiles": {
      "conservative": {
        "concurrent_agents": 10,
        "description": "Safe for Build Tier API accounts",
        "rpm_target": 40
      },
      "standard": {
        "concurrent_agents": 50,
        "description": "Optimized for Scale Tier accounts",
        "rpm_target": 800
      },
      "aggressive": {
        "concurrent_agents": 100,
        "description": "Enterprise/high-limit accounts only",
        "rpm_target": 1500
      }
    }
  }
}
```

### Auto-Detection Logic

1. **Detect API tier from environment:**
   - Test with a small burst (e.g., 10 rapid requests)
   - If successful → likely Scale Tier
   - If rate-limited → Build Tier

2. **Default to conservative:**
   - Start with 10 concurrent agents
   - Monitor for rate limit errors (429 status)
   - Auto-adjust down if hitting limits

3. **User override:**
   - Allow `--concurrency=50` flag
   - Config file setting

### Queuing Strategy

**For projects with many files (500+):**

```
Total files: 500
Concurrent agents: 50

Batch 1: Files 1-50   (parallel)
Batch 2: Files 51-100 (parallel after Batch 1 completes)
...
Batch 10: Files 451-500 (parallel)
```

### Rate Limit Handling

```javascript
// Pseudocode
async function auditFileWithRetry(file, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await claudeAPI.analyze(file);
    } catch (error) {
      if (error.status === 429) { // Rate limit
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await sleep(delay);
      } else {
        throw error; // Other errors propagate
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}
```

---

## HARDWARE IMPACT (Minimal for API-Based Agents)

### Low-End Machine (MacBook M1, 8GB RAM)
- **Can handle:** 50-100 concurrent API agents
- **Bottleneck:** API rate limits, NOT hardware
- **Memory usage:** ~100-200MB for agent orchestration code

### High-End Machine (MacBook M3 Pro Max, 36GB RAM)
- **Can handle:** Same as low-end (100+ agents)
- **Advantage:** Can run local validation scripts simultaneously
- **Advantage:** Faster diff generation, file I/O

### PC Equivalents
- **Low-end PC (8-core):** Same as MacBook M1
- **High-end PC (Ryzen gaming rig):** Same as MacBook M3

**Conclusion:** Hardware specs are largely irrelevant for API-based agents. API tier is the real constraint.

---

## COST CONSIDERATIONS

### Token Usage Estimates

**Audit Phase (per file):**
- Input: ~2,000 tokens (file content + audit prompt)
- Output: ~500 tokens (structured JSON report)
- **Total per file:** ~2,500 tokens

**For 100 files:**
- Total tokens: ~250,000 tokens
- Cost (Claude 3.5 Sonnet): ~$0.75 USD

**For 500 files:**
- Total tokens: ~1,250,000 tokens
- Cost: ~$3.75 USD

**Using lightweight model (Haiku) for syntax checks:**
- Cost reduction: ~5-10x cheaper
- Audit 500 files: ~$0.50 USD

### Optimization Strategies

1. **Two-tier model usage:**
   - Haiku for syntax/import checking (cheap)
   - Sonnet for intent analysis (expensive but necessary)

2. **Caching:**
   - Cache audit prompts (reused across files)
   - Prompt cache reads don't count toward ITPM (2025 update!)

3. **Batching:**
   - Combine multiple small files into one request
   - Reduces overhead of context loading

---

## FINAL RECOMMENDATIONS

### For Delobotomize v1.0:

1. **Default concurrency:** 10 agents (safe for all API tiers)
2. **Configurable:** Allow `--concurrency=N` flag
3. **Auto-detection:** Test API tier on first run, suggest optimal setting
4. **Rate limit handling:** Exponential backoff with retries
5. **Progress tracking:** Show "X/Y files audited" in real-time
6. **Cost estimation:** Show token usage before starting audit

### Hardware Requirements:

**Minimum:**
- Any machine capable of running Node.js
- 1GB free RAM (for orchestration code)
- Stable internet connection

**Recommended:**
- 4GB+ free RAM (for diff generation, report consolidation)
- SSD for fast file I/O

### API Tier Recommendations:

| Project Size | Files | Recommended Tier | Concurrent Agents | Estimated Time |
|-------------|-------|------------------|-------------------|----------------|
| Small | < 50 | Build Tier | 10 | ~5 minutes |
| Medium | 50-200 | Scale Tier | 50 | ~4 minutes |
| Large | 200-1000 | Scale Tier | 100 | ~10 minutes |
| Massive | 1000+ | Enterprise | 100+ with queue | ~1 hour |

---

## NEXT STEPS

1. ✅ Research completed
2. ⏳ Deploy 18 research agents (to study similar tools)
3. ⏳ Implement concurrency config in Delobotomize
4. ⏳ Test with user's API tier (likely Scale Tier)
5. ⏳ Add `--dry-run` mode to estimate costs before running

---

*Research conducted via web search on Claude Code subagents, Anthropic API rate limits, M3 Mac performance, and multi-agent orchestration frameworks.*
