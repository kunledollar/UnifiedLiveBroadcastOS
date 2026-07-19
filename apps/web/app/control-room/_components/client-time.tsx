'use client';

import { useEffect, useState } from 'react';

export function ClientTime({ iso, fallback = '—' }: { iso: string; fallback?: string }) {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    const date = new Date(iso);
    setLabel(Number.isNaN(date.getTime()) ? fallback : date.toLocaleTimeString());
  }, [fallback, iso]);

  return <>{label}</>;
}
