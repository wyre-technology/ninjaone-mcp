/**
 * Cloudflare Workers entry point for NinjaOne MCP Server
 *
 * Handles HTTP requests in a serverless environment.
 * Credentials are expected via gateway headers:
 * - X-Ninja-Client-ID
 * - X-Ninja-Client-Secret
 * - X-Ninja-Region (optional, defaults to "us")
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface Env {
  NINJAONE_CLIENT_ID?: string;
  NINJAONE_CLIENT_SECRET?: string;
  NINJAONE_REGION?: string;
}

/**
 * Create a fresh MCP server instance for each request
 * Workers are stateless, so we set up the server per-invocation
 */
function createMcpServer(): Server {
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

  // Register minimal tool listing handler for worker context
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const navigateTool: Tool = {
      name: "ninjaone_navigate",
      description:
        "Navigate to a NinjaOne domain to access its tools. Available domains: devices, organizations, alerts, tickets.",
      inputSchema: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            enum: ["devices", "organizations", "alerts", "tickets"],
            description: "The domain to navigate to",
          },
        },
        required: ["domain"],
      },
    };

    const statusTool: Tool = {
      name: "ninjaone_status",
      description: "Show current navigation state and verify API credentials.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    };

    return { tools: [navigateTool, statusTool] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    return {
      content: [
        {
          type: "text",
          text: `Tool ${name} called in worker context. Full domain handling available in HTTP transport mode.`,
        },
      ],
    };
  });

  return server;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          transport: "cloudflare-workers",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // MCP endpoint
    if (url.pathname === "/mcp") {
      // Extract credentials from headers or env
      const clientId =
        request.headers.get("x-ninja-client-id") || env.NINJAONE_CLIENT_ID;
      const clientSecret =
        request.headers.get("x-ninja-client-secret") || env.NINJAONE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({
            error: "Missing credentials",
            message:
              "Provide X-Ninja-Client-ID and X-Ninja-Client-Secret headers, or configure environment secrets",
            required: ["X-Ninja-Client-ID", "X-Ninja-Client-Secret"],
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        enableJsonResponse: true,
      });

      await server.connect(transport);

      // Convert the Web Request to a Node-compatible form handled by the transport
      // Note: In production, you would use a CF Workers-compatible adapter
      return new Response(
        JSON.stringify({ status: "connected", transport: "streamable-http" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 404 for everything else
    return new Response(
      JSON.stringify({ error: "Not found", endpoints: ["/mcp", "/health"] }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
