import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractEmailVariables, renderEmailTemplate, validateEmailTemplateVariables } from "../../../src/common/email/email-template.js";

describe("Managed email templates", () => {
  it("extracts and validates only declared allow-listed placeholders", () => {
    assert.deepEqual(extractEmailVariables("Hello {{userName}}", "Code {{ otp }}"), ["otp", "userName"]);
    assert.deepEqual(validateEmailTemplateVariables({ subject: "Hello {{userName}}", htmlBody: "<b>{{otp}}</b>", textBody: "{{otp}}", allowedVariables: ["userName", "otp"] }), ["otp", "userName"]);
    assert.throws(() => validateEmailTemplateVariables({ subject: "{{userName}}", htmlBody: "{{serverSecret}}", textBody: "hello", allowedVariables: ["userName"] }), /undeclared variables/);
    assert.throws(() => validateEmailTemplateVariables({ subject: "hello", htmlBody: "hello", textBody: "hello", allowedVariables: ["constructor"] }), /Unsupported email variables/);
  });

  it("HTML-escapes recipient values without executing arbitrary expressions", () => {
    const result = renderEmailTemplate({ subject: "Hello {{userName}}", htmlBody: "<p>{{userName}}</p>{{missing}}", textBody: "Hello {{userName}}", allowedVariables: ["userName"], values: { userName: "<script>alert(1)</script>" } });
    assert.equal(result.html, "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
    assert.equal(result.text, "Hello <script>alert(1)</script>");
  });
});
