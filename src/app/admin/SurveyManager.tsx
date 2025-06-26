
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Edit, PieChart, Copy } from 'lucide-react';
import type { Survey } from '@/types';
import { deleteSurvey, duplicateSurvey } from '@/actions/surveyActions';
import { ToastAction } from '@/components/ui/toast';

interface SurveyManagerProps {
  initialSurveys: Survey[];
}

export default function SurveyManager({ initialSurveys }: SurveyManagerProps) {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (surveyId: string) => {
    setIsDeleting(surveyId);
    try {
        await deleteSurvey(surveyId);
        setSurveys(prev => prev.filter(s => s.id !== surveyId));
        toast({ title: 'Erfolg', description: 'Umfrage wurde gelöscht.' });
    } catch (error: any) {
        toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
        setIsDeleting(null);
    }
  }

  const handleDuplicate = async (surveyId: string) => {
    setIsDuplicating(surveyId);
    try {
      const newSurvey = await duplicateSurvey(surveyId);
      
      // Optimistically update the list of surveys and refresh server data
      setSurveys(prev => [newSurvey, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      router.refresh();

      toast({
        title: 'Umfrage dupliziert',
        description: `Die neue Umfrage "${newSurvey.title}" ist bereit zum Bearbeiten.`,
        action: (
          <ToastAction altText="Zur neuen Umfrage" asChild>
            <Link href={`/admin/surveys/edit/${newSurvey.id}`}>Bearbeiten</Link>
          </ToastAction>
        ),
      });
    } catch (error: any) {
      toast({ title: 'Fehler beim Duplizieren', description: error.message, variant: 'destructive' });
    } finally {
      setIsDuplicating(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Umfragen verwalten</CardTitle>
            <CardDescription>Verwalte deine Umfragen und sieh die Ergebnisse ein.</CardDescription>
        </div>
        <Button asChild>
            <Link href="/admin/surveys/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Neue Umfrage
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Teilnehmer</TableHead>
              <TableHead>Antworten</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveys.length > 0 ? (
              surveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">{survey.title}</TableCell>
                  <TableCell>{survey.assignedUserIds.length}</TableCell>
                  <TableCell>{survey.completionCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/surveys/results/${survey.id}`}>
                                <PieChart className="h-4 w-4 mr-2" />
                                Ergebnisse
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/surveys/edit/${survey.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDuplicate(survey.id)} disabled={isDuplicating === survey.id}>
                            {isDuplicating === survey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
                            Duplizieren
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(survey.id)} disabled={isDeleting === survey.id}>
                            {isDeleting === survey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">Du hast noch keine Umfragen erstellt.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
