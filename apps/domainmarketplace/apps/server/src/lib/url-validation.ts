const PROTOCOL_REGEX = /^https?:\/\//i;

function hasControlCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value);
}

export function isValidRedirectUrl(input: string): boolean {
  if (!input) {
    return false;
  }

  const value = input.trim();

  if (!value || value.startsWith("//") || hasControlCharacters(value)) {
    return false;
  }

  try {
    const candidate = PROTOCOL_REGEX.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    const protocol = url.protocol.toLowerCase();

    if (protocol !== "http:" && protocol !== "https:") {
      return false;
    }

    if (!url.hostname) {
      return false;
    }

    if (url.username || url.password) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export function normalizeUrl(input: string): string {
  const value = input.trim();

  if (!value) {
    return value;
  }

  try {
    const candidate = PROTOCOL_REGEX.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    const protocol = url.protocol.toLowerCase();

    if (protocol !== "http:" && protocol !== "https:") {
      return value;
    }

    url.hostname = url.hostname.toLowerCase();
    url.protocol = protocol;

    return `${url.protocol}//${url.host}${url.pathname}${url.search}${url.hash}`;
  } catch (error) {
    return value;
  }
}

