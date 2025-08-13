import { inngest } from "../client";

export const handleMeetingReminder = inngest.createFunction(
  // Argumento 1: Objeto de Opções
  { id: "handle-meeting-reminder-function", name: "Handle Meeting Reminder" },

  // Argumento 2: Objeto de Gatilho
  { event: "meeting/reminder" },

  // Argumento 3: A Lógica (Handler)
  async ({ event, step }) => {
    await step.sleep("wait-a-sec-reminder", "1s");
    console.log(`Sending meeting reminder for meeting ${event.data.eventId}`);
    return { status: "Meeting reminder sent" };
  }
);