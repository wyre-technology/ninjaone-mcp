/**
 * Devices domain handler
 *
 * Provides tools for device operations in NinjaOne.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DomainHandler, CallToolResult } from "../utils/types.js";
import { getClient } from "../utils/client.js";
import { logger } from "../utils/logger.js";

/**
 * Get device domain tools
 */
function getTools(): Tool[] {
  return [
    {
      name: "ninjaone_devices_list",
      description:
        "List devices in NinjaOne. Can filter by organization, device class, or online status.",
      inputSchema: {
        type: "object" as const,
        properties: {
          organization_id: {
            type: "number",
            description: "Filter devices by organization ID",
          },
          device_class: {
            type: "string",
            enum: ["WINDOWS_WORKSTATION", "WINDOWS_SERVER", "MAC", "LINUX", "VMWARE_VM"],
            description: "Filter by device class",
          },
          online: {
            type: "boolean",
            description: "Filter by online status (true for online, false for offline)",
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
      name: "ninjaone_devices_get",
      description: "Get details for a specific device by its ID",
      inputSchema: {
        type: "object" as const,
        properties: {
          device_id: {
            type: "number",
            description: "The device ID",
          },
        },
        required: ["device_id"],
      },
    },
    {
      name: "ninjaone_devices_reboot",
      description: "Schedule a reboot for a device",
      inputSchema: {
        type: "object" as const,
        properties: {
          device_id: {
            type: "number",
            description: "The device ID to reboot",
          },
          reason: {
            type: "string",
            description: "Reason for the reboot",
          },
        },
        required: ["device_id"],
      },
    },
    {
      name: "ninjaone_devices_services",
      description: "List Windows services on a device",
      inputSchema: {
        type: "object" as const,
        properties: {
          device_id: {
            type: "number",
            description: "The device ID",
          },
          state: {
            type: "string",
            enum: ["RUNNING", "STOPPED", "PAUSED"],
            description: "Filter by service state",
          },
        },
        required: ["device_id"],
      },
    },
    {
      name: "ninjaone_devices_alerts",
      description: "Get active alerts for a specific device",
      inputSchema: {
        type: "object" as const,
        properties: {
          device_id: {
            type: "number",
            description: "The device ID",
          },
          severity: {
            type: "string",
            enum: ["CRITICAL", "MAJOR", "MINOR", "NONE"],
            description: "Filter by alert severity",
          },
        },
        required: ["device_id"],
      },
    },
    {
      name: "ninjaone_devices_activities",
      description: "Get activity log for a device",
      inputSchema: {
        type: "object" as const,
        properties: {
          device_id: {
            type: "number",
            description: "The device ID",
          },
          activity_type: {
            type: "string",
            description: "Filter by activity type",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default: 50)",
          },
        },
        required: ["device_id"],
      },
    },
  ];
}

/**
 * Handle a device domain tool call
 */
async function handleCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const client = await getClient();

  switch (toolName) {
    case "ninjaone_devices_list": {
      const limit = (args.limit as number) || 50;
      const cursor = args.cursor as string | undefined;
      logger.info("API call: devices.list", {
        organizationId: args.organization_id,
        deviceClass: args.device_class,
        online: args.online,
        limit,
        cursor,
      });

      const response = await client.devices.list({
        organizationId: args.organization_id as number | undefined,
        deviceClass: args.device_class as string | undefined,
        online: args.online as boolean | undefined,
        pageSize: limit,
        cursor,
      });
      logger.debug("API response: devices.list", { response });

      if (!response || typeof response !== "object" || !("devices" in response)) {
        logger.warn("Unexpected response shape from devices.list", {
          responseType: typeof response,
          keys: response ? Object.keys(response) : [],
          raw: JSON.stringify(response)?.substring(0, 500),
        });
      }

      const devices = response?.devices ?? [];
      const nextCursor = response?.cursor;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ devices, cursor: nextCursor }, null, 2),
          },
        ],
      };
    }

    case "ninjaone_devices_get": {
      const deviceId = args.device_id as number;
      logger.info("API call: devices.get", { deviceId });
      const device = await client.devices.get(deviceId);
      logger.debug("API response: devices.get", { device });

      return {
        content: [{ type: "text", text: JSON.stringify(device, null, 2) }],
      };
    }

    case "ninjaone_devices_reboot": {
      const deviceId = args.device_id as number;
      const reason = args.reason as string | undefined;
      logger.info("API call: devices.reboot", { deviceId, reason });
      const result = await client.devices.reboot(deviceId, { reason });
      logger.debug("API response: devices.reboot", { result });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, message: "Reboot scheduled", result },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_devices_services": {
      const deviceId = args.device_id as number;
      logger.info("API call: devices.getServices", { deviceId, state: args.state });
      const services = await client.devices.getServices(deviceId, {
        state: args.state as string | undefined,
      });
      logger.debug("API response: devices.getServices", { services });

      return {
        content: [{ type: "text", text: JSON.stringify(services, null, 2) }],
      };
    }

    case "ninjaone_devices_alerts": {
      const deviceId = args.device_id as number;
      logger.info("API call: devices.getAlerts", { deviceId, severity: args.severity });
      const alerts = await client.devices.getAlerts(deviceId, {
        severity: args.severity as string | undefined,
      });
      logger.debug("API response: devices.getAlerts", { alerts });

      return {
        content: [{ type: "text", text: JSON.stringify(alerts, null, 2) }],
      };
    }

    case "ninjaone_devices_activities": {
      const deviceId = args.device_id as number;
      const limit = (args.limit as number) || 50;
      logger.info("API call: devices.getActivities", { deviceId, activityType: args.activity_type, limit });
      const activities = await client.devices.getActivities(deviceId, {
        activityType: args.activity_type as string | undefined,
        pageSize: limit,
      });
      logger.debug("API response: devices.getActivities", { activities });

      return {
        content: [{ type: "text", text: JSON.stringify(activities, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown device tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const devicesHandler: DomainHandler = {
  getTools,
  handleCall,
};
