import { Resend } from "resend";

const INBOUND_ADDRESS = "contact@carolebj.com";
const GMAIL_ADDRESS = "caroletonoukouen@gmail.com";
const FORWARD_FROM = "Carole Tonoukouen <contact@carolebj.com>";
const MAX_WEBHOOK_BYTES = 256_000;
const MAX_ATTACHMENT_BYTES = 30_000_000;

export const config = {
  api: {
    bodyParser: false,
  },
};

function json(response, status, body) {
  response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

async function readRawBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;

    if (size > MAX_WEBHOOK_BYTES) {
      throw new Error("payload_too_large");
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function isInboundRecipient(recipients) {
  return Array.isArray(recipients)
    && recipients.some((recipient) => recipient.trim().toLowerCase() === INBOUND_ADDRESS);
}

async function downloadAttachments(resend, emailId) {
  const { data, error } = await resend.emails.receiving.attachments.list({ emailId });

  if (error) {
    throw new Error("attachment_list_failed");
  }

  const attachments = [];
  let totalSize = 0;

  for (const attachment of data.data) {
    totalSize += attachment.size;
    if (totalSize > MAX_ATTACHMENT_BYTES) {
      throw new Error("attachments_too_large");
    }

    const fileResponse = await fetch(attachment.download_url);
    if (!fileResponse.ok) {
      throw new Error("attachment_download_failed");
    }

    attachments.push({
      filename: attachment.filename || "piece-jointe",
      content: Buffer.from(await fileResponse.arrayBuffer()).toString("base64"),
      contentType: attachment.content_type,
      contentId: attachment.content_id || undefined,
    });
  }

  return attachments;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "method_not_allowed" });
  }

  const apiKey = process.env.RESEND_INBOUND_API_KEY;
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    return json(response, 503, { error: "inbound_service_unavailable" });
  }

  const resend = new Resend(apiKey);

  try {
    const payload = await readRawBody(request);
    const id = request.headers["svix-id"];
    const timestamp = request.headers["svix-timestamp"];
    const signature = request.headers["svix-signature"];

    if (!id || !timestamp || !signature) {
      return json(response, 400, { error: "missing_signature_headers" });
    }

    const event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });

    if (event.type !== "email.received") {
      return json(response, 200, { ok: true, ignored: true });
    }

    if (!isInboundRecipient(event.data.to)) {
      return json(response, 200, { ok: true, ignored: true });
    }

    const { data: email, error: emailError } = await resend.emails.receiving.get(
      event.data.email_id,
    );
    if (emailError) {
      return json(response, 502, { error: "email_retrieval_failed" });
    }

    const attachments = email.attachments.length > 0
      ? await downloadAttachments(resend, event.data.email_id)
      : [];
    const replyTo = email.reply_to?.[0] || email.from;

    const { data, error } = await resend.emails.send(
      {
        to: GMAIL_ADDRESS,
        from: FORWARD_FROM,
        replyTo,
        subject: email.subject || "Message reçu sur contact@carolebj.com",
        html: email.html || undefined,
        text: email.text || "Ce message ne contient pas de version texte.",
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      { idempotencyKey: `inbound-forward/${event.data.email_id}` },
    );

    if (error) {
      return json(response, 502, { error: "forward_failed" });
    }

    return json(response, 200, { ok: true, id: data.id });
  } catch (error) {
    if (error instanceof Error && error.message === "payload_too_large") {
      return json(response, 413, { error: "payload_too_large" });
    }

    return json(response, 400, { error: "invalid_webhook" });
  }
}
