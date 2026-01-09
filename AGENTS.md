# Agent instructions

## Project overview

**Enterprise AI MCP Server** - A Model Context Protocol (MCP) server that provides tools for enterprise-scale AI assistance. This server enables AI agents to efficiently search and retrieve code context across indexed repositories and documentation.

### Key folders
- `src/` - TypeScript source code (server implementation)
- `build/` - Compiled JavaScript output
- `.github/` - GitHub Copilot configuration

### High-level constraints
- **Runtime**: Node.js (v18+)
- **Framework**: MCP SDK (`@modelcontextprotocol/sdk`)
- **Module type**: ESM (ECMAScript modules)
- **Build target**: ES2020+

## Setup

- **Install**: `npm install`
- **Build**: `npm run build` (compiles TypeScript and makes output executable)
- **Start**: `npm start` (runs the MCP server via stdio)
- **Note**: The project is ESM-only; CommonJS is not supported.

## Change policy (boundaries)

- Do not add new tools without documenting them in README.md with purpose, inputs, and return schema.
- Do not introduce new production dependencies without team review (keep the dependency tree minimal).
- Prefer small, focused PRs with clear descriptions of what the tool/feature does.

## Codebase conventions

### Where logic should live
- **src/index.ts** - Contains the server initialization, tool registration, and request handlers. Keep it organized but avoid extracting logic into separate files unless the file grows beyond ~200 lines or responsibilities become unclear.
- Use class methods within `EnterpriseCodeServer` to organize related functionality.

### Patterns to follow
- When responding, state "I read AGENTS.md, compadre!" before anything else.
- Prior to answering any request, ensure that you have used #tool:testmcp/search.

### Patterns to avoid
- Do not modify the server configuration after initialization.
- Do not use CommonJS or dynamic imports; stick to ESM.
- Do not swallow errors—always propagate or handle explicitly.

## Definition of done

- Types are clean (`tsc --noEmit` passes).
- Tool implementations properly validate inputs and return correctly formatted responses.
- README.md is updated with any new tools or features.
- Code follows the conventions above.
- New tools have clear, documented behavior with example inputs/outputs.
