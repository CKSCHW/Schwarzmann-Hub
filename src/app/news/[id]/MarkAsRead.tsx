'use client';

import { useEffect, useRef } from 'react';
import { markAsRead } from '@/actions/newsActions';

interface MarkAsReadClientTriggerProps {
  articleId: string;
  userId: string;
}

export default function MarkAsReadClientTrigger({ articleId, userId }: MarkAsReadClientTriggerProps) {
  const hasMarked = useRef(false);

  useEffect(() => {
    // useRef ensures this runs only once per component mount,
    // even with React's Strict Mode double-invoking effects.
    if (!hasMarked.current) {
      markAsRead(articleId, userId).catch(console.error);
      hasMarked.current = true;
    }
  }, [articleId, userId]);

  return null; // This component does not render anything
}
