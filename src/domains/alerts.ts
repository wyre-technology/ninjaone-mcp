/**
 * Alerts domain handler
 *
 * Provides tools for alert operations in NinjaOne.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DomainHandler, CallToolResult } from "../utils/types.js";
import { getClient } from "../utils/client.js";

/**
 * Get alert domain tools
 */
function getTools(): Tool[] {
  return [
    {
      name: "ninjaone_alerts_list",
      description:
        "List active alerts in NinjaOne. Can filter by severity, organization, or device.",
      inputSchema: {
        type: "object" as const,
        properties: {
          severity: {
            type: "string",
            enum: ["CRITICAL", "MAJOR", "MINOR", "NONE"],
            description: "Filter by alert severity",
          },
          organization_id: {
            type: "number",
            description: "Filter alerts by organization ID",
          },
          device_id: {
            type: "number",
            description: "Filter alerts by device ID",
          },
          source_type: {
            type: "string",
            description: "Filter by alert source type (e.g., CONDITION, ACTIVITY)",
          },
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
      name: "ninjaone_alerts_reset",
      description:
        "Reset (dismiss) an alert. This acknowledges the alert and marks it as handled.",
      inputSchema: {
        type: "object" as const,
        properties: {
          alert_uid: {
            type: "string",
            description: "The unique identifier of the alert to reset",
          },
        },
        required: ["alert_uid"],
      },
    },
    {
      name: "ninjaone_alerts_reset_all",
      description:
        "Reset (dismiss) all alerts for a device or organization. Use with caution.",
      inputSchema: {
        type: "object" as const,
        properties: {
          device_id: {
            type: "number",
            description: "Reset all alerts for this device ID",
          },
          organization_id: {
            type: "number",
            description: "Reset all alerts for this organization ID",
          },
          severity: {
            type: "string",
            enum: ["CRITICAL", "MAJOR", "MINOR", "NONE"],
            description: "Only reset alerts of this severity",
          },
        },
      },
    },
    {
      name: "ninjaone_alerts_summary",
      description:
        "Get a summary count of alerts grouped by severity and/or organization",
      inputSchema: {
        type: "object" as const,
        properties: {
          group_by: {
            type: "string",
            enum: ["severity", "organization", "both"],
            description: "How to group the alert counts (default: severity)",
          },
        },
      },
    },
  ];
}

/**
 * Handle an alert domain tool call
 */
async function handleCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const client = await getClient();

  switch (toolName) {
    case "ninjaone_alerts_list": {
      const limit = (args.limit as number) || 50;
      const response = await client.alerts.list({
        severity: args.severity as string | undefined,
        organizationId: args.organization_id as number | undefined,
        deviceId: args.device_id as number | undefined,
        sourceType: args.source_type as string | undefined,
        pageSize: limit,
        cursor: args.cursor as string | undefined,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                alerts: response.alerts,
                cursor: response.cursor,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_alerts_reset": {
      const alertUid = args.alert_uid as string;
      const result = await client.alerts.reset(alertUid);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, message: "Alert reset successfully", result },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_alerts_reset_all": {
      const deviceId = args.device_id as number | undefined;
      const organizationId = args.organization_id as number | undefined;
      const severity = args.severity as string | undefined;

      if (!deviceId && !organizationId) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Must specify either device_id or organization_id to reset alerts",
            },
          ],
          isError: true,
        };
      }

      const result = await client.alerts.resetAll({
        deviceId,
        organizationId,
        severity,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, message: "Alerts reset successfully", result },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_alerts_summary": {
      const groupBy = (args.group_by as string) || "severity";
      const summary = await client.alerts.getSummary({ groupBy });

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown alert tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const alertsHandler: DomainHandler = {
  getTools,
  handleCall,
};
