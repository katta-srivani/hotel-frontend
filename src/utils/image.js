const fallbackRoomImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e5e7eb"/><rect x="72" y="74" width="256" height="152" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/><rect x="102" y="112" width="90" height="72" rx="10" fill="#dbeafe"/><rect x="208" y="112" width="90" height="72" rx="10" fill="#dbeafe"/><rect x="160" y="182" width="80" height="18" rx="9" fill="#94a3b8"/><text x="200" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#64748b">Room</text></svg>'
  );

const isLocalOrPrivateHost = (hostname = '') => {
  const host = String(hostname).toLowerCase();

  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
};

export const getSafeImageUrl = (inputUrl, fallback = fallbackRoomImage) => {
  const url = String(inputUrl || '').trim();
  if (!url) {
    return fallback;
  }

  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('http://')) {
    try {
      const parsed = new URL(url);
      if (isLocalOrPrivateHost(parsed.hostname)) {
        return fallback;
      }
      return window.location.protocol === 'https:' ? fallback : url;
    } catch {
      return fallback;
    }
  }

  if (url.startsWith('//')) {
    return `${window.location.protocol}${url}`;
  }

  if (url.startsWith('/')) {
    return url;
  }

  return fallback;
};

export { fallbackRoomImage };
