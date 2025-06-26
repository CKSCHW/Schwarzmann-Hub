
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { markNotificationAsClicked } from '@/actions/notificationActions';

export default function NotificationHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    useEffect(() => {
        if (user && searchParams.has('notification_id')) {
            const notificationId = searchParams.get('notification_id');
            if (notificationId) {
                markNotificationAsClicked(notificationId, user.uid);
                
                // Clean up URL by removing the query parameter
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete('notification_id');
                const newUrl = `${pathname}${newParams.size > 0 ? '?' + newParams.toString() : ''}`;
                router.replace(newUrl);
            }
        }
    }, [user, searchParams, pathname, router]);

    return null; // This component doesn't render anything
}
