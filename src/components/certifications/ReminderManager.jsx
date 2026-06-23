import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

const REMINDER_DAYS = [180, 90, 60, 30, 7];

export default function ReminderManager({ certifications }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const sendReminders = async () => {
    setRunning(true);
    let sent = 0;

    try {
      const existingReminders = await base44.entities.Reminder.list();

      for (const cert of certifications) {
        const days = differenceInDays(parseISO(cert.expiry_date), new Date());

        for (const threshold of REMINDER_DAYS) {
          // Check if we're within 3 days of this threshold
          if (days <= threshold && days > threshold - 3) {
            const alreadySent = existingReminders.some(
              r => r.certification_id === cert.id && r.days_before === threshold
            );
            if (alreadySent) continue;

            const recipients = [
              cert.technician_email,
              cert.employer_email,
              cert.supervisor_email
            ].filter(Boolean);

            for (const email of recipients) {
              try {
                await base44.integrations.Core.SendEmail({
                  to: email,
                  subject: `⚠️ Certification Renewal Due in ${days} Days — ${cert.certification_name}`,
                  body: `Dear ${cert.technician_name},\n\nThis is an automated reminder that the following certification is due for renewal:\n\nCertification: ${cert.certification_name}\nTechnician: ${cert.technician_name}\nExpiry Date: ${cert.expiry_date}\nDays Remaining: ${days}\n\nPlease visit the NRCan renewal portal to begin your renewal application:\nhttps://www.nrcan.gc.ca/science-data/science-research/science-technology-collaboration/certification-personnel/certification-renewal/22872\n\nThis is an automated message from CERTainly.`
                });
                sent++;
              } catch (e) { /* skip failed sends */ }
            }

            await base44.entities.Reminder.create({
              certification_id: cert.id,
              certification_name: cert.certification_name,
              technician_name: cert.technician_name,
              days_before: threshold,
              sent_at: new Date().toISOString(),
              status: 'sent'
            });
          }
        }
      }

      setDone(true);
      toast.success(sent > 0 ? `${sent} reminder email(s) sent` : 'No reminders due right now');
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      toast.error('Failed to process reminders');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={sendReminders}
      disabled={running}
      className="flex items-center gap-2"
    >
      {running ? (
        <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
      ) : done ? (
        <><CheckCircle className="w-4 h-4 text-green-600" />Done</>
      ) : (
        <><Bell className="w-4 h-4" />Send Reminders</>
      )}
    </Button>
  );
}