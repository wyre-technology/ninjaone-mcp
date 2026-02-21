/**
 * Tickets domain handler
 *
 * Provides tools for ticket operations in NinjaOne.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DomainHandler, CallToolResult } from "../utils/types.js";
import { getClient } from "../utils/client.js";
import { logger } from "../utils/logger.js";

/**
 * Get ticket domain tools
 */
function getTools(): Tool[] {
  return [
    {
      name: "ninjaone_tickets_list",
      description:
        "List tickets in NinjaOne. Can filter by status, organization, or device.",
      inputSchema: {
        type: "object" as const,
        properties: {
          status: {
            type: "string",
            enum: ["OPEN", "IN_PROGRESS", "WAITING", "CLOSED"],
            description: "Filter by ticket status",
          },
          organization_id: {
            type: "number",
            description: "Filter tickets by organization ID",
          },
          device_id: {
            type: "number",
            description: "Filter tickets by device ID",
          },
          board_id: {
            type: "number",
            description: "Filter tickets by board ID",
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
      name: "ninjaone_tickets_get",
      description: "Get details for a specific ticket by its ID",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID",
          },
        },
        required: ["ticket_id"],
      },
    },
    {
      name: "ninjaone_tickets_create",
      description: "Create a new ticket in NinjaOne",
      inputSchema: {
        type: "object" as const,
        properties: {
          subject: {
            type: "string",
            description: "Ticket subject/title",
          },
          description: {
            type: "string",
            description: "Ticket description/details",
          },
          organization_id: {
            type: "number",
            description: "Organization ID for the ticket",
          },
          device_id: {
            type: "number",
            description: "Device ID to associate with the ticket",
          },
          board_id: {
            type: "number",
            description: "Ticket board ID",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description: "Ticket priority",
          },
          type: {
            type: "string",
            enum: ["PROBLEM", "QUESTION", "INCIDENT", "TASK"],
            description: "Ticket type",
          },
        },
        required: ["subject", "organization_id"],
      },
    },
    {
      name: "ninjaone_tickets_update",
      description: "Update an existing ticket in NinjaOne",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID to update",
          },
          subject: {
            type: "string",
            description: "New ticket subject",
          },
          description: {
            type: "string",
            description: "New ticket description",
          },
          status: {
            type: "string",
            enum: ["OPEN", "IN_PROGRESS", "WAITING", "CLOSED"],
            description: "New ticket status",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description: "New ticket priority",
          },
          assignee_id: {
            type: "number",
            description: "New assignee user ID",
          },
        },
        required: ["ticket_id"],
      },
    },
    {
      name: "ninjaone_tickets_add_comment",
      description: "Add a comment to a ticket",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID to add the comment to",
          },
          body: {
            type: "string",
            description: "The comment text",
          },
          public: {
            type: "boolean",
            description: "Whether the comment is visible to customers (default: true)",
          },
        },
        required: ["ticket_id", "body"],
      },
    },
    {
      name: "ninjaone_tickets_comments",
      description: "Get comments/activity for a ticket",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID",
          },
        },
        required: ["ticket_id"],
      },
    },
  ];
}

/**
 * Handle a ticket domain tool call
 */
async function handleCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const client = await getClient();

  switch (toolName) {
    case "ninjaone_tickets_list": {
      const limit = (args.limit as number) || 50;
      const cursor = args.cursor as string | undefined;
      logger.info("API call: tickets.list", {
        status: args.status,
        organizationId: args.organization_id,
        deviceId: args.device_id,
        boardId: args.board_id,
        limit,
        cursor,
      });

      const response = await client.tickets.list({
        status: args.status as string | undefined,
        organizationId: args.organization_id as number | undefined,
        deviceId: args.device_id as number | undefined,
        boardId: args.board_id as number | undefined,
        pageSize: limit,
        cursor,
      });
      logger.debug("API response: tickets.list", { response });

      // The API may return a raw array or a wrapped {tickets, cursor} object
      const tickets = Array.isArray(response)
        ? response
        : (response?.tickets ?? []);
      const nextCursor = Array.isArray(response) ? undefined : response?.cursor;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ tickets, cursor: nextCursor }, null, 2),
          },
        ],
      };
    }

    case "ninjaone_tickets_get": {
      const ticketId = args.ticket_id as number;
      logger.info("API call: tickets.get", { ticketId });
      const ticket = await client.tickets.get(ticketId);
      logger.debug("API response: tickets.get", { ticket });

      return {
        content: [{ type: "text", text: JSON.stringify(ticket, null, 2) }],
      };
    }

    case "ninjaone_tickets_create": {
      logger.info("API call: tickets.create", { subject: args.subject, organizationId: args.organization_id });
      const ticket = await client.tickets.create({
        subject: args.subject as string,
        description: args.description as string | undefined,
        organizationId: args.organization_id as number,
        deviceId: args.device_id as number | undefined,
        boardId: args.board_id as number | undefined,
        priority: args.priority as string | undefined,
        type: args.type as string | undefined,
      });
      logger.debug("API response: tickets.create", { ticket });

      return {
        content: [{ type: "text", text: JSON.stringify(ticket, null, 2) }],
      };
    }

    case "ninjaone_tickets_update": {
      const ticketId = args.ticket_id as number;
      logger.info("API call: tickets.update", { ticketId });
      const ticket = await client.tickets.update(ticketId, {
        subject: args.subject as string | undefined,
        description: args.description as string | undefined,
        status: args.status as string | undefined,
        priority: args.priority as string | undefined,
        assigneeId: args.assignee_id as number | undefined,
      });
      logger.debug("API response: tickets.update", { ticket });

      return {
        content: [{ type: "text", text: JSON.stringify(ticket, null, 2) }],
      };
    }

    case "ninjaone_tickets_add_comment": {
      const ticketId = args.ticket_id as number;
      logger.info("API call: tickets.addComment", { ticketId });
      const comment = await client.tickets.addComment(ticketId, {
        body: args.body as string,
        public: (args.public as boolean) ?? true,
      });
      logger.debug("API response: tickets.addComment", { comment });

      return {
        content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
      };
    }

    case "ninjaone_tickets_comments": {
      const ticketId = args.ticket_id as number;
      logger.info("API call: tickets.getComments", { ticketId });
      const comments = await client.tickets.getComments(ticketId);
      logger.debug("API response: tickets.getComments", { comments });

      return {
        content: [{ type: "text", text: JSON.stringify(comments, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown ticket tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const ticketsHandler: DomainHandler = {
  getTools,
  handleCall,
};
