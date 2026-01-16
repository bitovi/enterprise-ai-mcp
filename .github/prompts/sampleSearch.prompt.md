---
name: sampleSearchPrompt
description: "Run MCP search, then do the task"
agent: "agent"
tools: ["enterprisecode/search"]
argument-hint: "task=what you want done"
---

1) Before starting any task, you MUST use the enterpriseCode/search tool with a natural language query and the project's technology stack to find relevant code examples and documentation. This is a hard requirement, and cannot be skipped. If it fails, STOP and report the failure.
2) Only after search succeeds, execute this task: ${input:task}
