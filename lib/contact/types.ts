export const ENQUIRY_TOPICS = ["speaking", "collaboration", "media", "general"] as const;
export type EnquiryTopic = (typeof ENQUIRY_TOPICS)[number];

export const ENQUIRY_TOPIC_LABELS: Record<EnquiryTopic, string> = {
  speaking: "Speaking",
  collaboration: "Collaboration",
  media: "Media",
  general: "General enquiry",
};

export type ContactEnquiry = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  created_at: string;
};
