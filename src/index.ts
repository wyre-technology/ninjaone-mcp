#!/usr/bin/env node
/**
 * NinjaOne MCP Server with Decision Tree Architecture
 *
 * This MCP server uses a hierarchical tool loading approach:
 * 1. Initially exposes only a navigation tool
 * 2. After user selects a domain, exposes domain-specific tools
 * 3. Lazy-loads domain handlers and the NinjaOne client
 *
 * Credentials are provided via environment variables:
 * - NINJAONE_CLIENT_ID
 * - NINJAONE_CLIENT_SECRET
 * - NINJAONE_REGION (us, eu, oc)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDomainHandler, getAvailableDomains } from "./domains/index.js";
import { isDomainName, type DomainName } from "./utils/types.js";
import { getCredentials } from "./utils/client.js";

// Server state
let currentDomain: DomainName | null = null;

// Create the MCP server
const server = new Server(
  {
    name: "ninjaone-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Navigation tool - always available
 */
const navigateTool: Tool = {
  name: "ninjaone_navigate",
  description:
    "Navigate to a NinjaOne domain to access its tools. Available domains: devices (manage endpoints), organizations (manage customers), alerts (view and reset alerts), tickets (manage service tickets).",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        enum: getAvailableDomains(),
        description:
          "The domain to navigate to. Choose: devices, organizations, alerts, or tickets",
      },
    },
    required: ["domain"],
  },
};

/**
 * Back navigation tool - available when in a domain
 */
const backTool: Tool = {
  name: "ninjaone_back",
  description: "Navigate back to the main menu to select a different domain",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Status tool - shows current navigation state
 */
const statusTool: Tool = {
  name: "ninjaone_status",
  description:
    "Show current navigation state and available domains. Also verifies API credentials are configured.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Get tools based on current navigation state
 */
async function getToolsForState(): Promise<Tool[]> {
  // Always include status tool
  const tools: Tool[] = [statusTool];

  if (currentDomain === null) {
    // At the root - show navigation tool
    tools.unshift(navigateTool);
  } else {
    // In a domain - show back tool and domain-specific tools
    tools.unshift(backTool);

    const handler = await getDomainHandler(currentDomain);
    const domainTools = handler.getTools();
    tools.push(...domainTools);
  }

  return tools;
}

// Handle ListTools requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = await getToolsForState();
  return { tools };
});

// Handle CallTool requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Handle navigation
    if (name === "ninjaone_navigate") {
      const domain = (args as { domain: string }).domain;

      if (!isDomainName(domain)) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid domain: ${domain}. Available domains: ${getAvailableDomains().join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      // Check credentials before navigating
      const creds = getCredentials();
      if (!creds) {
        return {
          content: [
            {
              type: "text",
              text: "Error: No API credentials configured. Please set NINJAONE_CLIENT_ID, NINJAONE_CLIENT_SECRET, and optionally NINJAONE_REGION environment variables.",
            },
          ],
          isError: true,
        };
      }

      currentDomain = domain;

      // Get tools for the new domain
      const handler = await getDomainHandler(domain);
      const domainTools = handler.getTools();

      return {
        content: [
          {
            type: "text",
            text: `Navigated to ${domain} domain.\n\nAvailable tools:\n${domainTools
              .map((t) => `- ${t.name}: ${t.description}`)
              .join("\n")}\n\nUse ninjaone_back to return to the main menu.`,
          },
        ],
      };
    }

    // Handle back navigation
    if (name === "ninjaone_back") {
      const previousDomain = currentDomain;
      currentDomain = null;

      return {
        content: [
          {
            type: "text",
            text: `Navigated back from ${previousDomain || "root"} to the main menu.\n\nAvailable domains: ${getAvailableDomains().join(", ")}\n\nUse ninjaone_navigate to select a domain.`,
          },
        ],
      };
    }

    // Handle status
    if (name === "ninjaone_status") {
      const creds = getCredentials();
      const credStatus = creds
        ? `Configured (region: ${creds.region}, base URL: ${creds.baseUrl})`
        : "NOT CONFIGURED - Please set environment variables";

      return {
        content: [
          {
            type: "text",
            text: `NinjaOne MCP Server Status\n\nCurrent domain: ${currentDomain || "(none - at main menu)"}\nCredentials: ${credStatus}\nAvailable domains: ${getAvailableDomains().join(", ")}`,
          },
        ],
      };
    }

    // Handle domain-specific tools
    if (currentDomain !== null) {
      const handler = await getDomainHandler(currentDomain);

      // Check if the tool belongs to this domain
      const domainTools = handler.getTools();
      const toolExists = domainTools.some((t) => t.name === name);

      if (toolExists) {
        return await handler.handleCall(name, args as Record<string, unknown>);
      }
    }

    // Tool not found
    return {
      content: [
        {
          type: "text",
          text: currentDomain
            ? `Unknown tool: ${name}. You are currently in the ${currentDomain} domain. Use ninjaone_back to return to the main menu.`
            : `Unknown tool: ${name}. Use ninjaone_navigate to select a domain first.`,
        },
      ],
      isError: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NinjaOne MCP server running on stdio (decision tree mode)");
}

main().catch(console.error);
