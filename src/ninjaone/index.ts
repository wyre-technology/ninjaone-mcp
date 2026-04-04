/**
 * NinjaOne API client — barrel export
 *
 * Drop-in replacement for @wyre-technology/node-ninjaone.
 * All types and the client class are re-exported from here.
 */

export { NinjaOneClient } from "./client.js";
export { NinjaOneHttp } from "./http.js";

export type {
  // Ticket enums
  TicketStatus,
  TicketPriority,
  TicketType,

  // Alert enums
  AlertSeverity,
  AlertSourceType,

  // Config
  NinjaOneClientConfig,

  // Request types
  TicketListParams,
  TicketCreateParams,
  TicketUpdateParams,
  TicketCommentParams,
  TicketBoardSearchParams,
  DeviceListParams,
  DeviceActivityParams,
  OrganizationListParams,
  OrganizationCreateParams,
  AlertListParams,

  // Generic
  ApiRecord,
  OAuthTokenResponse,
} from "./types.js";
