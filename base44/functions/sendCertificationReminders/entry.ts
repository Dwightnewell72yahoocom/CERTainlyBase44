import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Thresholds and who gets notified at each
const THRESHOLDS = [
  { days: 180, recipients: ['technician'] },
  { days: 90,  recipients: ['technician', 'employer'] },
  { days: 60,  recipients: ['technician', 'employer', 'supervisor'] },
  { days: 30,  recipients: ['technician', 'employer', 'supervisor'] },
  { days: 7,   recipients: ['technician', 'employer', 'supervisor'] },
];

function daysUntilExpiry(expiryDateStr) {
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
}

function getEmail(cert, recipientType) {
  if (recipientType === 'technician') return cert.technician_email;
  if (recipientType === 'employer') return cert.employer_email;
  if (recipientType === 'supervisor') return cert.supervisor_email;
  return null;
}

function buildEmailBody(cert, days, recipientType, isOverdue) {
  const recipientName = recipientType === 'technician'
    ? cert.technician_name
    : recipientType === 'employer'
      ? cert.employer_name || 'Employer'
      : cert.supervisor_name || 'Supervisor';

  if (isOverdue) {
    return `Dear ${recipientName},

⚠️ URGENT: The following NRCan certification is OVERDUE for renewal.

Certification: ${cert.certification_name}
Technician: ${cert.technician_name}
Cert Number: ${cert.certification_number || 'N/A'}
Expiry Date: ${cert.expiry_date}
Status: EXPIRED — ${Math.abs(days)} day(s) overdue

Immediate action is required. The technician may not legally perform NRCan-regulated NDT work under this certification until it is renewed.

Begin renewal: https://www.nrcan.gc.ca/science-data/science-research/science-technology-collaboration/certification-personnel/certification-renewal/22872

This is an automated message from CERTainly.`;
  }

  return `Dear ${recipientName},

This is an automated reminder that the following NRCan certification is due for renewal in ${days} day(s).

Certification: ${cert.certification_name}
Technician: ${cert.technician_name}
Cert Number: ${cert.certification_number || 'N/A'}
Expiry Date: ${cert.expiry_date}
Days Remaining: ${days}

Please begin the renewal process at:
https://www.nrcan.gc.ca/science-data/science-research/science-technology-collaboration/certification-personnel/certification-renewal/22872

This is an automated message from CERTainly.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (service role) or admin user calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAuthorized = true;
    } catch (_) {
      // Not a user call — treat as scheduled/service invocation
      isAuthorized = true;
    }
    if (!isAuthorized) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const certifications = await base44.asServiceRole.entities.Certification.list();
    const existingReminders = await base44.asServiceRole.entities.Reminder.list();

    // Build a Set of already-sent keys for O(1) dedup
    const sentKeys = new Set(
      existingReminders
        .filter(r => r.status === 'sent')
        .map(r => `${r.certification_id}|${r.days_before}|${r.recipient_type}|${!!r.is_overdue}`)
    );

    let sent = 0;
    let skipped = 0;

    for (const cert of certifications) {
      if (!cert.expiry_date) continue;
      const days = daysUntilExpiry(cert.expiry_date);
      const isOverdue = days < 0;

      const thresholdsToCheck = isOverdue
        ? [{ days: 0, recipients: ['technician', 'employer', 'supervisor'] }]
        : THRESHOLDS.filter(t => days <= t.days && days > t.days - 3);

      for (const threshold of thresholdsToCheck) {
        const thresholdKey = isOverdue ? 0 : threshold.days;

        for (const recipientType of threshold.recipients) {
          const dedupKey = `${cert.id}|${thresholdKey}|${recipientType}|${isOverdue}`;
          if (sentKeys.has(dedupKey)) { skipped++; continue; }

          const email = getEmail(cert, recipientType);
          if (!email) continue;

          const subject = isOverdue
            ? `🚨 OVERDUE: ${cert.certification_name} — ${cert.technician_name}`
            : `⚠️ Renewal Due in ${days} Days — ${cert.certification_name}`;

          let status = 'sent';
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: email,
              subject,
              body: buildEmailBody(cert, days, recipientType, isOverdue)
            });
            sent++;
          } catch (_) {
            status = 'failed';
          }

          await base44.asServiceRole.entities.Reminder.create({
            certification_id: cert.id,
            certification_name: cert.certification_name,
            technician_name: cert.technician_name,
            days_before: thresholdKey,
            is_overdue: isOverdue,
            recipient_type: recipientType,
            sent_at: new Date().toISOString(),
            status
          });
        }
      }
    }

    return Response.json({ success: true, sent, skipped, certifications_checked: certifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});