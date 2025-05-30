import { z } from 'zod';

export const TwilioWhatsAppWebhookSchema = z.object({
    From: z.string(), // Sender's WhatsApp number
    To: z.string(), // Receiver's WhatsApp number
    Body: z.string(), // Message content (may be empty for media)
    MessageType: z.string(), // 'text', 'image', etc.
    ProfileName: z.string().optional(),
    MediaUrl0: z.string().optional(),
    MediaContentType0: z.string().optional(),
    NumMedia: z.string(), // Number of media files (as string)
    WaId: z.string(), // WhatsApp ID of the sender
    ListId: z.string().optional(), // List ID if applicable
    ListName: z.string().optional(), // List name if applicable
    MessageSid: z.string(), // Twilio Message SID
    ButtonText: z.string().optional(), // Text of the button if applicable
    ButtonPayload: z.string().optional(), // Payload of the button if applicable
});

export type TwilioWhatsAppWebhookPayload = z.infer<typeof TwilioWhatsAppWebhookSchema>;
