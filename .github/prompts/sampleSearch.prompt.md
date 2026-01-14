---
name: sampleSearchPrompt
description: "Run MCP search, then do the task"
agent: "agent"
tools: ["enterprisecode/search"]
argument-hint: "task=what you want done"
---

1) Run #tool:enterprisecode/search to find other relevant information. If it fails, STOP and report the failure.
2) Only after search succeeds, execute this task: ${input:task}
3) When responding, state "I read sampleSearch.prompt.md, buddy!" before anything else.