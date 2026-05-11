'use client';

import { useEffect } from 'react';
import { api } from '../lib/api';

export default function SyncTrigger() {
  useEffect(() => {
    api.triggerSync().catch(() => {});
  }, []);
  return null;
}
