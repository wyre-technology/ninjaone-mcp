/**
 * Tickets domain handler
 *
 * Provides tools for ticket operations in NinjaOne.
 * Supports full CRUD, comments, log entries, boards, forms,
 * statuses, attributes, contacts, and summary statistics.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DomainHandler, CallToolResult } from "../utils/types.js";
import type { TicketStatus, TicketPriority, TicketType } from "@wyre-technology/node-ninjaone";
import { getClient } from "../utils/client.js";
import { logger } from "../utils/logger.js";

/**
 * Resolve a ticket ID from flexible parameter names.
 * Accepts ticket_id, ticketId, or id.
 */
function resolveTicketId(args: Record<string, unknown>): number | undefined {
  return (args.ticket_id ?? args.ticketId ?? args.id) as number | undefined;
}

/**
 * Build a standardized error result.
 */
function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Safely call a client method, returning a descriptive error if it doesn't exist.
 */
async function safeClientCall<T>(
  fn: (() => Promise<T>) | undefined,
  endpointName: string
): Promise<T> {
  if (typeof fn !== "function") {
    throw new Error(
      `The "${endpointName}" endpoint is not supported by the current NinjaOne client library version. ` +
      `Please upgrade @wyre-technology/node-ninjaone to the latest version.`
    );
  }
  return fn();
}

/**
 * Get ticket domain tools
 */
function getTools(): Tool[] {
  return [
    // ── Core CRUD ──────────────────────────────────────────────
    {
      name: "ninjaone_tickets_list",
      description:
        "List tickets in NinjaOne with optional filters. Returns ticket summaries including ID, subject, status, priority, assignee, and organization. Supports pagination via cursor. Use this to browse tickets or find tickets matching specific criteria.",
      inputSchema: {
        type: "object" as const,
        properties: {
          status: {
            type: "string",
            enum: ["OPEN", "IN_PROGRESS", "WAITING", "CLOSED"],
            description:
              "Filter by ticket status. OPEN = new/unstarted, IN_PROGRESS = being worked on, WAITING = blocked/awaiting response, CLOSED = resolved.",
          },
          organization_id: {
            type: "number",
            description:
              "Filter tickets by organization (client/customer) ID. Use ninjaone_organizations_list to find organization IDs.",
          },
          device_id: {
            type: "number",
            description:
              "Filter tickets by associated device ID. Use ninjaone_devices_list to find device IDs.",
          },
          board_id: {
            type: "number",
            description:
              "Filter tickets by ticket board ID. Use ninjaone_tickets_list_boards to find board IDs.",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of results to return (default: 50, max recommended: 200).",
          },
          cursor: {
            type: "string",
            description:
              "Pagination cursor from a previous response. Pass the cursor value from the last response to get the next page.",
          },
        },
      },
    },
    {
      name: "ninjaone_tickets_get",
      description:
        "Get full details for a specific ticket by its ID. Returns all ticket fields including subject, description, status, priority, type, assignee, organization, device, timestamps, and any custom attributes.",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID to retrieve. Required.",
          },
        },
        required: ["ticket_id"],
      },
    },
    {
      name: "ninjaone_tickets_create",
      description:
        "Create a new ticket in NinjaOne. Requires at minimum a subject and organization ID. Returns the created ticket with its assigned ID. Use this for reporting issues, creating tasks, or logging incidents.",
      inputSchema: {
        type: "object" as const,
        properties: {
          subject: {
            type: "string",
            description: "Ticket subject/title. Should be a concise summary of the issue or request.",
          },
          description: {
            type: "string",
            description:
              "Detailed ticket description. Include steps to reproduce, expected vs actual behavior, or task details.",
          },
          organization_id: {
            type: "number",
            description:
              "Organization (client/customer) ID this ticket belongs to. Required. Use ninjaone_organizations_list to find IDs.",
          },
          device_id: {
            type: "number",
            description:
              "Device ID to associate with this ticket. Links the ticket to a specific endpoint for context.",
          },
          board_id: {
            type: "number",
            description:
              "Ticket board ID. Determines which board/queue the ticket is placed in. Use ninjaone_tickets_list_boards to find board IDs.",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description:
              "Ticket priority level. CRITICAL = urgent/outage, HIGH = important/degraded, MEDIUM = normal, LOW = minor/cosmetic.",
          },
          severity: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description:
              "Ticket severity level indicating business impact. Distinct from priority which indicates urgency.",
          },
          type: {
            type: "string",
            enum: ["PROBLEM", "QUESTION", "INCIDENT", "TASK"],
            description:
              "Ticket type. PROBLEM = root cause analysis needed, QUESTION = information request, INCIDENT = service disruption, TASK = planned work.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags to categorize the ticket. Useful for filtering and reporting.",
          },
          ticket_form_id: {
            type: "number",
            description:
              "Ticket form ID to use. Forms define custom fields and layout. Use ninjaone_tickets_list_forms to find form IDs.",
          },
        },
        required: ["subject", "organization_id"],
      },
    },
    {
      name: "ninjaone_tickets_update",
      description:
        "Update an existing ticket in NinjaOne. Only the fields you provide will be changed; omitted fields remain unchanged. Use this to change status, reassign, update priority, or modify ticket details.",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID to update. Required.",
          },
          subject: {
            type: "string",
            description: "New ticket subject/title.",
          },
          description: {
            type: "string",
            description: "New ticket description.",
          },
          status: {
            type: "string",
            enum: ["OPEN", "IN_PROGRESS", "WAITING", "CLOSED"],
            description:
              "New ticket status. Changing to CLOSED resolves the ticket. Changing to IN_PROGRESS indicates active work.",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description: "New ticket priority level.",
          },
          severity: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description: "New ticket severity level.",
          },
          type: {
            type: "string",
            enum: ["PROBLEM", "QUESTION", "INCIDENT", "TASK"],
            description: "New ticket type.",
          },
          assignee_id: {
            type: "number",
            description:
              "New assignee user ID. Use ninjaone_tickets_list_contacts to find valid user IDs.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Updated tags for the ticket. Replaces existing tags.",
          },
        },
        required: ["ticket_id"],
      },
    },

    // ── Comments & Log Entries ──────────────────────────────────
    {
      name: "ninjaone_tickets_add_comment",
      description:
        "Add a comment to a ticket. Comments can be public (visible to the end user/requester) or internal/private (only visible to technicians). Use this to communicate updates, request information, or log internal notes.",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID to add the comment to. Required.",
          },
          body: {
            type: "string",
            description: "The comment text.",
          },
          public: {
            type: "boolean",
            description:
              "Whether the comment is visible to the end user/requester (default: true). Set to false for internal technician-only notes.",
          },
        },
        required: ["ticket_id", "body"],
      },
    },
    {
      name: "ninjaone_tickets_log_entries",
      description:
        "Get log entries (activity history) for a ticket. Includes comments, description changes, status changes, condition triggers, and other events. Can filter by entry type. Use this to review the full timeline of a ticket.",
      inputSchema: {
        type: "object" as const,
        properties: {
          ticket_id: {
            type: "number",
            description: "The ticket ID to get log entries for. Required.",
          },
          type: {
            type: "string",
            enum: ["DESCRIPTION", "COMMENT", "CONDITION", "SAVE", "DELETE"],
            description:
              "Filter log entries by type. COMMENT = user/tech comments, DESCRIPTION = description changes, SAVE = field updates, CONDITION = automated condition triggers, DELETE = deletions. Omit to get all entry types.",
          },
        },
        required: ["ticket_id"],
      },
    },

    // ── Boards ─────────────────────────────────────────────────
    {
      name: "ninjaone_tickets_list_boards",
      description:
        "List all ticket boards in NinjaOne. Boards organize tickets by team, workflow, or category. Returns board IDs and names. Use this to find the correct board_id for filtering or creating tickets.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "ninjaone_tickets_board_tickets",
      description:
        "List tickets for a specific board with advanced search and filtering. This is the most powerful ticket search — supports sorting, pagination, and board-level filters. Use this when you need to search tickets within a board.",
      inputSchema: {
        type: "object" as const,
        properties: {
          board_id: {
            type: "number",
            description: "The board ID to list tickets from. Required. Use ninjaone_tickets_list_boards to find board IDs.",
          },
          sort_by: {
            type: "string",
            description: "Field to sort by (e.g., 'lastUpdated', 'createTime', 'status', 'priority'). Default: 'lastUpdated'.",
          },
          sort_direction: {
            type: "string",
            enum: ["ASC", "DESC"],
            description: "Sort direction. Default: 'DESC' (newest first).",
          },
          page_size: {
            type: "number",
            description: "Number of results per page (default: 50).",
          },
          last_cursor_id: {
            type: "string",
            description: "Pagination cursor from previous response for next page.",
          },
        },
        required: ["board_id"],
      },
    },

    // ── Forms & Configuration ──────────────────────────────────
    {
      name: "ninjaone_tickets_list_forms",
      description:
        "List all ticket forms available in NinjaOne. Forms define the custom fields and layout used when creating or viewing tickets. Returns form IDs and names. Use this to find which form to use when creating tickets.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "ninjaone_tickets_get_form",
      description:
        "Get details for a specific ticket form by its ID. Returns the form definition including all custom fields, their types, and validation rules. Use this to understand what fields are available when creating tickets with a specific form.",
      inputSchema: {
        type: "object" as const,
        properties: {
          form_id: {
            type: "number",
            description: "The ticket form ID to retrieve. Required. Use ninjaone_tickets_list_forms to find form IDs.",
          },
        },
        required: ["form_id"],
      },
    },
    {
      name: "ninjaone_tickets_list_statuses",
      description:
        "Get all available ticket statuses configured in NinjaOne. Returns the status names and IDs. Use this to discover custom statuses beyond the standard OPEN/IN_PROGRESS/WAITING/CLOSED.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "ninjaone_tickets_list_attributes",
      description:
        "List all ticket attributes (custom fields) configured in NinjaOne. Returns attribute names, types, and possible values. Use this to understand what custom data can be set on tickets.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },

    // ── Contacts & Users ───────────────────────────────────────
    {
      name: "ninjaone_tickets_list_contacts",
      description:
        "List contacts available for ticketing. Returns contact information that can be used as requesters or for ticket assignment. Use this to find contact IDs for ticket creation or updates.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "ninjaone_tickets_list_users",
      description:
        "List users by type for ticket assignment. Returns technicians and other users who can be assigned to tickets. Use this to find valid assignee_id values for ticket assignment.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },

    // ── Summary ────────────────────────────────────────────────
    {
      name: "ninjaone_tickets_summary",
      description:
        "Get a summary of tickets grouped by status and/or priority. Useful for quick dashboards, triage overviews, and understanding workload distribution. Can be scoped to a specific organization or board.",
      inputSchema: {
        type: "object" as const,
        properties: {
          organization_id: {
            type: "number",
            description: "Scope summary to a specific organization ID.",
          },
          board_id: {
            type: "number",
            description: "Scope summary to a specific board ID.",
          },
          group_by: {
            type: "string",
            enum: ["status", "priority", "type", "all"],
            description:
              "How to group ticket counts. 'all' groups by status, priority, and type simultaneously. Default: 'status'.",
          },
        },
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
    // ── Core CRUD ──────────────────────────────────────────────

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
        status: args.status as TicketStatus | undefined,
        organizationId: args.organization_id as number | undefined,
        deviceId: args.device_id as number | undefined,
        boardId: args.board_id as number | undefined,
        pageSize: limit,
      });
      logger.debug("API response: tickets.list", { count: response.tickets?.length });

      const tickets = response.tickets || [];
      const summary = `Found ${tickets.length} ticket(s)${args.status ? ` with status ${args.status}` : ""}${args.organization_id ? ` for organization ${args.organization_id}` : ""}${response.cursor ? `. More results available (use cursor: "${response.cursor}")` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ summary, ...response }, null, 2),
          },
        ],
      };
    }

    case "ninjaone_tickets_get": {
      const ticketId = resolveTicketId(args);
      if (!ticketId) {
        return errorResult("ticket_id is required. Provide the numeric ID of the ticket to retrieve.");
      }
      logger.info("API call: tickets.get", { ticketId });
      const ticket = await client.tickets.get(ticketId);
      logger.debug("API response: tickets.get", { ticket });

      return {
        content: [{ type: "text", text: JSON.stringify(ticket, null, 2) }],
      };
    }

    case "ninjaone_tickets_create": {
      const subject = args.subject as string | undefined;
      const organizationId = args.organization_id as number | undefined;

      if (!subject || !subject.trim()) {
        return errorResult("subject is required. Provide a concise summary of the issue or request.");
      }
      if (!organizationId) {
        return errorResult(
          "organization_id is required. Use ninjaone_organizations_list (in the organizations domain) to find the correct organization ID."
        );
      }

      logger.info("API call: tickets.create", { subject, organizationId });

      const createParams: Record<string, unknown> = {
        subject: subject.trim(),
        description: args.description as string | undefined,
        organizationId,
        deviceId: args.device_id as number | undefined,
        priority: args.priority as TicketPriority | undefined,
        type: args.type as TicketType | undefined,
      };

      // Add optional fields if provided
      if (args.severity) createParams.severity = args.severity;
      if (args.tags) createParams.tags = args.tags;
      if (args.board_id) createParams.boardId = args.board_id;
      if (args.ticket_form_id) createParams.ticketFormId = args.ticket_form_id;

      const ticket = await client.tickets.create(createParams as Parameters<typeof client.tickets.create>[0]);
      logger.debug("API response: tickets.create", { ticket });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { message: "Ticket created successfully", ticket },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_tickets_update": {
      const ticketId = resolveTicketId(args);
      if (!ticketId) {
        return errorResult("ticket_id is required. Provide the numeric ID of the ticket to update.");
      }

      // Build update payload with only provided fields
      const updateParams: Record<string, unknown> = {};
      if (args.subject !== undefined) updateParams.subject = args.subject;
      if (args.description !== undefined) updateParams.description = args.description;
      if (args.status !== undefined) updateParams.status = args.status;
      if (args.priority !== undefined) updateParams.priority = args.priority;
      if (args.assignee_id !== undefined) updateParams.assigneeUid = String(args.assignee_id);
      if (args.severity !== undefined) updateParams.severity = args.severity;
      if (args.type !== undefined) updateParams.type = args.type;
      if (args.tags !== undefined) updateParams.tags = args.tags;

      const fieldsUpdated = Object.keys(updateParams);
      if (fieldsUpdated.length === 0) {
        return errorResult(
          "No fields to update. Provide at least one of: subject, description, status, priority, severity, type, assignee_id, tags."
        );
      }

      logger.info("API call: tickets.update", { ticketId, fieldsUpdated });
      const ticket = await client.tickets.update(ticketId, updateParams as Parameters<typeof client.tickets.update>[1]);
      logger.debug("API response: tickets.update", { ticket });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { message: `Ticket ${ticketId} updated (fields: ${fieldsUpdated.join(", ")})`, ticket },
              null,
              2
            ),
          },
        ],
      };
    }

    // ── Comments & Log Entries ──────────────────────────────────

    case "ninjaone_tickets_add_comment": {
      const ticketId = resolveTicketId(args);
      if (!ticketId) {
        return errorResult("ticket_id is required. Provide the numeric ID of the ticket to comment on.");
      }

      const body = args.body as string | undefined;
      if (!body || !body.trim()) {
        return errorResult("body is required. Provide the comment text.");
      }

      const isPublic = args.public !== false;
      logger.info("API call: tickets.addComment", { ticketId, public: isPublic });
      const comment = await client.tickets.addComment(ticketId, {
        body: body.trim(),
        internal: !isPublic,
      });
      logger.debug("API response: tickets.addComment", { comment });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `${isPublic ? "Public" : "Internal"} comment added to ticket ${ticketId}`,
                comment,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_tickets_log_entries":
    case "ninjaone_tickets_comments": {
      const ticketId = resolveTicketId(args);
      if (!ticketId) {
        return errorResult("ticket_id is required. Provide the numeric ID of the ticket.");
      }

      const typeFilter = args.type as string | undefined;
      logger.info("API call: tickets.getComments", { ticketId, type: typeFilter });

      // Try passing type filter to the client; fall back to client-side filtering
      let entries;
      try {
        entries = await client.tickets.getComments(ticketId, ...(typeFilter ? [{ type: typeFilter }] : []));
      } catch {
        entries = await client.tickets.getComments(ticketId);
        if (typeFilter && Array.isArray(entries)) {
          entries = entries.filter(
            (entry: Record<string, unknown>) => entry.type === typeFilter
          );
        }
      }
      logger.debug("API response: tickets.getComments", { entries });

      const count = Array.isArray(entries) ? entries.length : 0;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `${count} log entr${count === 1 ? "y" : "ies"} for ticket ${ticketId}${typeFilter ? ` (type: ${typeFilter})` : ""}`,
                entries,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // ── Boards ─────────────────────────────────────────────────

    case "ninjaone_tickets_list_boards": {
      logger.info("API call: tickets.getBoards");
      const boards = await safeClientCall(
        () => (client.tickets as Record<string, unknown>).getBoards
          ? ((client.tickets as Record<string, CallableFunction>).getBoards() as Promise<unknown>)
          : (client.tickets as Record<string, CallableFunction>).listBoards() as Promise<unknown>,
        "listBoards"
      );
      logger.debug("API response: tickets.getBoards", { boards });

      const boardList = Array.isArray(boards) ? boards : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Found ${boardList.length} ticket board(s)`,
                boards,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_tickets_board_tickets": {
      const boardId = (args.board_id ?? args.boardId) as number | undefined;
      if (!boardId) {
        return errorResult("board_id is required. Use ninjaone_tickets_list_boards to find board IDs.");
      }

      const sortBy = (args.sort_by as string) || "lastUpdated";
      const sortDirection = (args.sort_direction as string) || "DESC";
      const pageSize = (args.page_size as number) || 50;
      const lastCursorId = args.last_cursor_id as string | undefined;

      logger.info("API call: tickets.getTicketsByBoard", { boardId, sortBy, sortDirection, pageSize });

      const ticketsClient = client.tickets as Record<string, CallableFunction>;
      const getByBoard = ticketsClient.getTicketsByBoard || ticketsClient.listByBoard || ticketsClient.boardTickets;
      const response = await safeClientCall(
        () => getByBoard.call(client.tickets, boardId, {
          sortBy: [{ field: sortBy, direction: sortDirection }],
          pageSize,
          lastCursorId,
        }) as Promise<unknown>,
        "getTicketsByBoard"
      );
      logger.debug("API response: tickets.getTicketsByBoard", { response });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }

    // ── Forms & Configuration ──────────────────────────────────

    case "ninjaone_tickets_list_forms": {
      logger.info("API call: tickets.getForms");
      const ticketsClient = client.tickets as Record<string, CallableFunction>;
      const getForms = ticketsClient.getForms || ticketsClient.listForms;
      const forms = await safeClientCall(
        () => getForms.call(client.tickets) as Promise<unknown>,
        "listForms"
      );
      logger.debug("API response: tickets.getForms", { forms });

      const formList = Array.isArray(forms) ? forms : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Found ${formList.length} ticket form(s)`,
                forms,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_tickets_get_form": {
      const formId = (args.form_id ?? args.formId) as number | undefined;
      if (!formId) {
        return errorResult("form_id is required. Use ninjaone_tickets_list_forms to find form IDs.");
      }

      logger.info("API call: tickets.getForm", { formId });
      const ticketsClient = client.tickets as Record<string, CallableFunction>;
      const getForm = ticketsClient.getForm || ticketsClient.getTicketForm;
      const form = await safeClientCall(
        () => getForm.call(client.tickets, formId) as Promise<unknown>,
        "getForm"
      );
      logger.debug("API response: tickets.getForm", { form });

      return {
        content: [{ type: "text", text: JSON.stringify(form, null, 2) }],
      };
    }

    case "ninjaone_tickets_list_statuses": {
      logger.info("API call: tickets.getStatuses");
      const ticketsClient = client.tickets as Record<string, CallableFunction>;
      const getStatuses = ticketsClient.getStatuses || ticketsClient.listStatuses;
      const statuses = await safeClientCall(
        () => getStatuses.call(client.tickets) as Promise<unknown>,
        "getStatuses"
      );
      logger.debug("API response: tickets.getStatuses", { statuses });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Retrieved ticket statuses`,
                statuses,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_tickets_list_attributes": {
      logger.info("API call: tickets.getAttributes");
      const ticketsClient = client.tickets as Record<string, CallableFunction>;
      const getAttributes = ticketsClient.getAttributes || ticketsClient.listAttributes;
      const attributes = await safeClientCall(
        () => getAttributes.call(client.tickets) as Promise<unknown>,
        "getAttributes"
      );
      logger.debug("API response: tickets.getAttributes", { attributes });

      const attrList = Array.isArray(attributes) ? attributes : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Found ${attrList.length} ticket attribute(s)`,
                attributes,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // ── Contacts & Users ───────────────────────────────────────

    case "ninjaone_tickets_list_contacts": {
      logger.info("API call: tickets.getContacts");
      const ticketsClient = client.tickets as Record<string, CallableFunction>;
      const getContacts = ticketsClient.getContacts || ticketsClient.listContacts;
      const contacts = await safeClientCall(
        () => getContacts.call(client.tickets) as Promise<unknown>,
        "getContacts"
      );
      logger.debug("API response: tickets.getContacts", { contacts });

      const contactList = Array.isArray(contacts) ? contacts : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Found ${contactList.length} contact(s)`,
                contacts,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "ninjaone_tickets_list_users": {
      logger.info("API call: tickets.getUsers");
      const ticketsClient = client.tickets as Record<string, CallableFunction>;
      const getUsers = ticketsClient.getUsers || ticketsClient.listUsers || ticketsClient.getAppUserContacts;
      const users = await safeClientCall(
        () => getUsers.call(client.tickets) as Promise<unknown>,
        "getUsers"
      );
      logger.debug("API response: tickets.getUsers", { users });

      const userList = Array.isArray(users) ? users : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Found ${userList.length} user(s) available for ticket assignment`,
                users,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // ── Summary ────────────────────────────────────────────────

    case "ninjaone_tickets_summary": {
      const groupBy = (args.group_by as string) || "status";

      logger.info("API call: tickets.list (for summary)", {
        organizationId: args.organization_id,
        boardId: args.board_id,
        groupBy,
      });

      const response = await client.tickets.list({
        organizationId: args.organization_id as number | undefined,
        boardId: args.board_id as number | undefined,
        pageSize: 200,
      });

      const tickets = response.tickets || [];
      const summary: Record<string, Record<string, number>> = {};

      for (const ticket of tickets) {
        const t = ticket as Record<string, unknown>;

        if (groupBy === "status" || groupBy === "all") {
          const status = (t.status as string) || "UNKNOWN";
          summary.byStatus = summary.byStatus || {};
          summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
        }
        if (groupBy === "priority" || groupBy === "all") {
          const priority = (t.priority as string) || "UNKNOWN";
          summary.byPriority = summary.byPriority || {};
          summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;
        }
        if (groupBy === "type" || groupBy === "all") {
          const type = (t.type as string) || "UNKNOWN";
          summary.byType = summary.byType || {};
          summary.byType[type] = (summary.byType[type] || 0) + 1;
        }
      }

      logger.debug("API response: tickets summary", { summary });

      const scope = [
        args.organization_id ? `organization ${args.organization_id}` : null,
        args.board_id ? `board ${args.board_id}` : null,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Ticket summary${scope ? ` for ${scope}` : ""}: ${tickets.length} total ticket(s)`,
                total: tickets.length,
                hasMore: !!response.cursor,
                ...summary,
              },
              null,
              2
            ),
          },
        ],
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
