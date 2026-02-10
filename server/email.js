import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;
const staffEmail = process.env.STAFF_EMAIL;

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_STATUS = {
  SENT: "sent",
  SKIPPED: "skipped",
  FAILED: "failed",
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatName = (firstName, lastName) => {
  const trimmedFirst = (firstName || "").trim();
  const trimmedLast = (lastName || "").trim();
  return trimmedLast ? `${trimmedFirst} ${trimmedLast}` : trimmedFirst;
};

const buildEmailResult = (recipient, status, options = {}) => ({
  recipient,
  status,
  reason: options.reason || null,
  messageId: options.messageId || null,
  error: options.error || null,
});

const getConfigSkipReason = () => {
  if (!resendClient) return "missing_resend_api_key";
  if (!resendFrom) return "missing_resend_from";
  return null;
};

const extractResendMessageId = (response) => {
  if (typeof response?.data?.id === "string" && response.data.id.length > 0) {
    return response.data.id;
  }
  if (typeof response?.id === "string" && response.id.length > 0) {
    return response.id;
  }
  return null;
};

const sendResendEmail = async (recipient, payload) => {
  try {
    const response = await resendClient.emails.send(payload);

    if (response?.error) {
      return buildEmailResult(recipient, EMAIL_STATUS.FAILED, {
        reason: "resend_rejected_request",
        error: response.error?.message || "Resend rejected the request.",
      });
    }

    return buildEmailResult(recipient, EMAIL_STATUS.SENT, {
      messageId: extractResendMessageId(response),
    });
  } catch (error) {
    return buildEmailResult(recipient, EMAIL_STATUS.FAILED, {
      reason: "send_exception",
      error: error?.message || "Unknown email error.",
    });
  }
};

export const sendStaffNotification = async ({
  serviceName,
  startTime,
  firstName,
  lastName,
  contactPhone,
}) => {
  const configSkipReason = getConfigSkipReason();
  if (configSkipReason) {
    return buildEmailResult("staff", EMAIL_STATUS.SKIPPED, {
      reason: configSkipReason,
    });
  }
  if (!staffEmail) {
    return buildEmailResult("staff", EMAIL_STATUS.SKIPPED, {
      reason: "missing_staff_email",
    });
  }

  const formattedTime = formatTime(startTime);
  const patientName = formatName(firstName, lastName);

  return sendResendEmail("staff", {
    from: resendFrom,
    to: staffEmail,
    subject: "New appointment request",
    html: `
      <p>You have a new appointment request.</p>
      <ul>
        <li><strong>Patient:</strong> ${patientName || "New patient"}</li>
        <li><strong>Service:</strong> ${serviceName || "General appointment"}</li>
        <li><strong>Requested time:</strong> ${formattedTime}</li>
        <li><strong>Phone number:</strong> ${contactPhone || "Not provided"}</li>
      </ul>
      <p>Please log in to confirm the appointment.</p>
    `,
  });
};

export const sendPatientConfirmation = async ({
  patientEmail,
  serviceName,
  startTime,
  firstName,
  lastName,
}) => {
  const configSkipReason = getConfigSkipReason();
  if (configSkipReason) {
    return buildEmailResult("patient", EMAIL_STATUS.SKIPPED, {
      reason: configSkipReason,
    });
  }
  if (!patientEmail) {
    return buildEmailResult("patient", EMAIL_STATUS.SKIPPED, {
      reason: "missing_patient_email",
    });
  }

  const formattedTime = formatTime(startTime);
  const patientName = formatName(firstName, lastName);

  return sendResendEmail("patient", {
    from: resendFrom,
    to: patientEmail,
    subject: "We received your appointment request",
    html: `
      <p>Hi ${patientName || "there"},</p>
      <p>Thanks for requesting an appointment with NYC Smiles.</p>
      <ul>
        <li><strong>Service:</strong> ${serviceName || "General appointment"}</li>
        <li><strong>Requested time:</strong> ${formattedTime}</li>
      </ul>
      <p>Our team will confirm your appointment shortly.</p>
    `,
  });
};
