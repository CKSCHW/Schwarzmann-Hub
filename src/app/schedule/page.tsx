
import { getCurrentUser } from '@/lib/firebase-admin';
import { getSchedules, getScheduleDownloadReceipts } from '@/actions/scheduleActions';
import ScheduleClient from './ScheduleClient';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;

  const [schedules, downloadReceipts] = await Promise.all([
    getSchedules(),
    isAdmin ? getScheduleDownloadReceipts() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <section aria-labelledby="schedule-title">
        <h1 id="schedule-title" className="text-3xl font-headline font-semibold mb-2">
          Wocheneinteilung
        </h1>
        <p className="text-muted-foreground mb-6">
          Sehen und laden Sie die neuesten Wocheneinteilungen herunter.
        </p>
      </section>
      
      <ScheduleClient 
        initialSchedules={schedules} 
        isAdmin={isAdmin}
        initialDownloadReceipts={downloadReceipts}
      />
    </div>
  );
}
