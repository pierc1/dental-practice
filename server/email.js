import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;
const staffEmail = process.env.STAFF_EMAIL;

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

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

export const canSendEmail = () => Boolean(resendClient && resendFrom);

export const sendStaffNotification = async ({
  serviceName,
  startTime,
  firstName,
  lastName,
  contactPhone,
}) => {
  if (!resendClient || !resendFrom || !staffEmail) return { skipped: true };

  const formattedTime = formatTime(startTime);
  const patientName = formatName(firstName, lastName);

  return resendClient.emails.send({
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
  if (!resendClient || !resendFrom || !patientEmail) return { skipped: true };

  const formattedTime = formatTime(startTime);
  const patientName = formatName(firstName, lastName);

  return resendClient.emails.send({
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
