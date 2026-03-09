/**
 * Elicitation helpers for MCP tool handlers.
 * All functions gracefully return null if the client doesn't support elicitation.
 */
import { getServerRef } from "./server-ref.js";

export interface ElicitOption {
  value: string;
  label: string;
}

/**
 * Ask the user to select from a list of options.
 */
export async function elicitSelection(
  message: string,
  fieldName: string,
  options: ElicitOption[]
): Promise<string | null> {
  const server = getServerRef();
  if (!server) return null;

  try {
    const result = await server.elicitInput({
      message,
      requestedSchema: {
        type: "object" as const,
        properties: {
          [fieldName]: {
            type: "string" as const,
            title: fieldName,
            description: `Select a ${fieldName}`,
            enum: options.map((o) => o.value),
            enumNames: options.map((o) => o.label),
          },
        },
        required: [fieldName],
      },
    });

    if (result.action === "accept" && result.content) {
      return result.content[fieldName] as string;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Ask the user for a free-text input.
 */
export async function elicitText(
  message: string,
  fieldName: string,
  description?: string
): Promise<string | null> {
  const server = getServerRef();
  if (!server) return null;

  try {
    const result = await server.elicitInput({
      message,
      requestedSchema: {
        type: "object" as const,
        properties: {
          [fieldName]: {
            type: "string" as const,
            title: fieldName,
            description: description ?? `Enter ${fieldName}`,
          },
        },
        required: [fieldName],
      },
    });

    if (result.action === "accept" && result.content) {
      return result.content[fieldName] as string;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Ask the user to confirm an action.
 */
export async function elicitConfirmation(
  message: string
): Promise<boolean | null> {
  const server = getServerRef();
  if (!server) return null;

  try {
    const result = await server.elicitInput({
      message,
      requestedSchema: {
        type: "object" as const,
        properties: {
          confirm: {
            type: "boolean" as const,
            title: "Confirm",
            description: "Confirm this action",
          },
        },
        required: ["confirm"],
      },
    });

    if (result.action === "accept" && result.content) {
      return result.content.confirm as boolean;
    }
    return null;
  } catch {
    return null;
  }
}
