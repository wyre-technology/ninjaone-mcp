# NinjaOne MCP Server

A Model Context Protocol (MCP) server for interacting with NinjaOne, featuring a decision tree architecture for efficient tool loading.


## One-Click Deployment

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/wyre-technology/ninjaone-mcp/tree/main)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wyre-technology/ninjaone-mcp)

## Architecture

This MCP server uses a **hierarchical tool loading approach** instead of exposing all tools upfront:

1. **Navigation Phase**: Initially exposes only a navigation tool (`ninjaone_navigate`)
2. **Domain Selection**: User selects a domain (devices, organizations, alerts, tickets)
3. **Domain Tools**: Server exposes domain-specific tools after selection
4. **Lazy Loading**: Domain handlers and the NinjaOne client are loaded on-demand

This architecture provides:
- Reduced cognitive load (fewer tools to choose from)
- Faster initial load times
- Better organization of related operations
- Clear navigation state

## Installation

```bash
npm install @wyre-technology/ninjaone-mcp
```

## Configuration

Set the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NINJAONE_CLIENT_ID` | Yes | OAuth 2.0 Client ID |
| `NINJAONE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret |
| `NINJAONE_REGION` | No | Region: `us` (default), `eu`, or `oc` |

### NinjaOne API Regions

| Region | Base URL |
|--------|----------|
| `us` | `https://app.ninjarmm.com` |
| `eu` | `https://eu.ninjarmm.com` |
| `oc` | `https://oc.ninjarmm.com` |

## Usage

### Running Standalone

```bash
# Set credentials
export NINJAONE_CLIENT_ID="your-client-id"
export NINJAONE_CLIENT_SECRET="your-client-secret"
export NINJAONE_REGION="us"

# Run the server
npx @wyre-technology/ninjaone-mcp
```

### Claude Desktop Configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ninjaone": {
      "command": "npx",
      "args": ["@wyre-technology/ninjaone-mcp"],
      "env": {
        "NINJAONE_CLIENT_ID": "your-client-id",
        "NINJAONE_CLIENT_SECRET": "your-client-secret",
        "NINJAONE_REGION": "us"
      }
    }
  }
}
```

### Docker

```bash
docker build -t ninjaone-mcp .
docker run -e NINJAONE_CLIENT_ID=xxx -e NINJAONE_CLIENT_SECRET=xxx -e NINJAONE_REGION=us ninjaone-mcp
```

## Available Domains

### Devices
Manage endpoints, reboot devices, view services and alerts.

Tools:
- `ninjaone_devices_list` - List devices with filters
- `ninjaone_devices_get` - Get device details
- `ninjaone_devices_reboot` - Schedule a device reboot
- `ninjaone_devices_services` - List Windows services on a device
- `ninjaone_devices_alerts` - Get device-specific alerts
- `ninjaone_devices_activities` - View device activity log

### Organizations
Manage customer organizations and their resources.

Tools:
- `ninjaone_organizations_list` - List organizations
- `ninjaone_organizations_get` - Get organization details
- `ninjaone_organizations_create` - Create a new organization
- `ninjaone_organizations_locations` - List organization locations
- `ninjaone_organizations_devices` - List devices for an organization

### Alerts
View and manage alerts across all devices.

Tools:
- `ninjaone_alerts_list` - List alerts with filters
- `ninjaone_alerts_reset` - Reset/dismiss a single alert
- `ninjaone_alerts_reset_all` - Reset all alerts for a device or organization
- `ninjaone_alerts_summary` - Get alert count summary

### Tickets
Manage service tickets.

Tools:
- `ninjaone_tickets_list` - List tickets with filters
- `ninjaone_tickets_get` - Get ticket details
- `ninjaone_tickets_create` - Create a new ticket
- `ninjaone_tickets_update` - Update an existing ticket
- `ninjaone_tickets_add_comment` - Add a comment to a ticket
- `ninjaone_tickets_comments` - Get ticket comments

## Navigation Tools

Always available:
- `ninjaone_navigate` - Select a domain to work with
- `ninjaone_status` - Show current state and credential status
- `ninjaone_back` - Return to main menu (when in a domain)

## Example Workflow

```
User: Check my devices
Claude: [calls ninjaone_navigate with domain="devices"]
       -> Navigated to devices domain. Available tools: ...

User: List all Windows servers
Claude: [calls ninjaone_devices_list with device_class="WINDOWS_SERVER"]
       -> [device list results]

User: Now show me alerts
Claude: [calls ninjaone_back]
       -> Navigated back to main menu.
       [calls ninjaone_navigate with domain="alerts"]
       -> Navigated to alerts domain.
```

## Authentication

NinjaOne uses OAuth 2.0 for authentication. You need to:

1. Log in to your NinjaOne dashboard
2. Go to Administration > Apps > API
3. Create a new API application
4. Note the Client ID and Client Secret
5. Configure the environment variables

The client library handles token refresh automatically.

## License

Apache-2.0
