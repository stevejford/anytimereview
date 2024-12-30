export interface ClientForm {
  id: string;
  businessName: string;
  webhookUrl: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormErrors {
  businessName?: string;
  webhookUrl?: string;
}