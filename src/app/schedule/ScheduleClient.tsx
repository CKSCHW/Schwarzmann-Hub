
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, UploadCloud, Loader2, Trash2, Users } from "lucide-react";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { deleteSchedule, uploadSchedule } from '@/actions/scheduleActions';
import type { ScheduleFile, ScheduleDownloadReceiptWithUser } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ScheduleClientProps {
    initialSchedules: ScheduleFile[];
    isAdmin: boolean;
    initialDownloadReceipts: ScheduleDownloadReceiptWithUser[];
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function ScheduleClient({ initialSchedules, isAdmin, initialDownloadReceipts }: ScheduleClientProps) {
  const [schedules, setSchedules] = useState<ScheduleFile[]>(initialSchedules);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getReceiptsForSchedule = (scheduleId: string) => {
    return initialDownloadReceipts.filter((r) => r.scheduleId === scheduleId);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.length) {
        toast({ title: "Keine Datei ausgewählt", description: "Bitte wählen Sie eine PDF-Datei aus.", variant: "destructive" });
        return;
    }
    
    setIsUploading(true);
    const formData = new FormData(event.currentTarget);
    const result = await uploadSchedule(formData);

    if (result.success) {
        window.location.reload(); // Simple reload is easiest to get fresh data
        toast({ title: "Upload erfolgreich", description: result.message });
    } else {
        toast({ title: "Upload fehlgeschlagen", description: result.message, variant: "destructive" });
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setIsUploading(false);
  };

  const handleDelete = async (scheduleId: string) => {
    setIsDeleting(scheduleId);
    const result = await deleteSchedule(scheduleId);
    if (result.success) {
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      toast({ title: "Erfolgreich gelöscht", description: result.message });
    } else {
      toast({ title: "Löschen fehlgeschlagen", description: result.message, variant: "destructive" });
    }
    setIsDeleting(null);
  };

  return (
    <>
      {isAdmin && (
        <Card className="bg-card/50 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" />
              Neuen Plan hochladen
            </CardTitle>
            <CardDescription>
              Hier können Sie neue Wochenpläne im PDF-Format hochladen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="flex items-center gap-4">
              <Input ref={fileInputRef} type="file" name="file" accept="application/pdf" disabled={isUploading} />
              <Button type="submit" disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Hochladen
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">Maximale Dateigröße: 10MB. Nur PDF-Format akzeptiert.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Pläne</CardTitle>
          {isAdmin && <CardDescription>Klicken Sie auf einen Eintrag, um die Download-Statistiken anzuzeigen.</CardDescription>}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {schedules.length > 0 ? (
              schedules.map((schedule) => {
                const scheduleReceipts = getReceiptsForSchedule(schedule.id);
                return (
                  <AccordionItem value={schedule.id} key={schedule.id}>
                    <div className="flex items-center border-b">
                      <div className="flex-grow">
                          <Table>
                            <TableBody>
                              <TableRow className="border-b-0 hover:bg-transparent">
                                <TableCell className="font-medium flex items-center w-[40%]">
                                  <FileText className="mr-2 h-5 w-5 text-primary" />
                                  {schedule.name}
                                </TableCell>
                                <TableCell className="w-[20%]">{new Date(schedule.dateAdded).toLocaleDateString('de-DE')}</TableCell>
                                <TableCell className="w-[15%]">{formatBytes(schedule.size)}</TableCell>
                                <TableCell className="text-right space-x-2 w-[25%]">
                                  <Button asChild variant="ghost" size="sm">
                                    <a href={`/api/schedules/download/${schedule.id}`} download={schedule.name}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Herunterladen
                                    </a>
                                  </Button>
                                  {isAdmin && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-9 w-9" disabled={isDeleting === schedule.id}>
                                          {isDeleting === schedule.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Diese Aktion kann nicht rückgängig gemacht werden. Der Plan wird endgültig vom Server gelöscht.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(schedule.id)}>Löschen</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                      </div>
                      {isAdmin && (
                        <AccordionTrigger className="p-4">
                           <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                                {scheduleReceipts.length}
                                <Users className="h-4 w-4" />
                           </span>
                        </AccordionTrigger>
                      )}
                    </div>

                    {isAdmin && (
                      <AccordionContent>
                        {scheduleReceipts.length > 0 ? (
                           <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Mitarbeiter (E-Mail)</TableHead>
                                <TableHead>Heruntergeladen am</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scheduleReceipts.map(receipt => (
                                <TableRow key={receipt.id}>
                                  <TableCell>{receipt.user?.email ?? 'Unbekannt'}</TableCell>
                                  <TableCell>{new Date(receipt.downloadedAt).toLocaleString('de-DE')}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                           </Table>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            Dieser Plan wurde noch von niemandem heruntergeladen.
                          </p>
                        )}
                      </AccordionContent>
                    )}
                  </AccordionItem>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Zurzeit sind keine Pläne verfügbar.
              </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
