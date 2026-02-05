/**
 * Organizations domain handler
 *
 * Provides tools for organization operations in NinjaOne.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DomainHandler, CallToolResult } from "../utils/types.js";
import { getClient } from "../utils/client.js";

/**
 * Get organization domain tools
 */
function getTools(): Tool[] {
  return [
    {
      name: "ninjaone_organizations_list",
      description:
        "List organizations in NinjaOne. Organizations represent customer accounts.",
      inputSchema: {
        type: "object" as const,
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of results (default: 50)",
          },
          cursor: {
            type: "string",
            description: "Pagination cursor for next page of results",
          },
        },
      },
    },
    {
      name: "ninjaone_organizations_get",
      description: "Get details for a specific organization by its ID",
      inputSchema: {
        type: "object" as const,
        properties: {
          organization_id: {
            type: "number",
            description: "The organization ID",
          },
        },
        required: ["organization_id"],
      },
    },
    {
      name: "ninjaone_organizations_create",
      description: "Create a new organization in NinjaOne",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: {
            type: "string",
            description: "Organization name",
          },
          description: {
            type: "string",
            description: "Organization description",
          },
          node_approval_mode: {
            type: "string",
            enum: ["AUTOMATIC", "MANUAL", "REJECT"],
            description: "How to handle new device registrations",
          },
          policy_id: {
            type: "number",
            description: "Default policy ID for devices",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "ninjaone_organizations_locations",
      description: "List locations for an organization",
      inputSchema: {
        type: "object" as const,
        properties: {
          organization_id: {
            type: "number",
            description: "The organization ID",
          },
        },
        required: ["organization_id"],
      },
    },
    {
      name: "ninjaone_organizations_devices",
      description: "List all devices for an organization",
      inputSchema: {
        type: "object" as const,
        properties: {
          organization_id: {
            type: "number",
            description: "The organization ID",
          },
          device_class: {
            type: "string",
            enum: ["WINDOWS_WORKSTATION", "WINDOWS_SERVER", "MAC", "LINUX", "VMWARE_VM"],
            description: "Filter by device class",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default: 50)",
          },
        },
        required: ["organization_id"],
      },
    },
  ];
}

/**
 * Handle an organization domain tool call
 */
async function handleCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const client = await getClient();

  switch (toolName) {
    case "ninjaone_organizations_list": {
      const limit = (args.limit as number) || 50;
      const response = await client.organizations.list({
        pageSize: limit,
        cursor: args.cursor as string | undefined,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                organizations: response.organizations,
                cursor: response.cursor,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_organizations_get": {
      const orgId = args.organization_id as number;
      const organization = await client.organizations.get(orgId);

      return {
        content: [{ type: "text", text: JSON.stringify(organization, null, 2) }],
      };
    }

    case "ninjaone_organizations_create": {
      const organization = await client.organizations.create({
        name: args.name as string,
        description: args.description as string | undefined,
        nodeApprovalMode: args.node_approval_mode as string | undefined,
        policyId: args.policy_id as number | undefined,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(organization, null, 2) }],
      };
    }

    case "ninjaone_organizations_locations": {
      const orgId = args.organization_id as number;
      const locations = await client.organizations.getLocations(orgId);

      return {
        content: [{ type: "text", text: JSON.stringify(locations, null, 2) }],
      };
    }

    case "ninjaone_organizations_devices": {
      const orgId = args.organization_id as number;
      const limit = (args.limit as number) || 50;
      const devices = await client.organizations.getDevices(orgId, {
        deviceClass: args.device_class as string | undefined,
        pageSize: limit,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(devices, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown organization tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const organizationsHandler: DomainHandler = {
  getTools,
  handleCall,
};
