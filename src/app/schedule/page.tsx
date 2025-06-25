import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, UploadCloud } from "lucide-react";
import { mockSchedules } from "@/lib/mockData";

export default function SchedulePage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="schedule-title">
        <h1 id="schedule-title" className="text-3xl font-headline font-semibold mb-2">
          Wochenpläne
        </h1>
        <p className="text-muted-foreground mb-6">
          Sehen und laden Sie die neuesten Wocheneinteilungen herunter.
        </p>
      </section>

      {/* This section would ideally be visible only to admins */}
      <Card className="bg-card/50 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <UploadCloud className="mr-2 h-5 w-5 text-primary" />
            Neuen Plan hochladen
          </CardTitle>
          <CardDescription>
            Administratoren können hier neue PDF-Pläne hochladen. Diese Funktionalität dient nur zur Demonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <UploadCloud className="mr-2 h-4 w-4" />
            PDF-Datei auswählen
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Maximale Dateigröße: 5MB. Nur PDF-Format akzeptiert.</p>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Pläne</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dateiname</TableHead>
                <TableHead>Hinzugefügt am</TableHead>
                <TableHead>Größe</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSchedules.length > 0 ? (
                mockSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-primary" />
                      {schedule.name}
                    </TableCell>
                    <TableCell>{new Date(schedule.dateAdded).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>{schedule.size}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <a href={schedule.url} download={schedule.name} aria-label={`Download ${schedule.name}`}>
                          <Download className="mr-2 h-4 w-4" />
                          Herunterladen
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Zurzeit sind keine Pläne verfügbar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
