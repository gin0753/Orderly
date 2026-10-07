export function safeCustomerReturnPath(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\s]/.test(value)
  )
    return '/account';
  try {
    const url = new URL(value, 'https://orderly.invalid');
    const path = url.pathname.replace(/\/$/, '') || '/';
    if (
      url.origin !== 'https://orderly.invalid' ||
      /%|[\\\s]/.test(path) ||
      !/^(?:\/|\/checkout|\/account(?:\/orders(?:\/[0-9a-fA-F-]{36})?)?|\/track-order(?:\/[0-9]+)?)$/.test(
        path,
      )
    )
      return '/account';
    const query = new URLSearchParams();
    for (const [key, entry] of url.searchParams) {
      if (['page', 'pageSize'].includes(key) && /^[1-9]\d{0,5}$/.test(entry))
        query.set(key, entry);
      if (
        key === 'status' &&
        /^(PENDING|ACCEPTED|PREPARING|READY|COMPLETED|CANCELLED)$/.test(entry)
      )
        query.set(key, entry);
      if (
        key === 'sort' &&
        /^(newest|oldest|amount_high|amount_low)$/.test(entry)
      )
        query.set(key, entry);
      if (key === 'orderNumber' && /^\d{1,30}$/.test(entry))
        query.set(key, entry);
    }
    const result = `${path}${query.size ? `?${query}` : ''}`;
    return result.length <= 512 ? result : '/account';
  } catch {
    return '/account';
  }
}
