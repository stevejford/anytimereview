export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+61 \d \d{4} \d{4}$/;
  return phoneRegex.test(phone);
};

export const formatPhoneNumber = (input: string): string => {
  const cleaned = input.replace(/\D/g, '');
  
  if (cleaned.length <= 9) {
    return cleaned;
  }
  
  let formatted = cleaned;
  if (formatted.startsWith('0')) {
    formatted = formatted.substring(1);
  }
  if (!formatted.startsWith('61')) {
    formatted = '61' + formatted;
  }
  
  const groups = formatted.match(/^(\d{2})(\d{1})(\d{4})(\d{4})$/);
  if (groups) {
    return `+${groups[1]} ${groups[2]} ${groups[3]} ${groups[4]}`;
  }
  
  return cleaned;
};