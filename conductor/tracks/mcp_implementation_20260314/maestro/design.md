# Design Document: MCP Implementation for Supra L1 SDK

## 1. Problem Statement

The `supra-l1-sdk` is currently a single-package TypeScript library providing essential utilities for interacting with the Supra blockchain. While functional, it lacks a standardized interface for integration with modern AI ecosystems (e.g., Model Context Protocol).

The core problem is to expose the SDK's rich functionality—such as coin transfers, package publishing, and transaction management—to LLMs and AI agents in a way that is:
1.  **Standardized**: Using the Model Context Protocol (MCP) as the communication layer.
2.  **Modular**: Isolating the MCP server implementation from the core SDK to avoid dependency bloat and coupling.
3.  **Maintainable**: Transitioning the repository to a modern monorepo structure using `npm workspaces` for better scaling and developer experience.

By implementing an MCP server as a separate package within this new monorepo, we enable a wide range of agentic workflows (e.g., automated chain analysis, agent-driven transactions) while maintaining the SDK's integrity as a lightweight core library.

## 2. Requirements

This section outlines the functional and non-functional requirements for the MCP implementation and monorepo migration.

### Functional Requirements
- **MCP Tool Implementation**:
  - `transfer_coin`: Transfer Supra coins between accounts.
  - `publish_package`: Publish a Move package to the Supra chain.
  - `simulate_transaction`: Simulate a transaction and return the results.
  - `sign_transaction`: Sign a raw transaction.
  - `generate_transaction_hash`: Generate the hash for a signed transaction.
- **MCP Resource Implementation**:
  - `transaction_insights`: Retrieve detailed information about a specific transaction.
  - `account_info`: Retrieve account details (balance, sequence number).
  - `account_resources`: List resources owned by a specific account address.
- **Monorepo Migration**:
  - Reorganize the current repository into `packages/sdk` and `packages/mcp-server`.
  - Configure `npm workspaces` in the root `package.json`.
  - Ensure existing SDK build and test flows are preserved in the new structure.

### Non-Functional Requirements
- **Testing**:
  - Implement unit and integration tests using **Vitest**.
  - Achieve **>80% code coverage** for all new MCP code and existing core SDK logic.
- **Communication**:
  - The MCP server must use **Stdio (Standard I/O)** for communication with clients.
- **Standardization**:
  - Adhere to the latest Model Context Protocol (MCP) version and schema.
- **Documentation**:
  - Provide a clear README with setup instructions and tool/resource documentation.

### Technical Constraints
- **Language**: TypeScript (strict mode).
- **Runtime**: Node.js (current LTS).
- **Primary Dependencies**: `@modelcontextprotocol/sdk`, `axios`, `js-sha3`, `supra-l1-sdk-core`.

## 3. Approach

This section defines the architectural strategy for the MCP implementation and monorepo migration.

### Selected Approach: Monorepo with Separate MCP Package

We will transition the repository from a single-package structure to a monorepo using `npm workspaces`. This modular architecture isolates the core SDK functionality from the MCP-specific implementation details.

**Key Components**:
- **Root**: `package.json` with `workspaces: ["packages/*"]` and centralized scripts (build, test, lint).
- **`packages/sdk/`**: The existing SDK code (src/, index.ts, types.ts, etc.) will be moved here. This package will remain the lightweight core library.
- **`packages/mcp-server/`**: A new package containing the MCP implementation. It will consume the core SDK functionality via a workspace dependency.

### Alternatives Considered

**Approach: Integrated Entrypoint (Monolith)**
*   **Summary**: Keep the existing flat structure and add an `mcp-server.ts` entrypoint to the `src` directory.
*   **Decision**: Rejected. While simpler initially, this approach couples the MCP server directly to the SDK's internal implementation and forces all SDK users to install MCP-specific dependencies, causing unnecessary bloat.

### Rationale for Selected Approach
The monorepo structure provides the best long-term maintainability and modularity. It ensures that the MCP server can iterate independently and be versioned separately (e.g., `@supra-l1/mcp-server`) while keeping the core SDK lightweight for its primary audience.

## 4. Architecture

This section describes the internal structure, data flow, and key interfaces of the MCP implementation and monorepo migration.

### Component Diagram
```
+-----------------------------------------------------------+
|                        Monorepo Root                      |
|                                                           |
|  +-----------------------+       +---------------------+  |
|  |     packages/sdk      | <---  | packages/mcp-server |  |
|  | (Core SDK Logic/RPC)  |       | (MCP Implementation)|  |
|  +-----------------------+       +----------+----------+  |
+-------------^-------------------------------|-------------+
              |                               |
              | (HTTPS/RPC)                   | (Stdio)
              |                               |
      +-------v-------+               +-------v-------+
      | Supra L1 Node |               |   MCP Client  |
      +---------------+               | (e.g., Claude)|
                                      +---------------+
```

### Data Flow (MCP Request)
1.  **Request Phase**: The MCP client (e.g., Claude Desktop) sends a JSON-RPC message (via Stdio) to the MCP server.
2.  **Dispatch Phase**: The `SupraMcpServer` class receives the message and identifies the requested tool (e.g., `transfer_coin`) or resource (e.g., `account_info`).
3.  **Handler Phase**: The request is routed to the corresponding **Tool/Resource Handler**.
4.  **SDK Execution Phase**: The handler uses the core SDK functions (from `packages/sdk`) to perform blockchain operations (e.g., calling Supra RPC nodes via `axios`).
5.  **Response Phase**: The SDK results are formatted back into an MCP-compliant JSON-RPC response and sent to the client via Stdio.

### Key Interfaces & Classes
- **`SupraMcpServer`**: The main class responsible for server lifecycle (initialization, tool registration, and communication).
- **`ToolManager`**: Registry for mapping SDK functions (e.g., `SupraAccount.transferCoin`) to MCP-compliant tool definitions.
- **`ResourceManager`**: Registry for mapping blockchain data endpoints to MCP-compliant resource URIs.
- **`SupraClient`**: Existing core SDK class (from `packages/sdk`) used to interact with the blockchain.

### Package Hierarchy
- **`@supra-l1/sdk`**:
  - `src/`: Core logic (SupraClient, SupraAccount, HexString, etc.).
  - `index.ts`: Public API entrypoint.
- **`@supra-l1/mcp-server`**:
  - `src/server.ts`: The `SupraMcpServer` class implementation.
  - `src/tools/`: Tool definitions and implementation.
  - `src/resources/`: Resource definitions and implementation.
  - `src/index.ts`: Server entrypoint.

## 5. Agent Team

This section defines the roles and responsibilities of the specialized sub-agents tasked with implementing the MCP server and performing the monorepo migration.

### Agent Assignments
- **`refactor` Agent**:
  - **Responsibility**: Lead the transition to a monorepo structure using `npm workspaces`.
  - **Tasks**: Update `package.json`, move existing SDK code to `packages/sdk`, and ensure all existing build/test scripts are compatible with the new structure.
- **`coder` Agent**:
  - **Responsibility**: Implement the core MCP server functionality and tool/resource handlers.
  - **Tasks**: Set up `@modelcontextprotocol/sdk`, implement `SupraMcpServer`, and map SDK functions (coin transfers, package publishing, etc.) to MCP tools/resources.
- **`tester` Agent**:
  - **Responsibility**: Design and implement the testing infrastructure using **Vitest**.
  - **Tasks**: Configure Vitest for the whole monorepo, write unit and integration tests for MCP tools/resources, and verify that the core SDK remains fully functional with **>80% code coverage**.
- **`technical_writer` Agent**:
  - **Responsibility**: Document the new structure and MCP server usage.
  - **Tasks**: Update the project README, provide detailed instructions for using the MCP server with different clients (e.g., Claude Desktop, Inspector), and document all available tools/resources.

## 6. Risk Assessment & Mitigation

This section identifies potential risks and outlines strategies to minimize their impact.

### Risks and Mitigations
- **Monorepo Migration (Broken Imports/Builds)**:
  - **Risk**: Moving the SDK code to `packages/sdk` and renaming it to `@supra-l1/sdk` could break existing build scripts, imports, or external dependencies.
  - **Mitigation**: Perform the migration incrementally. Run the existing `npm test` and `npm run build` commands immediately after restructuring. Use `npm workspaces` for local package resolution and `tsup` for consistent builds across packages.
- **MCP Tool/Resource Implementation (Compatibility)**:
  - **Risk**: Potential for discrepancies between core SDK functions (e.g., `transfer_coin`) and the expectations of MCP tool handlers or clients.
  - **Mitigation**: Implement robust error handling and clear error messages within the MCP server. Use strict TypeScript types for all tool inputs and outputs. Perform manual verification with an MCP-compatible client (e.g., Claude Desktop) after each implement phase.
- **Test Coverage (Achieving >80%)**:
  - **Risk**: Ensuring >80% code coverage for both the core SDK and the new MCP implementation might be challenging given the initial lack of a formal testing framework.
  - **Mitigation**: Configure **Vitest**'s built-in coverage reporter early in the project. Implement unit tests for all new tool/resource handlers and fill gaps in existing core SDK coverage as part of the implementation process.
- **Dependency Bloat**:
  - **Risk**: Adding MCP-specific dependencies to the core SDK could bloat its bundle size.
  - **Mitigation**: The **Monorepo** approach addresses this directly by isolating MCP-specific dependencies within the `packages/mcp-server` directory.

## 7. Success Criteria

This section defines the measurable outcomes used to evaluate the success of the MCP implementation and monorepo migration.

### Key Performance Indicators (KPIs)
- **Monorepo Structure**: The repository is successfully reorganized into a monorepo using `npm workspaces`, with `packages/sdk` and `packages/mcp-server` containing the respective logic.
- **Functional MCP Tools**: All core SDK functions (`transfer_coin`, `publish_package`, `simulate_transaction`, `sign_transaction`, `generate_transaction_hash`) are correctly exposed as MCP tools.
- **Functional MCP Resources**: All defined blockchain data (`transaction_insights`, `account_info`, `account_resources`) is accessible via MCP resources.
- **Code Quality & Testing**:
  - The **Vitest** testing framework is successfully integrated into the monorepo.
  - The entire monorepo achieves **>80% code coverage** (including core SDK and MCP implementation).
- **Client Compatibility**: The MCP server successfully communicates with at least one MCP-compatible client (e.g., Claude Desktop, Inspector) using Stdio.
- **Documentation**: A complete README with clear instructions for setting up and using the MCP server is available in the `mcp-server` package.
