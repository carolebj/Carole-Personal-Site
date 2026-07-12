// @ts-nocheck
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { afterEach, test } from "node:test";
import { Webhook } from "standardwebhooks";
import handler from "../api/resend-inbound.js";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.RESEND_INBOUND_API_KEY;
const originalWebhookSecret = process.env.RESEND_WEBHOOK_SECRET;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.RESEND_INBOUND_API_KEY = originalApiKey;
  process.env.RESEND_WEBHOOK_SECRET = originalWebhookSecret;
});

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    json(body) { this.body = body; return this; },
  };
}

function signedRequest(event, secret = "whsec_dGVzdC1zZWNyZXQ=") { // secret-scan:allow test fixture
  const payload = JSON.stringify(event);
  const webhookId = "msg_test";
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(webhookId, timestamp, payload);
  const request = Readable.from([payload]);
  request.method = "POST";
  request.headers = {
    "svix-id": webhookId,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature": signature,
  };
  return request;
}

test("inbound webhook verifies the signature and forwards only the contact address", async () => {
  process.env.RESEND_INBOUND_API_KEY = "server-test-key";
  process.env.RESEND_WEBHOOK_SECRET = "whsec_dGVzdC1zZWNyZXQ=";
  const outbound = [];
  globalThis.fetch = async (url, options) => {
    outbound.push({ url: String(url), options });
    if (String(url).endsWith("/emails/receiving/received-email-id")) {
      return new Response(JSON.stringify({
        object: "email",
        id: "received-email-id",
        to: ["contact@carolebj.com"],
        from: "Awa <awa@example.com>",
        created_at: new Date().toISOString(),
        subject: "Bonjour",
        html: "<p>Bonjour</p>",
        text: "Bonjour",
        headers: {},
        bcc: [],
        cc: [],
        reply_to: [],
        received_for: ["contact@carolebj.com"],
        message_id: "<message@example.com>",
        attachments: [],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ id: "forwarded-email-id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = responseRecorder();
  await handler(signedRequest({
    type: "email.received",
    created_at: new Date().toISOString(),
    data: {
      email_id: "received-email-id",
      from: "Awa <awa@example.com>",
      to: ["contact@carolebj.com"],
      bcc: [],
      cc: [],
      message_id: "<message@example.com>",
      subject: "Bonjour",
      attachments: [],
      created_at: new Date().toISOString(),
    },
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.match(outbound[0].url, /emails\/receiving\/received-email-id$/);
  assert.match(outbound[1].url, /emails$/);
  const sendHeaders = new Headers(outbound[1].options.headers);
  assert.equal(sendHeaders.get("Authorization"), "Bearer server-test-key");
  assert.equal(sendHeaders.get("Idempotency-Key"), "inbound-forward/received-email-id");
  assert.deepEqual(JSON.parse(outbound[1].options.body), {
    to: "caroletonoukouen@gmail.com",
    from: "Carole Tonoukouen <contact@carolebj.com>",
    reply_to: "Awa <awa@example.com>",
    subject: "Bonjour",
    html: "<p>Bonjour</p>",
    text: "Bonjour",
  });
});

test("inbound webhook rejects unsigned payloads", async () => {
  process.env.RESEND_INBOUND_API_KEY = "server-test-key";
  process.env.RESEND_WEBHOOK_SECRET = "whsec_dGVzdC1zZWNyZXQ=";
  const request = Readable.from(["{}"]);
  request.method = "POST";
  request.headers = {};
  const response = responseRecorder();

  await handler(request, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "missing_signature_headers");
});
