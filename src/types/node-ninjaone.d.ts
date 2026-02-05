/**
 * Type declarations for @asachs01/node-ninjaone
 *
 * These types define the expected interface for the NinjaOne client library.
 * The actual implementation will be provided by the @asachs01/node-ninjaone package.
 */

declare module "@asachs01/node-ninjaone" {
  export interface NinjaOneClientConfig {
    clientId: string;
    clientSecret: string;
    baseUrl?: string;
  }

  export interface PaginatedResponse {
    cursor?: string;
  }

  export interface DevicesListParams {
    organizationId?: number;
    deviceClass?: string;
    online?: boolean;
    pageSize?: number;
    cursor?: string;
  }

  export interface DevicesListResponse extends PaginatedResponse {
    devices: Device[];
  }

  export interface Device {
    id: number;
    systemName: string;
    organizationId: number;
    online?: boolean;
    [key: string]: unknown;
  }

  export interface RebootParams {
    reason?: string;
  }

  export interface ServicesParams {
    state?: string;
  }

  export interface AlertsParams {
    severity?: string;
  }

  export interface ActivitiesParams {
    activityType?: string;
    pageSize?: number;
  }

  export interface OrganizationsListParams {
    pageSize?: number;
    cursor?: string;
  }

  export interface OrganizationsListResponse extends PaginatedResponse {
    organizations: Organization[];
  }

  export interface Organization {
    id: number;
    name: string;
    description?: string;
    [key: string]: unknown;
  }

  export interface OrganizationCreateParams {
    name: string;
    description?: string;
    nodeApprovalMode?: string;
    policyId?: number;
  }

  export interface OrganizationDevicesParams {
    deviceClass?: string;
    pageSize?: number;
  }

  export interface AlertsListParams {
    severity?: string;
    organizationId?: number;
    deviceId?: number;
    sourceType?: string;
    pageSize?: number;
    cursor?: string;
  }

  export interface AlertsListResponse extends PaginatedResponse {
    alerts: Alert[];
  }

  export interface Alert {
    uid: string;
    message: string;
    severity: string;
    [key: string]: unknown;
  }

  export interface AlertsResetAllParams {
    deviceId?: number;
    organizationId?: number;
    severity?: string;
  }

  export interface AlertsSummaryParams {
    groupBy?: string;
  }

  export interface TicketsListParams {
    status?: string;
    organizationId?: number;
    deviceId?: number;
    boardId?: number;
    pageSize?: number;
    cursor?: string;
  }

  export interface TicketsListResponse extends PaginatedResponse {
    tickets: Ticket[];
  }

  export interface Ticket {
    id: number;
    subject: string;
    description?: string;
    status: string;
    [key: string]: unknown;
  }

  export interface TicketCreateParams {
    subject: string;
    description?: string;
    organizationId: number;
    deviceId?: number;
    boardId?: number;
    priority?: string;
    type?: string;
  }

  export interface TicketUpdateParams {
    subject?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: number;
  }

  export interface TicketCommentParams {
    body: string;
    public?: boolean;
  }

  export interface DevicesResource {
    list(params?: DevicesListParams): Promise<DevicesListResponse>;
    get(deviceId: number): Promise<Device>;
    reboot(deviceId: number, params?: RebootParams): Promise<unknown>;
    getServices(deviceId: number, params?: ServicesParams): Promise<unknown>;
    getAlerts(deviceId: number, params?: AlertsParams): Promise<unknown>;
    getActivities(deviceId: number, params?: ActivitiesParams): Promise<unknown>;
  }

  export interface OrganizationsResource {
    list(params?: OrganizationsListParams): Promise<OrganizationsListResponse>;
    get(organizationId: number): Promise<Organization>;
    create(params: OrganizationCreateParams): Promise<Organization>;
    getLocations(organizationId: number): Promise<unknown>;
    getDevices(organizationId: number, params?: OrganizationDevicesParams): Promise<unknown>;
  }

  export interface AlertsResource {
    list(params?: AlertsListParams): Promise<AlertsListResponse>;
    reset(alertUid: string): Promise<unknown>;
    resetAll(params: AlertsResetAllParams): Promise<unknown>;
    getSummary(params?: AlertsSummaryParams): Promise<unknown>;
  }

  export interface TicketsResource {
    list(params?: TicketsListParams): Promise<TicketsListResponse>;
    get(ticketId: number): Promise<Ticket>;
    create(params: TicketCreateParams): Promise<Ticket>;
    update(ticketId: number, params: TicketUpdateParams): Promise<Ticket>;
    addComment(ticketId: number, params: TicketCommentParams): Promise<unknown>;
    getComments(ticketId: number): Promise<unknown>;
  }

  export class NinjaOneClient {
    constructor(config: NinjaOneClientConfig);
    devices: DevicesResource;
    organizations: OrganizationsResource;
    alerts: AlertsResource;
    tickets: TicketsResource;
  }
}
