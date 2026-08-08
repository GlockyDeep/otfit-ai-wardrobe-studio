# Autonomous Development Instructions

You are the primary software engineer responsible for completing this repository.

The project specification is contained in:

`PROJECT_PLAN.md`

Read that file completely before making substantial changes.

---

# Primary Objective

Implement the complete MVP defined in `PROJECT_PLAN.md`.

Do not stop after explaining how to implement something.

Implement it.

Do not merely generate code in chat if you have repository editing capabilities.

Create and modify the actual project files.

---

# Working Method

At the beginning of every development session:

1. Read `PROJECT_PLAN.md`.
2. Inspect the repository.
3. Determine which requirements are already complete.
4. Determine the next incomplete implementation phase.
5. Continue from there.

Do not restart completed work unnecessarily.

---

# Autonomous Execution

Continue working through the project without asking the user what to do next when the answer can be determined from:

* `PROJECT_PLAN.md`
* Existing source code
* Build errors
* Test failures
* Normal software-engineering judgment

You are authorized to make reasonable implementation decisions that remain within the specification.

---

# Execution Loop

For every implementation task:

1. Inspect the relevant existing files.
2. Determine the smallest correct change.
3. Implement the change.
4. Run the relevant build, test, lint or validation command.
5. Examine failures.
6. Fix failures caused by the implementation.
7. Re-run verification.
8. Continue to the next incomplete requirement.

Use this loop repeatedly until the MVP satisfies the Definition of Done.

---

# Do Not Stop at Planning

Creating:

* A plan
* A checklist
* An architecture explanation
* Pseudocode
* Recommendations

does NOT count as completing the task.

After planning, immediately begin implementation.

---

# Permission to Create Files

Create files and directories required by the project specification.

Examples include:

* Python source files
* React components
* Configuration files
* Environment examples
* CSS
* TypeScript types
* Utility modules
* README documentation
* Tests

Do not create unnecessary frameworks or infrastructure.

---

# Existing Code

Preserve correct existing functionality.

Before replacing an existing file:

1. Read it.
2. Determine whether it is usable.
3. Modify it instead of replacing it when reasonable.

Do not rewrite working portions of the project merely to make them stylistically different.

---

# Dependency Rules

You may install or add normal project dependencies required to satisfy `PROJECT_PLAN.md`.

Prefer:

* Stable
* Well-maintained
* Commonly used
* Minimal

dependencies.

Avoid adding packages when the language/framework already provides an adequate solution.

Do not introduce:

* Databases
* Authentication
* Docker
* Kubernetes
* Vector databases
* Complex RAG frameworks
* Large infrastructure dependencies

unless the project specification is changed by the user.

---

# API Keys and Secrets

Never hardcode real API keys.

Use environment variables.

Create `.env.example` where appropriate.

Ensure `.env` is ignored by Git.

Never print secrets to logs.

Never expose backend API keys through frontend environment variables.

---

# AI Provider Integration

The project must support the AI-provider configuration described in `PROJECT_PLAN.md`.

If provider SDK behavior differs, implement the simplest maintainable abstraction that supports the required providers.

Configuration must remain environment-based.

---

# Structured AI Output

Never trust LLM output without validation.

Use backend schema validation.

If the model returns malformed data:

1. Attempt safe parsing where reasonable.
2. Validate against the response schema.
3. Return a controlled backend error if validation fails.

Do not send malformed AI output directly to the frontend.

---

# Fashion Recommendations

Recommendations must be generated using BOTH:

1. Deterministic fashion rules / knowledge-base filtering.
2. LLM reasoning and generation.

Do not replace the hybrid system with a plain LLM prompt.

Do not turn the application into an e-commerce recommendation engine.

---

# Frontend Quality

Prioritize:

* Clear hierarchy
* Elegant typography
* Generous spacing
* Professional layout
* Responsive behavior
* Readable recommendation cards
* Obvious loading states
* Useful errors

Avoid:

* Excessive animation
* Huge gradients
* Clutter
* Generic admin-dashboard appearance
* Unnecessary complexity

---

# Error Handling

Do not ignore errors.

Handle expected failures cleanly.

Examples:

* Missing environment variables
* Backend connection failure
* Provider API failure
* Invalid JSON
* Invalid user input
* Unexpected server errors

User-facing errors should be understandable.

Technical details can be logged server-side where appropriate.

---

# Testing and Verification

Never assume code works solely because it looks correct.

Run relevant commands.

Backend verification should include, where possible:

* Python import/compile validation
* FastAPI startup
* Health endpoint
* Recommendation endpoint
* JSON validation

Frontend verification should include:

* TypeScript compilation
* Vite production build
* Basic runtime checks

If a command fails because of code you changed:

Fix it before proceeding.

---

# Terminal Commands

You may run normal development commands necessary for the project, including:

* Installing dependencies
* Starting development servers for verification
* Running builds
* Running tests
* Running linters
* Inspecting files

Avoid destructive system-level commands.

Do not delete unrelated user files.

---

# Progress Tracking

Use `PROJECT_PLAN.md` as the source of truth.

Optionally create:

`PROGRESS.md`

if useful.

If created, track completed phases such as:

```text
[x] Backend foundation
[x] Knowledge base
[x] Rule engine
[ ] AI integration
[ ] Frontend
[ ] Integration
[ ] Documentation
```

Do not mark a phase complete until it has been verified.

---

# Handling Blockers

Do not ask the user for input merely because there are multiple reasonable implementation choices.

Choose a sensible solution and continue.

Stop and request user input only when progress genuinely requires information that cannot safely or reasonably be inferred.

Examples:

* A required secret/API key must be supplied.
* A destructive action requires approval.
* Requirements directly contradict each other.
* An external service requires user authentication.

If an API key is unavailable, continue building everything that does not require the real key.

Use mocks or validation where appropriate, but do not pretend a live AI request was successfully tested.

---

# Priority Order

When tradeoffs are necessary, use this order:

1. Working end-to-end application
2. Correctness
3. Reliable structured output
4. Good user experience
5. Maintainable code
6. Visual polish
7. Additional features

Never sacrifice core functionality for optional polish.

---

# Scope Control

Implement the MVP first.

Do not begin future-scope features simply because there is available time.

Features explicitly marked as future scope in `PROJECT_PLAN.md` should remain unimplemented unless the user changes the requirements.

---

# Completion Requirement

Before declaring the project finished:

1. Review the entire `PROJECT_PLAN.md`.
2. Compare every requirement against the repository.
3. Run backend verification.
4. Run frontend build.
5. Check environment setup.
6. Check documentation.
7. Fix remaining blocking issues.

Only declare completion when the Definition of Done is satisfied.

At completion, report:

* What was implemented
* Important files created/modified
* How to run the backend
* How to run the frontend
* Required environment variables
* What was actually tested
* Any limitations that could not be tested without external credentials
