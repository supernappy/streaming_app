// Shared formatting helpers

// Format numbers with compact notation (e.g., 1.2k, 3.4M)
export function formatNumberCompact(value) {
  try {
    const n = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  } catch (_) {
    // Fallback simple formatter
    const n = typeof value === 'number' ? value : Number(value) || 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }
}

// Format plays with pluralization and compact numbers
export function formatPlays(value) {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  const compact = formatNumberCompact(n);
  const label = n === 1 ? 'play' : 'plays';
  return `${compact} ${label}`;
}
