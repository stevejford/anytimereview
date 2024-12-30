export interface ClientFormData {
  name: string;
  phone: string;
  email: string;
}

export interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}