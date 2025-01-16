export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Australian number (with or without country code)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return true;
  }
  if (cleaned.length === 11 && cleaned.startsWith('61')) {
    return true;
  }
  return false;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 61
  if (cleaned.startsWith('0')) {
    return '61' + cleaned.slice(1);
  }
  
  // If already starts with 61, return as is
  if (cleaned.startsWith('61')) {
    return cleaned;
  }
  
  // Otherwise, assume it needs 61 prefix
  return '61' + cleaned;
}