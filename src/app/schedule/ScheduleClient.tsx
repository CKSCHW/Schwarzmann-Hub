
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
        toast({ title: "Keine Datei ausgewählt", description: "Bitte wähle eine PDF-Datei aus.", variant: "destructive" });
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
              Hier kannst du neue Wochenpläne im PDF-Format hochladen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Input ref={fileInputRef} type="file" name="file" accept="application/pdf" disabled={isUploading} className="flex-grow" />
              <Button type="submit" disabled={isUploading} className="w-full sm:w-auto">
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
          {isAdmin && <CardDescription>Klicke auf einen Eintrag, um die Download-Statistiken anzuzeigen.</CardDescription>}
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {schedules.length > 0 ? (
              schedules.map((schedule) => {
                const scheduleReceipts = getReceiptsForSchedule(schedule.id);
                return (
                  <AccordionItem value={schedule.id} key={schedule.id}>
                    <div className="flex items-start md:items-center border-b">
                      <div className="flex-grow p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-y-3 md:gap-x-4">
                          {/* Left side: File Name */}
                          <div className="flex-1 font-medium flex items-center min-w-0">
                            <FileText className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                            <span className="truncate" title={schedule.name}>{schedule.name}</span>
                          </div>

                          {/* Middle: Meta Info (Date & Size) */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0 pl-7 md:pl-0">
                            <span>{new Date(schedule.dateAdded).toLocaleDateString('de-DE')}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline">{formatBytes(schedule.size)}</span>
                          </div>

                          {/* Right side: Actions */}
                          <div className="flex gap-2 justify-start md:justify-end items-center flex-shrink-0 self-start md:self-center">
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
                                    <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
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
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="p-4 self-stretch flex items-center border-l">
                          <AccordionTrigger className="p-2 -m-2">
                             <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                                  {scheduleReceipts.length}
                                  <Users className="h-4 w-4" />
                             </span>
                          </AccordionTrigger>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <AccordionContent>
                        {scheduleReceipts.length > 0 ? (
                           <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Mitarbeiter</TableHead>
                                  <TableHead>Heruntergeladen am</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {scheduleReceipts.map(receipt => (
                                  <TableRow key={receipt.id}>
                                    <TableCell>{receipt.user?.displayName || receipt.user?.email || 'Unbekannt'}</TableCell>
                                    <TableCell>{new Date(receipt.downloadedAt).toLocaleString('de-DE')}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                           </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4 px-4">
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
