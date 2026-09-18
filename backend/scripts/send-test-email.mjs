import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

const recipient = "faysalfahim3@gmail.com";
const requiredKeys = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USERNAME",
  "EMAIL_PASSWORD",
];
const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim());

async function main() {
  if (missingKeys.length > 0) {
    console.error(`Missing SMTP configuration: ${missingKeys.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const host = process.env.EMAIL_HOST.trim();
  const port = Number(process.env.EMAIL_PORT);
  const username = process.env.EMAIL_USERNAME.trim();
  const password = host.toLowerCase().includes("gmail")
    ? process.env.EMAIL_PASSWORD.replace(/\s/g, "")
    : process.env.EMAIL_PASSWORD;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("EMAIL_PORT must be an integer between 1 and 65535.");
    process.exitCode = 1;
    return;
  }

  const secure = port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    pool: true,
    maxConnections: 1,
    maxMessages: 1,
    dnsTimeout: 5_000,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: { user: username, pass: password },
    tls: { minVersion: "TLSv1.2", servername: host },
  });

  const startedAt = Date.now();
  // Also bound DNS fallback and pool waits, not just socket inactivity.
  const deadline = setTimeout(() => {
    console.error(
      "Email test timed out after 60 seconds. Delivery is uncertain; check your inbox/spam before retrying.",
    );
    transporter.close();
    process.exit(1);
  }, 60_000);

  try {
    console.log(`Sending one test email to ${recipient} using ${host}:${port}...`);
    const timestamp = new Date().toISOString();
    const info = await transporter.sendMail({
      from: { name: "ParkEase BD", address: username },
      to: recipient,
      subject: `ParkEase BD SMTP test - ${timestamp}`,
      text: [
        "Hello Faysal,",
        "",
        "This is a test email from the ParkEase BD backend.",
        "Receiving this email confirms delivery to this mailbox for this test.",
        "This is not an OTP and does not change your account verification status.",
        "",
        `Test requested at: ${timestamp}`,
      ].join("\n"),
    });

    if (!info.accepted?.length || info.rejected?.length) {
      console.error("The SMTP server did not accept the test recipient.");
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify({
      status: "SMTP_ACCEPTED",
      recipient,
      messageId: info.messageId,
      durationMs: Date.now() - startedAt,
    }, null, 2));
    console.log("Check Inbox and Spam. SMTP acceptance alone does not guarantee inbox delivery.");
  } catch (error) {
    // Do not print raw SMTP errors, credentials, or message content.
    console.error(JSON.stringify({
      status: "EMAIL_TEST_FAILED",
      smtpErrorCode: error?.code,
      smtpCommand: error?.command,
      smtpResponseCode: error?.responseCode,
      durationMs: Date.now() - startedAt,
    }, null, 2));
    if (error?.code === "EAUTH") {
      console.error("Check EMAIL_USERNAME and EMAIL_PASSWORD (Gmail App Password).");
    } else {
      console.error("Check SMTP connectivity and configuration. Check your mailbox before retrying; no automatic retry was made.");
    }
    process.exitCode = 1;
  } finally {
    clearTimeout(deadline);
    transporter.close();
  }
}

await main();
