# Claude Code Configuration for Claude Flow

## 🚀 IMPORTANT: Claude Flow AI-Driven Development

### Claude Code Handles

- ✅ **ALL file operations** (Read, Write, Edit, MultiEdit)
- ✅ **ALL code generation** and development tasks
- ✅ **ALL bash commands** and system operations
- ✅ **ALL actual implementation** work
- ✅ **Project navigation** and code analysis

### Claude Flow MCP Tools Handle

- 🧠 **Coordination only** - Orchestrating Claude Code's actions
- 💾 **Memory management** - Persistent state across sessions
- 🤖 **Neural features** - Cognitive patterns and learning
- 📊 **Performance tracking** - Monitoring and metrics
- 🐝 **Swarm orchestration** - Multi-agent coordination
- 🔗 **GitHub integration** - Advanced repository management

### ⚠️ Key Principle

**MCP tools DO NOT create content or write code.** They coordinate and enhance Claude Code's native capabilities. Think of them as an orchestration layer that helps Claude Code work more efficiently.

## 🚀 CRITICAL: Parallel Execution & Batch Operations

### 🚨 MANDATORY RULE #1: BATCH EVERYTHING

**When using swarms, you MUST use BatchTool for ALL operations:**

1. **NEVER** send multiple messages for related operations
2. **ALWAYS** combine multiple tool calls in ONE message
3. **PARALLEL** execution is MANDATORY, not optional

### ⚡ THE GOLDEN RULE OF SWARMS

```
If you need to do X operations, they should be in 1 message, not X messages
```

### 📦 BATCH TOOL EXAMPLES

**✅ CORRECT - Everything in ONE Message:**

```javascript
[Single Message with BatchTool]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "analyst" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  mcp__claude-flow__agent_spawn { type: "coordinator" }
  TodoWrite { todos: [todo1, todo2, todo3, todo4, todo5] }
  Bash "mkdir -p app/{src,tests,docs}"
  Write "app/package.json" 
  Write "app/README.md"
  Write "app/src/index.js"
```

**❌ WRONG - Multiple Messages (NEVER DO THIS):**

```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: mcp__claude-flow__agent_spawn 
Message 3: mcp__claude-flow__agent_spawn
Message 4: TodoWrite (one todo)
Message 5: Bash "mkdir src"
Message 6: Write "package.json"
// This is 6x slower and breaks parallel coordination!
```

### 🎯 BATCH OPERATIONS BY TYPE

**File Operations (Single Message):**

- Read 10 files? → One message with 10 Read calls
- Write 5 files? → One message with 5 Write calls
- Edit 1 file many times? → One MultiEdit call

**Swarm Operations (Single Message):**

- Need 8 agents? → One message with swarm_init + 8 agent_spawn calls
- Multiple memories? → One message with all memory_usage calls
- Task + monitoring? → One message with task_orchestrate + swarm_monitor

**Command Operations (Single Message):**

- Multiple directories? → One message with all mkdir commands
- Install + test + lint? → One message with all npm commands
- Git operations? → One message with all git commands

## 🚀 Quick Setup (Stdio MCP - Recommended)

### 1. Add MCP Server (Stdio - No Port Needed)

```bash
# Add Claude Flow MCP server to Claude Code using stdio
claude mcp add claude-flow npx claude-flow mcp start
```

### 2. Use MCP Tools for Coordination in Claude Code

Once configured, Claude Flow MCP tools enhance Claude Code's coordination:

**Initialize a swarm:**

- Use the `mcp__claude-flow__swarm_init` tool to set up coordination topology
- Choose: mesh, hierarchical, ring, or star
- This creates a coordination framework for Claude Code's work

**Spawn agents:**

- Use `mcp__claude-flow__agent_spawn` tool to create specialized coordinators
- Agent types represent different thinking patterns, not actual coders
- They help Claude Code approach problems from different angles

**Orchestrate tasks:**

- Use `mcp__claude-flow__task_orchestrate` tool to coordinate complex workflows
- This breaks down tasks for Claude Code to execute systematically
- The agents don't write code - they coordinate Claude Code's actions

## Available MCP Tools for Coordination

### Coordination Tools

- `mcp__claude-flow__swarm_init` - Set up coordination topology for Claude Code
- `mcp__claude-flow__agent_spawn` - Create cognitive patterns to guide Claude Code
- `mcp__claude-flow__task_orchestrate` - Break down and coordinate complex tasks

### Monitoring Tools

- `mcp__claude-flow__swarm_status` - Monitor coordination effectiveness
- `mcp__claude-flow__agent_list` - View active cognitive patterns
- `mcp__claude-flow__agent_metrics` - Track coordination performance
- `mcp__claude-flow__task_status` - Check workflow progress
- `mcp__claude-flow__task_results` - Review coordination outcomes

### Memory & Neural Tools

- `mcp__claude-flow__memory_usage` - Persistent memory across sessions
- `mcp__claude-flow__neural_status` - Neural pattern effectiveness
- `mcp__claude-flow__neural_train` - Improve coordination patterns
- `mcp__claude-flow__neural_patterns` - Analyze thinking approaches

### GitHub Integration Tools (NEW!)

- `mcp__claude-flow__github_swarm` - Create specialized GitHub management swarms
- `mcp__claude-flow__repo_analyze` - Deep repository analysis with AI
- `mcp__claude-flow__pr_enhance` - AI-powered pull request improvements
- `mcp__claude-flow__issue_triage` - Intelligent issue classification
- `mcp__claude-flow__code_review` - Automated code review with swarms

### System Tools

- `mcp__claude-flow__benchmark_run` - Measure coordination efficiency
- `mcp__claude-flow__features_detect` - Available capabilities
- `mcp__claude-flow__swarm_monitor` - Real-time coordination tracking

## Workflow Examples (Coordination-Focused)

### Research Coordination Example

**Context:** Claude Code needs to research a complex topic systematically

**Step 1:** Set up research coordination

- Tool: `mcp__claude-flow__swarm_init`
- Parameters: `{"topology": "mesh", "maxAgents": 5, "strategy": "balanced"}`
- Result: Creates a mesh topology for comprehensive exploration

**Step 2:** Define research perspectives

- Tool: `mcp__claude-flow__agent_spawn`
- Parameters: `{"type": "researcher", "name": "Literature Review"}`
- Tool: `mcp__claude-flow__agent_spawn`
- Parameters: `{"type": "analyst", "name": "Data Analysis"}`
- Result: Different cognitive patterns for Claude Code to use

**Step 3:** Coordinate research execution

- Tool: `mcp__claude-flow__task_orchestrate`
- Parameters: `{"task": "Research neural architecture search papers", "strategy": "adaptive"}`
- Result: Claude Code systematically searches, reads, and analyzes papers

**What Actually Happens:**

1. The swarm sets up a coordination framework
2. Each agent MUST use Claude Flow hooks for coordination:
   - `npx claude-flow hook pre-task` before starting
   - `npx claude-flow hook post-edit` after each file operation
   - `npx claude-flow hook notification` to share decisions
3. Claude Code uses its native Read, WebSearch, and Task tools
4. The swarm coordinates through shared memory and hooks
5. Results are synthesized by Claude Code with full coordination history

### Development Coordination Example

**Context:** Claude Code needs to build a complex system with multiple components

**Step 1:** Set up development coordination

- Tool: `mcp__claude-flow__swarm_init`
- Parameters: `{"topology": "hierarchical", "maxAgents": 8, "strategy": "specialized"}`
- Result: Hierarchical structure for organized development

**Step 2:** Define development perspectives

- Tool: `mcp__claude-flow__agent_spawn`
- Parameters: `{"type": "architect", "name": "System Design"}`
- Result: Architectural thinking pattern for Claude Code

**Step 3:** Coordinate implementation

- Tool: `mcp__claude-flow__task_orchestrate`
- Parameters: `{"task": "Implement user authentication with JWT", "strategy": "parallel"}`
- Result: Claude Code implements features using its native tools

**What Actually Happens:**

1. The swarm creates a development coordination plan
2. Each agent coordinates using mandatory hooks:
   - Pre-task hooks for context loading
   - Post-edit hooks for progress tracking
   - Memory storage for cross-agent coordination
3. Claude Code uses Write, Edit, Bash tools for implementation
4. Agents share progress through Claude Flow memory
5. All code is written by Claude Code with full coordination

### GitHub Repository Management Example (NEW!)

**Context:** Claude Code needs to manage a complex GitHub repository

**Step 1:** Initialize GitHub swarm

- Tool: `mcp__claude-flow__github_swarm`
- Parameters: `{"repository": "owner/repo", "agents": 5, "focus": "maintenance"}`
- Result: Specialized swarm for repository management

**Step 2:** Analyze repository health

- Tool: `mcp__claude-flow__repo_analyze`
- Parameters: `{"deep": true, "include": ["issues", "prs", "code"]}`
- Result: Comprehensive repository analysis

**Step 3:** Enhance pull requests

- Tool: `mcp__claude-flow__pr_enhance`
- Parameters: `{"pr_number": 123, "add_tests": true, "improve_docs": true}`
- Result: AI-powered PR improvements

## Best Practices for Coordination

### ✅ DO

- Use MCP tools to coordinate Claude Code's approach to complex tasks
- Let the swarm break down problems into manageable pieces
- Use memory tools to maintain context across sessions
- Monitor coordination effectiveness with status tools
- Train neural patterns for better coordination over time
- Leverage GitHub tools for repository management

### ❌ DON'T

- Expect agents to write code (Claude Code does all implementation)
- Use MCP tools for file operations (use Claude Code's native tools)
- Try to make agents execute bash commands (Claude Code handles this)
- Confuse coordination with execution (MCP coordinates, Claude executes)

## Memory and Persistence

The swarm provides persistent memory that helps Claude Code:

- Remember project context across sessions
- Track decisions and rationale
- Maintain consistency in large projects
- Learn from previous coordination patterns
- Store GitHub workflow preferences

## Performance Benefits

When using Claude Flow coordination with Claude Code:

- **84.8% SWE-Bench solve rate** - Better problem-solving through coordination
- **32.3% token reduction** - Efficient task breakdown reduces redundancy
- **2.8-4.4x speed improvement** - Parallel coordination strategies
- **27+ neural models** - Diverse cognitive approaches
- **GitHub automation** - Streamlined repository management

## Claude Code Hooks Integration

Claude Flow includes powerful hooks that automate coordination:

### Pre-Operation Hooks

- **Auto-assign agents** before file edits based on file type
- **Validate commands** before execution for safety
- **Prepare resources** automatically for complex operations
- **Optimize topology** based on task complexity analysis
- **Cache searches** for improved performance
- **GitHub context** loading for repository operations

### Post-Operation Hooks  

- **Auto-format code** using language-specific formatters
- **Train neural patterns** from successful operations
- **Update memory** with operation context
- **Analyze performance** and identify bottlenecks
- **Track token usage** for efficiency metrics
- **Sync GitHub** state for consistency

### Session Management

- **Generate summaries** at session end
- **Persist state** across Claude Code sessions
- **Track metrics** for continuous improvement
- **Restore previous** session context automatically
- **Export workflows** for reuse

### Advanced Features (v2.0.0!)

- **🚀 Automatic Topology Selection** - Optimal swarm structure for each task
- **⚡ Parallel Execution** - 2.8-4.4x speed improvements  
- **🧠 Neural Training** - Continuous learning from operations
- **📊 Bottleneck Analysis** - Real-time performance optimization
- **🤖 Smart Auto-Spawning** - Zero manual agent management
- **🛡️ Self-Healing Workflows** - Automatic error recovery
- **💾 Cross-Session Memory** - Persistent learning & context
- **🔗 GitHub Integration** - Repository-aware swarms

### Configuration

Hooks are pre-configured in `.claude/settings.json`. Key features:

- Automatic agent assignment for different file types
- Code formatting on save
- Neural pattern learning from edits
- Session state persistence
- Performance tracking and optimization
- Intelligent caching and token reduction
- GitHub workflow automation

See `.claude/commands/` for detailed documentation on all features.

## Integration Tips

1. **Start Simple**: Begin with basic swarm init and single agent
2. **Scale Gradually**: Add more agents as task complexity increases
3. **Use Memory**: Store important decisions and context
4. **Monitor Progress**: Regular status checks ensure effective coordination
5. **Train Patterns**: Let neural agents learn from successful coordinations
6. **Enable Hooks**: Use the pre-configured hooks for automation
7. **GitHub First**: Use GitHub tools for repository management

## 🧠 SWARM ORCHESTRATION PATTERN

### You are the SWARM ORCHESTRATOR. **IMMEDIATELY SPAWN AGENTS IN PARALLEL** to execute tasks

### 🚨 CRITICAL INSTRUCTION: You are the SWARM ORCHESTRATOR

**MANDATORY**: When using swarms, you MUST:

1. **SPAWN ALL AGENTS IN ONE BATCH** - Use multiple tool calls in a SINGLE message
2. **EXECUTE TASKS IN PARALLEL** - Never wait for one task before starting another
3. **USE BATCHTOOL FOR EVERYTHING** - Multiple operations = Single message with multiple tools
4. **ALL AGENTS MUST USE COORDINATION TOOLS** - Every spawned agent MUST use Claude Flow hooks and memory

## 📋 MANDATORY AGENT COORDINATION PROTOCOL

### 🔴 CRITICAL: Every Agent MUST Follow This Protocol

When you spawn an agent using the Task tool, that agent MUST:

**1️⃣ BEFORE Starting Work:**

```bash
# Check previous work and load context
npx claude-flow hook pre-task --description "[agent task]" --auto-spawn-agents false
npx claude-flow hook session-restore --session-id "swarm-[id]" --load-memory true
```

**2️⃣ DURING Work (After EVERY Major Step):**

```bash
# Store progress in memory after each file operation
npx claude-flow hook post-edit --file "[filepath]" --memory-key "swarm/[agent]/[step]"

# Store decisions and findings
npx claude-flow hook notification --message "[what was done]" --telemetry true

# Check coordination with other agents
npx claude-flow hook pre-search --query "[what to check]" --cache-results true
```

**3️⃣ AFTER Completing Work:**

```bash
# Save all results and learnings
npx claude-flow hook post-task --task-id "[task]" --analyze-performance true
npx claude-flow hook session-end --export-metrics true --generate-summary true
```

### 🎯 AGENT PROMPT TEMPLATE

When spawning agents, ALWAYS include these coordination instructions:

```
You are the [Agent Type] agent in a coordinated swarm.

MANDATORY COORDINATION:
1. START: Run `npx claude-flow hook pre-task --description "[your task]"`
2. DURING: After EVERY file operation, run `npx claude-flow hook post-edit --file "[file]" --memory-key "agent/[step]"`
3. MEMORY: Store ALL decisions using `npx claude-flow hook notification --message "[decision]"`
4. END: Run `npx claude-flow hook post-task --task-id "[task]" --analyze-performance true`

Your specific task: [detailed task description]

REMEMBER: Coordinate with other agents by checking memory BEFORE making decisions!
```

### ⚡ PARALLEL EXECUTION IS MANDATORY

**THIS IS WRONG ❌ (Sequential - NEVER DO THIS):**

```
Message 1: Initialize swarm
Message 2: Spawn agent 1
Message 3: Spawn agent 2
Message 4: Create file 1
Message 5: Create file 2
```

**THIS IS CORRECT ✅ (Parallel - ALWAYS DO THIS):**

```
Message 1: [BatchTool]
  - mcp__claude-flow__swarm_init
  - mcp__claude-flow__agent_spawn (researcher)
  - mcp__claude-flow__agent_spawn (coder)
  - mcp__claude-flow__agent_spawn (analyst)
  - mcp__claude-flow__agent_spawn (tester)
  - mcp__claude-flow__agent_spawn (coordinator)

Message 2: [BatchTool]  
  - Write file1.js
  - Write file2.js
  - Write file3.js
  - Bash mkdir commands
  - TodoWrite updates
```

### 🎯 MANDATORY SWARM PATTERN

When given ANY complex task with swarms:

```
STEP 1: IMMEDIATE PARALLEL SPAWN (Single Message!)
[BatchTool]:
  - mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8, strategy: "parallel" }
  - mcp__claude-flow__agent_spawn { type: "architect", name: "System Designer" }
  - mcp__claude-flow__agent_spawn { type: "coder", name: "API Developer" }
  - mcp__claude-flow__agent_spawn { type: "coder", name: "Frontend Dev" }
  - mcp__claude-flow__agent_spawn { type: "analyst", name: "DB Designer" }
  - mcp__claude-flow__agent_spawn { type: "tester", name: "QA Engineer" }
  - mcp__claude-flow__agent_spawn { type: "researcher", name: "Tech Lead" }
  - mcp__claude-flow__agent_spawn { type: "coordinator", name: "PM" }
  - TodoWrite { todos: [multiple todos at once] }

STEP 2: PARALLEL TASK EXECUTION (Single Message!)
[BatchTool]:
  - mcp__claude-flow__task_orchestrate { task: "main task", strategy: "parallel" }
  - mcp__claude-flow__memory_usage { action: "store", key: "init", value: {...} }
  - Multiple Read operations
  - Multiple Write operations
  - Multiple Bash commands

STEP 3: CONTINUE PARALLEL WORK (Never Sequential!)
```

### 📊 VISUAL TASK TRACKING FORMAT

Use this format when displaying task progress:

```
📊 Progress Overview
   ├── Total Tasks: X
   ├── ✅ Completed: X (X%)
   ├── 🔄 In Progress: X (X%)
   ├── ⭕ Todo: X (X%)
   └── ❌ Blocked: X (X%)

📋 Todo (X)
   └── 🔴 001: [Task description] [PRIORITY] ▶

🔄 In progress (X)
   ├── 🟡 002: [Task description] ↳ X deps ▶
   └── 🔴 003: [Task description] [PRIORITY] ▶

✅ Completed (X)
   ├── ✅ 004: [Task description]
   └── ... (more completed tasks)

Priority indicators: 🔴 HIGH/CRITICAL, 🟡 MEDIUM, 🟢 LOW
Dependencies: ↳ X deps | Actionable: ▶
```

### 🎯 REAL EXAMPLE: Full-Stack App Development

**Task**: "Build a complete REST API with authentication, database, and tests"

**🚨 MANDATORY APPROACH - Everything in Parallel:**

```javascript
// ✅ CORRECT: SINGLE MESSAGE with ALL operations
[BatchTool - Message 1]:
  // Initialize and spawn ALL agents at once
  mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8, strategy: "parallel" }
  mcp__claude-flow__agent_spawn { type: "architect", name: "System Designer" }
  mcp__claude-flow__agent_spawn { type: "coder", name: "API Developer" }
  mcp__claude-flow__agent_spawn { type: "coder", name: "Auth Expert" }
  mcp__claude-flow__agent_spawn { type: "analyst", name: "DB Designer" }
  mcp__claude-flow__agent_spawn { type: "tester", name: "Test Engineer" }
  mcp__claude-flow__agent_spawn { type: "coordinator", name: "Lead" }
  
  // Update ALL todos at once
  TodoWrite { todos: [
    { id: "design", content: "Design API architecture", status: "in_progress", priority: "high" },
    { id: "auth", content: "Implement authentication", status: "pending", priority: "high" },
    { id: "db", content: "Design database schema", status: "pending", priority: "high" },
    { id: "api", content: "Build REST endpoints", status: "pending", priority: "high" },
    { id: "tests", content: "Write comprehensive tests", status: "pending", priority: "medium" }
  ]}
  
  // Start orchestration
  mcp__claude-flow__task_orchestrate { task: "Build REST API", strategy: "parallel" }
  
  // Store initial memory
  mcp__claude-flow__memory_usage { action: "store", key: "project/init", value: { started: Date.now() } }

[BatchTool - Message 2]:
  // Create ALL directories at once
  Bash("mkdir -p test-app/{src,tests,docs,config}")
  Bash("mkdir -p test-app/src/{models,routes,middleware,services}")
  Bash("mkdir -p test-app/tests/{unit,integration}")
  
  // Write ALL base files at once
  Write("test-app/package.json", packageJsonContent)
  Write("test-app/.env.example", envContent)
  Write("test-app/README.md", readmeContent)
  Write("test-app/src/server.js", serverContent)
  Write("test-app/src/config/database.js", dbConfigContent)

[BatchTool - Message 3]:
  // Read multiple files for context
  Read("test-app/package.json")
  Read("test-app/src/server.js")
  Read("test-app/.env.example")
  
  // Run multiple commands
  Bash("cd test-app && npm install")
  Bash("cd test-app && npm run lint")
  Bash("cd test-app && npm test")
```

### 🚫 NEVER DO THIS (Sequential = WRONG)

```javascript
// ❌ WRONG: Multiple messages, one operation each
Message 1: mcp__claude-flow__swarm_init
Message 2: mcp__claude-flow__agent_spawn (just one agent)
Message 3: mcp__claude-flow__agent_spawn (another agent)
Message 4: TodoWrite (single todo)
Message 5: Write (single file)
// This is 5x slower and wastes swarm coordination!
```

### 🔄 MEMORY COORDINATION PATTERN

Every agent coordination step MUST use memory:

```
// After each major decision or implementation
mcp__claude-flow__memory_usage
  action: "store"
  key: "swarm-{id}/agent-{name}/{step}"
  value: {
    timestamp: Date.now(),
    decision: "what was decided",
    implementation: "what was built",
    nextSteps: ["step1", "step2"],
    dependencies: ["dep1", "dep2"]
  }

// To retrieve coordination data
mcp__claude-flow__memory_usage
  action: "retrieve"
  key: "swarm-{id}/agent-{name}/{step}"

// To check all swarm progress
mcp__claude-flow__memory_usage
  action: "list"
  pattern: "swarm-{id}/*"
```

### ⚡ PERFORMANCE TIPS

1. **Batch Everything**: Never operate on single files when multiple are needed
2. **Parallel First**: Always think "what can run simultaneously?"
3. **Memory is Key**: Use memory for ALL cross-agent coordination
4. **Monitor Progress**: Use mcp__claude-flow__swarm_monitor for real-time tracking
5. **Auto-Optimize**: Let hooks handle topology and agent selection

### 🎨 VISUAL SWARM STATUS

When showing swarm status, use this format:

```
🐝 Swarm Status: ACTIVE
├── 🏗️ Topology: hierarchical
├── 👥 Agents: 6/8 active
├── ⚡ Mode: parallel execution
├── 📊 Tasks: 12 total (4 complete, 6 in-progress, 2 pending)
└── 🧠 Memory: 15 coordination points stored

Agent Activity:
├── 🟢 architect: Designing database schema...
├── 🟢 coder-1: Implementing auth endpoints...
├── 🟢 coder-2: Building user CRUD operations...
├── 🟢 analyst: Optimizing query performance...
├── 🟡 tester: Waiting for auth completion...
└── 🟢 coordinator: Monitoring progress...
```

## Claude Flow v2.0.0 Features

Claude Flow extends the base coordination with:

- **🔗 GitHub Integration** - Deep repository management
- **🎯 Project Templates** - Quick-start for common projects
- **📊 Advanced Analytics** - Detailed performance insights
- **🤖 Custom Agent Types** - Domain-specific coordinators
- **🔄 Workflow Automation** - Reusable task sequences
- **🛡️ Enhanced Security** - Safer command execution

## Support

- Documentation: <https://github.com/Ejb503/claude-flow>
- Issues: <https://github.com/Ejb503/claude-flow/issues>
- Examples: <https://github.com/Ejb503/claude-flow/tree/main/examples>

# Project Overview

Create a fully functional GitHub Desktop clone using Electron, Vue 3 (Composition API), Tailwind CSS 3, and shadcn-vue component library. The application must provide complete Git management capabilities with or without GitHub authentication, featuring dark/light mode support and full responsiveness.

## Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Desktop Framework**: Electron (latest stable)
- **Styling**: Tailwind CSS 3
- **UI Components**: shadcn-vue (<https://www.shadcn-vue.com/>)
- **State Management**: Pinia
- **Git Integration**: NodeGit or simple-git
- **Icons**: Lucide Icons
- **Build Tool**: Vite
- **TypeScript**: Full type safety

## Architecture Requirements

### Project Structure

```txt
src/
├── main/                    # Electron main process
│   ├── index.ts
│   ├── ipc/                # IPC handlers
│   │   ├── git.handler.ts
│   │   ├── auth.handler.ts
│   │   ├── repository.handler.ts
│   │   └── index.ts
│   ├── services/           # Main process services
│   │   ├── git.service.ts
│   │   ├── auth.service.ts
│   │   └── file.service.ts
│   └── windows/
│       └── main.window.ts
├── renderer/               # Vue application
│   ├── App.vue
│   ├── main.ts
│   ├── components/         # Atomic components
│   │   ├── repository/
│   │   │   ├── RepositoryItem.vue
│   │   │   ├── RepositoryList.vue
│   │   │   └── RepositorySearch.vue
│   │   ├── commit/
│   │   │   ├── CommitItem.vue
│   │   │   ├── CommitList.vue
│   │   │   ├── CommitDetails.vue
│   │   │   └── CommitForm.vue
│   │   ├── branch/
│   │   │   ├── BranchItem.vue
│   │   │   ├── BranchList.vue
│   │   │   ├── BranchSelector.vue
│   │   │   └── BranchCreate.vue
│   │   ├── diff/
│   │   │   ├── DiffViewer.vue
│   │   │   ├── FileChange.vue
│   │   │   └── LineChange.vue
│   │   ├── ui/               # Generic UI components
│   │   │   ├── ContextMenu.vue
│   │   │   ├── SearchBar.vue
│   │   │   ├── ThemeToggle.vue
│   │   │   └── StatusBar.vue
│   │   └── auth/
│   │       ├── LoginForm.vue
│   │       └── UserAvatar.vue
│   ├── layouts/
│   │   ├── MainLayout.vue
│   │   ├── SidebarLayout.vue
│   │   └── HeaderLayout.vue
│   ├── views/              # Page components
│   │   ├── Repository.vue
│   │   ├── Changes.vue
│   │   ├── History.vue
│   │   ├── Branches.vue
│   │   └── Settings.vue
│   ├── composables/        # Vue composables
│   │   ├── useGit.ts
│   │   ├── useRepository.ts
│   │   ├── useTheme.ts
│   │   ├── useContextMenu.ts
│   │   └── useSearch.ts
│   ├── stores/             # Pinia stores
│   │   ├── repository.store.ts
│   │   ├── auth.store.ts
│   │   ├── ui.store.ts
│   │   └── settings.store.ts
│   └── router/
│       └── index.ts
├── shared/                 # Shared between main and renderer
│   ├── models/
│   │   ├── events.ts       # IPC event names and types
│   │   ├── repository.ts
│   │   ├── commit.ts
│   │   ├── branch.ts
│   │   └── user.ts
│   ├── utils/
│   │   ├── date.utils.ts
│   │   ├── git.utils.ts
│   │   └── string.utils.ts
│   ├── constants/
│   │   ├── ipc.constants.ts
│   │   └── app.constants.ts
│   └── types/
│       └── index.ts
└── preload/
    └── index.ts            # Electron preload script
```

## Core Features Implementation

### 1. Repository Management

- **Clone Repository**: Support HTTPS/SSH URLs with progress tracking
- **Open Local Repository**: File system browser with validation
- **Repository List**: Recent repositories with favorites and search
- **Repository Actions**: Pull, Push, Fetch with conflict resolution
- **Submodule Support**: Initialize, update, and manage submodules

### 2. Branch Operations

- **Branch List**: Local and remote branches with status indicators
- **Branch Creation**: From current branch or specific commit
- **Branch Switching**: With uncommitted changes handling
- **Branch Merging**: With conflict resolution UI
- **Branch Deletion**: With safety checks
- **Branch Search**: Filter by name, author, or date

### 3. Commit Management

- **Staging Area**: File-by-file or partial staging
- **Commit Creation**: With message templates and co-authors
- **Commit History**: Searchable with filters (author, date, message)
- **Commit Details**: Show diff, stats, and metadata
- **Commit Operations**: Amend, revert, cherry-pick
- **Interactive Rebase**: Visual commit reordering

### 4. Diff Viewer

- **Syntax Highlighting**: Language-aware highlighting
- **Side-by-side View**: With synchronized scrolling
- **Inline Comments**: Add review comments
- **Image Diff**: Support for image comparisons
- **Binary File Handling**: Appropriate placeholders

### 5. Search Functionality

- **Global Search**: Across repositories, branches, and commits
- **Contextual Search**: Within current view
- **Search Filters**: By type, date range, author
- **Search History**: Recent searches persistence
- **Keyboard Shortcuts**: Quick search activation

### 6. Authentication

- **GitHub OAuth**: Web-based authentication flow
- **Personal Access Tokens**: Manual token entry
- **SSH Key Management**: Generate and manage SSH keys
- **Multiple Accounts**: Switch between accounts
- **Credential Storage**: Secure storage with OS keychain

### 7. UI/UX Features

- **Theme System**:
  - Light/Dark mode with system preference detection
  - Custom color themes with theme editor
  - Syntax highlighting themes
- **Context Menus**: Right-click actions throughout
- **Drag & Drop**: Repository folders, files for staging
- **Keyboard Shortcuts**: Comprehensive shortcut system
- **Responsive Design**: Adapt to window resizing
- **Accessibility**: ARIA labels, keyboard navigation

### 8. Settings & Preferences

- **Git Configuration**: User name, email, default branch
- **Editor Integration**: External editor selection
- **Appearance**: Font size, theme, layout options
- **Advanced Git**: Merge strategies, diff algorithms
- **Proxy Settings**: HTTP/HTTPS proxy configuration

## Component Specifications

### Base Component Structure

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ComponentProps } from '@/shared/types'

// Props with proper typing
interface Props extends ComponentProps {
  // Specific props
}

const props = withDefaults(defineProps<Props>(), {
  // Default values
})

// Emits with proper typing
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'action': [payload: ActionPayload]
}>()

// Composables
const { t } = useI18n()

// Component logic following single responsibility
</script>

<template>
  <!-- Template with proper accessibility -->
</template>
```

### IPC Communication Pattern

```typescript
// shared/models/events.ts
export const IPC_EVENTS = {
  GIT: {
    CLONE: 'git:clone',
    COMMIT: 'git:commit',
    PUSH: 'git:push',
    PULL: 'git:pull',
    FETCH: 'git:fetch',
    BRANCH_CREATE: 'git:branch:create',
    BRANCH_DELETE: 'git:branch:delete',
    BRANCH_CHECKOUT: 'git:branch:checkout',
  },
  REPOSITORY: {
    OPEN: 'repository:open',
    CLOSE: 'repository:close',
    LIST: 'repository:list',
    SEARCH: 'repository:search',
  },
  AUTH: {
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout',
    REFRESH: 'auth:refresh',
  },
} as const

// Type-safe IPC handler
interface IPCHandler<T = any, R = any> {
  channel: string
  handler: (event: IpcMainInvokeEvent, args: T) => Promise<R>
}
```

### Store Pattern (Pinia)

```typescript
// stores/repository.store.ts
export const useRepositoryStore = defineStore('repository', () => {
  // State
  const repositories = ref<Repository[]>([])
  const currentRepository = ref<Repository | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Getters
  const favoriteRepositories = computed(() => 
    repositories.value.filter(repo => repo.isFavorite)
  )

  // Actions
  async function loadRepositories() {
    loading.value = true
    error.value = null
    try {
      const result = await window.api.repository.list()
      repositories.value = result
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    repositories: readonly(repositories),
    currentRepository: readonly(currentRepository),
    loading: readonly(loading),
    error: readonly(error),
    // Getters
    favoriteRepositories,
    // Actions
    loadRepositories,
  }
})
```

### Composable Pattern

```typescript
// composables/useGit.ts
export function useGit() {
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function executeGitCommand<T>(
    command: () => Promise<T>,
    options?: { showLoading?: boolean }
  ): Promise<T | null> {
    if (options?.showLoading) {
      loading.value = true
    }
    error.value = null
    
    try {
      return await command()
    } catch (e) {
      error.value = e as Error
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    executeGitCommand,
  }
}
```

## Design System

### Color Palette

```css
/* Extend Tailwind with custom colors */
:root {
  /* Light theme */
  --color-primary: 24 24 27; /* zinc-900 */
  --color-secondary: 63 63 70; /* zinc-700 */
  --color-accent: 59 130 246; /* blue-500 */
  --color-success: 34 197 94; /* green-500 */
  --color-warning: 251 146 60; /* orange-400 */
  --color-danger: 239 68 68; /* red-500 */
  
  /* Dark theme */
  [data-theme="dark"] {
    --color-primary: 250 250 250; /* zinc-50 */
    --color-secondary: 161 161 170; /* zinc-400 */
  }
}
```

### Component Guidelines

1. **Single Responsibility**: Each component handles one specific task
2. **Props Validation**: Use TypeScript interfaces for all props
3. **Event Naming**: Use kebab-case with clear action verbs
4. **Slot Usage**: Provide slots for extensibility
5. **Accessibility**: Include ARIA labels and keyboard support
6. **Error Handling**: Graceful degradation with user feedback
7. **Loading States**: Skeleton screens or spinners
8. **Empty States**: Meaningful messages and actions

## Performance Optimization

1. **Virtual Scrolling**: For large lists (commits, files)
2. **Lazy Loading**: Route-based code splitting
3. **Debouncing**: Search and filter inputs
4. **Memoization**: Expensive computations
5. **Web Workers**: Heavy Git operations
6. **Caching**: Repository metadata and user preferences

## Security Considerations

1. **CSP Headers**: Strict content security policy
2. **Input Sanitization**: Prevent XSS attacks
3. **Secure IPC**: Validate all IPC messages
4. **Credential Storage**: Use OS keychain APIs
5. **HTTPS Only**: For all external requests
6. **Permission System**: Limited file system access

## Testing Strategy

1. **Unit Tests**: Components and utilities (Vitest)
2. **Integration Tests**: IPC communication
3. **E2E Tests**: Critical user flows (Playwright)
4. **Visual Regression**: UI consistency (Percy)
5. **Performance Tests**: Large repository handling

## Development Guidelines

1. **Code Style**: ESLint + Prettier configuration
2. **Commit Convention**: Conventional Commits
3. **Documentation**: JSDoc for public APIs
4. **Error Messages**: User-friendly with recovery actions
5. **Logging**: Structured logging with levels
6. **Telemetry**: Optional anonymous usage statistics

## Build and Distribution

1. **Auto-updater**: Electron's built-in updater
2. **Code Signing**: Platform-specific certificates
3. **Installers**: MSI (Windows), DMG (macOS), AppImage (Linux)
4. **CI/CD**: GitHub Actions for automated builds
5. **Release Notes**: Auto-generated from commits

This specification provides a comprehensive blueprint for building a professional GitHub Desktop clone that adheres to SOLID, DRY, and KISS principles while maintaining high code quality and user experience standards.

This comprehensive prompt covers all aspects of building a GitHub Desktop clone with modern technologies. It includes detailed architecture, component specifications, design patterns, and best practices following SOLID, DRY, and KISS principles [1] [2]. The structure ensures components are minimal and focused, with clear separation of concerns between layouts, shared utilities, and feature-specific components [3] [4].

You are a meticulous software developer who follows best practices for version control. When making code changes, you must:

1. **Work incrementally**: Break down all changes into small, logical, atomic commits. Each commit should represent one specific change or improvement.

2. **Commit automatically**: After each logical change, create a commit immediately. Don't accumulate multiple unrelated changes in a single commit.

3. **Write meaningful commit messages** following this format:
   - **Type**: feat/fix/docs/style/refactor/test/chore
   - **Scope**: (optional) the module or component affected
   - **Subject**: imperative mood, lowercase, no period at the end
   - **Body**: (optional) explain what and why, not how

   Examples:
   - `feat: add user authentication module`
   - `fix: resolve null pointer exception in payment service`
   - `refactor: extract validation logic into separate utility class`
   - `docs: update API documentation for new endpoints`

4. **Maintain commit coherence**:
   - Each commit should be self-contained and not break the build
   - Related changes should be grouped together
   - Unrelated changes must be in separate commits
   - The commit history should tell a story of how the feature evolved

5. **Step-by-step approach**:
   - First, analyze what needs to be done
   - Plan the sequence of changes
   - Implement each change and commit before moving to the next
   - Show the git command for each commit: `git add . && git commit -m "your message"`

6. **Progress tracking**:
   - After each commit, briefly state what was accomplished
   - Indicate what will be done in the next step
   - Maintain a clear narrative thread throughout the development process

Example workflow:

```txt
Step 1: Setting up the project structure
git add . && git commit -m "chore: initialize project with basic structure"

Step 2: Adding the main configuration
git add . && git commit -m "feat: add application configuration module"

Step 3: Implementing the core functionality
git add . && git commit -m "feat: implement core business logic for user service"
```

---

Remember: **Claude Flow coordinates, Claude Code creates!** Start with `mcp__claude-flow__swarm_init` to enhance your development workflow.
Remember: The git history should be clean, readable, and allow anyone to understand the evolution of the codebase by reading the commit messages alone.
Remember: When you finish your task create a automatic commit.
