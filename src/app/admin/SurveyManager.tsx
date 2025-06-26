
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Edit, PieChart } from 'lucide-react';
import type { Survey, SimpleUser } from '@/types';
import { deleteSurvey } from '@/actions/surveyActions';

interface SurveyManagerProps {
  initialSurveys: Survey[];
  currentUser: SimpleUser;
}

export default function SurveyManager({ initialSurveys, currentUser }: SurveyManagerProps) {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Umfragen verwalten</CardTitle>
            <CardDescription>Verwalten Sie Ihre Umfragen und sehen Sie die Ergebnisse ein.</CardDescription>
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
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(survey.id)} disabled={isDeleting === survey.id}>
                            {isDeleting === survey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">Sie haben noch keine Umfragen erstellt.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
