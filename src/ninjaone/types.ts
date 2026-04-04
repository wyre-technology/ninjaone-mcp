/**
 * NinjaOne API type definitions
 *
 * These types mirror the NinjaOne REST API v2 data model.
 * Only fields actively used by the MCP domain handlers are typed;
 * additional fields returned by the API are preserved via permissive typing.
 */

// ── Ticket enums ───────────────────────────────────────────────

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type TicketType =
  | "PROBLEM"
  | "QUESTION"
  | "INCIDENT"
  | "TASK"
  | "ALERT";

// ── Alert enums ────────────────────────────────────────────────

export type AlertSeverity =
  | "CRITICAL"
  | "MAJOR"
  | "MINOR"
  | "NONE";

export type AlertSourceType = string;

// ── Client configuration ───────────────────────────────────────

export interface NinjaOneClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

// ── OAuth2 ─────────────────────────────────────────────────────

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// ── Generic API types ──────────────────────────────────────────

/** Permissive record — the API may return more fields than we type. */
export type ApiRecord = Record<string, unknown>;

export interface PaginatedResponse<T = ApiRecord> {
  data: T[];
  cursor?: string;
  totalCount?: number;
}

// ── Ticket request types ───────────────────────────────────────

export interface TicketListParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  organizationId?: number;
  deviceId?: number;
  boardId?: number;
  pageSize?: number;
  cursor?: string;
}

export interface TicketCreateParams {
  subject: string;
  description?: string;
  organizationId: number;
  deviceId?: number;
  priority?: TicketPriority;
  type?: TicketType;
  tags?: string[];
  boardId?: number;
  ticketFormId?: number;
  requesterEmail?: string;
  requesterName?: string;
  dueDate?: number;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TicketUpdateParams {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  type?: TicketType;
  assigneeUid?: string;
  tags?: string[];
  dueDate?: number;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TicketCommentParams {
  body: string;
  internal?: boolean;
}

export interface TicketBoardSearchParams {
  sortBy?: Array<{ field: string; direction: string }>;
  pageSize?: number;
  lastCursorId?: string;
}

// ── Device request types ───────────────────────────────────────

export interface DeviceListParams {
  organizationId?: number;
  pageSize?: number;
  cursor?: string;
}

export interface DeviceActivityParams {
  pageSize?: number;
}

// ── Organization request types ─────────────────────────────────

export interface OrganizationListParams {
  pageSize?: number;
  cursor?: string;
}

export interface OrganizationCreateParams {
  name: string;
  description?: string;
  nodeApprovalMode?: string;
  policyId?: number;
  [key: string]: unknown;
}

// ── Alert request types ────────────────────────────────────────

export interface AlertListParams {
  severity?: AlertSeverity;
  organizationId?: number;
  deviceId?: number;
  sourceType?: AlertSourceType;
  pageSize?: number;
  cursor?: string;
}
