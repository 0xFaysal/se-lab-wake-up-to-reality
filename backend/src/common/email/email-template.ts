const PLACEHOLDER_PATTERN = /{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g;

export const SAFE_EMAIL_VARIABLES = [
  "userName",
  "otp",
  "expiresIn",
  "setupUrl",
  "resetUrl",
  "propertyName",
  "bookingCode",
  "amount",
  "status",
  "reason",
  "campaignTitle",
] as const;

const safeVariableSet = new Set<string>(SAFE_EMAIL_VARIABLES);

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export function extractEmailVariables(
  ...values: Array<string | null | undefined>
): string[] {
  const variables = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
      const variable = match[1];
      if (variable) variables.add(variable);
    }
  }
  return [...variables].sort();
}

export function validateEmailTemplateVariables(input: {
  subject: string;
  preheader?: string | null;
  htmlBody: string;
  textBody: string;
  allowedVariables: string[];
}): string[] {
  const declared = new Set(input.allowedVariables);
  const unknownDeclarations = input.allowedVariables.filter(
    (variable) => !safeVariableSet.has(variable),
  );
  if (unknownDeclarations.length) {
    throw new Error(
      `Unsupported email variables: ${unknownDeclarations.join(", ")}`,
    );
  }
  const used = extractEmailVariables(
    input.subject,
    input.preheader,
    input.htmlBody,
    input.textBody,
  );
  const undeclared = used.filter((variable) => !declared.has(variable));
  if (undeclared.length) {
    throw new Error(
      `Template uses undeclared variables: ${undeclared.join(", ")}`,
    );
  }
  return used;
}

function renderValue(
  source: string,
  values: Record<string, string>,
  allowedVariables: string[],
  html: boolean,
): string {
  const allowed = new Set(allowedVariables);
  return source.replace(
    PLACEHOLDER_PATTERN,
    (_placeholder, variable: string) => {
      if (!allowed.has(variable)) return "";
      const value = values[variable] ?? "";
      return html ? escapeHtml(value) : value;
    },
  );
}

export function renderEmailTemplate(input: {
  subject: string;
  htmlBody: string;
  textBody: string;
  allowedVariables: string[];
  values: Record<string, string>;
}) {
  return {
    subject: renderValue(
      input.subject,
      input.values,
      input.allowedVariables,
      false,
    ),
    html: renderValue(
      input.htmlBody,
      input.values,
      input.allowedVariables,
      true,
    ),
    text: renderValue(
      input.textBody,
      input.values,
      input.allowedVariables,
      false,
    ),
  };
}
