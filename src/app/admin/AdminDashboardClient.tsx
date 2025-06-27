
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Eye, Loader2, Newspaper, UploadCloud, Globe, BellRing, Trash2 } from 'lucide-react';
import { createArticle, importWordPressArticles, deleteArticle, updateArticleSettings } from '@/actions/adminActions';
import { sendTestNotification } from '@/actions/notificationActions';
import type { NewsArticle, ReadReceiptWithUser } from '@/types';

const articleSchema = z.object({
  title: z.string().min(5, 'Der Titel muss mindestens 5 Zeichen lang sein.'),
  snippet: z.string().min(10, 'Die Kurzbeschreibung muss mindestens 10 Zeichen lang sein.'),
  content: z.string().optional(),
  imageUrl: z.string().url('Bitte gib eine gültige Bild-URL ein.').optional().or(z.literal('')),
  author: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

type AdminDashboardClientProps = {
  initialArticles: NewsArticle[];
  initialReceipts: ReadReceiptWithUser[];
  adminDisplayName: string;
};

export default function AdminDashboardClient({
  initialArticles,
  initialReceipts,
  adminDisplayName,
}: AdminDashboardClientProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [receipts, setReceipts] = useState<ReadReceiptWithUser[]>(initialReceipts);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      snippet: '',
      content: '',
      imageUrl: '',
      author: 'Geschäftsführung',
    },
  });

  const handleImportWordPress = async () => {
    setIsImporting(true);
    try {
      const result = await importWordPressArticles();
      window.location.reload(); // Reload to show new articles

      let description = 'Keine neuen oder geänderten Artikel gefunden.';
      if (result.newCount > 0 && result.updatedCount > 0) {
        description = `${result.newCount} neue und ${result.updatedCount} bestehende Artikel wurden importiert/aktualisiert.`;
      } else if (result.newCount > 0) {
        description = `${result.newCount} neue Artikel wurden importiert.`;
      } else if (result.updatedCount > 0) {
        description = `${result.updatedCount} bestehende Artikel wurden aktualisiert.`;
      }

      toast({
        title: 'Webseiten-Import abgeschlossen',
        description,
      });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Fehler beim Import',
        description: 'Die Artikel von den Webseiten konnten nicht importiert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const onSubmit: SubmitHandler<ArticleFormValues> = async (data) => {
    setIsCreating(true);
    try {
      // Dummy values for fields that will be populated by the action
      const newArticleData: Omit<NewsArticle, 'id' | 'date' | 'likes' | 'commentsEnabled' | 'commentCount'> = {
        ...data,
        imageUrl: data.imageUrl || `https://placehold.co/1200x600.png`,
        author: data.author || 'Geschäftsführung',
        category: 'Unternehmen',
        source: 'internal', // Explicitly set source for internal articles
      };
      const newArticle = await createArticle(newArticleData as any);
      setArticles([newArticle, ...articles]);
      form.reset();
      toast({
        title: 'Artikel erstellt',
        description: 'Der neue Artikel wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Erstellen',
        description: 'Der Artikel konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleToggleComments = async (articleId: string, enabled: boolean) => {
    try {
        await updateArticleSettings(articleId, { commentsEnabled: enabled });
        setArticles(prev => prev.map(a => a.id === articleId ? { ...a, commentsEnabled: enabled } : a));
        toast({
            title: 'Einstellung gespeichert',
            description: `Kommentare sind nun ${enabled ? 'aktiviert' : 'deaktiviert'}.`,
        });
    } catch (error) {
        toast({
            title: 'Fehler',
            description: 'Einstellung konnte nicht gespeichert werden.',
            variant: 'destructive',
        });
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      await sendTestNotification();
      toast({
        title: 'Test-Benachrichtigung gesendet',
        description: 'Alle abonnierten Geräte sollten in Kürze eine Nachricht erhalten.',
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Senden',
        description: 'Die Test-Benachrichtigung konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    setIsDeleting(articleId);
    try {
      await deleteArticle(articleId);
      setArticles(prev => prev.filter(a => a.id !== articleId));
      toast({
        title: 'Artikel gelöscht',
        description: 'Der interne Artikel wurde erfolgreich entfernt.',
      });
    } catch (error: any) {
      toast({
        title: 'Fehler beim Löschen',
        description: error.message || 'Der Artikel konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };


  const getReceiptsForArticle = (articleId: string) => {
    return receipts.filter((r) => r.articleId === articleId);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Neuen internen Artikel erstellen
              </CardTitle>
              <CardDescription>
                Veröffentliche hier neue unternehmensinterne News.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titel</FormLabel>
                        <FormControl>
                          <Input placeholder="Wichtige Ankündigung..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="snippet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kurzbeschreibung</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Eine kurze Zusammenfassung des Artikels..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vollständiger Inhalt (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Der gesamte Inhalt des Artikels..." rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bild-URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://placehold.co/1200x600.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="flex justify-between items-center">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? <Loader2 className="animate-spin mr-2" /> : <Newspaper className="mr-2" />}
                      Artikel veröffentlichen
                    </Button>
                   </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Webseiten-Import
                </CardTitle>
                <CardDescription>
                    Importiere und aktualisiere die neuesten Beiträge von den öffentlichen Unternehmenswebseiten.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleImportWordPress} disabled={isImporting}>
                    {isImporting ? (
                        <Loader2 className="animate-spin mr-2" />
                    ) : (
                        <UploadCloud className="mr-2" />
                    )}
                    Webseiten-Artikel importieren
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                    Sucht nach neuen Artikeln und aktualisiert bestehende.
                </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                Benachrichtigungen testen
              </CardTitle>
              <CardDescription>
                Sende eine Test-Benachrichtigung an alle abonnierten Geräte, um die Funktion zu prüfen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSendTestNotification} disabled={isSendingTest} className="w-full">
                {isSendingTest ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <BellRing className="mr-2" />
                )}
                Test-Benachrichtigung senden
              </Button>
            </CardContent>
          </Card>
           <Card>
              <CardHeader>
                  <CardTitle>Info</CardTitle>
                  <CardDescription>Angemeldet als Admin:</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="font-mono text-sm">{adminDisplayName}</p>
                   <p className="text-xs text-muted-foreground mt-4">
                      Nur Benutzer mit der `admin`-Rolle können diese Seite sehen. Du kannst Rollen über das Firebase Admin SDK (Custom Claims) vergeben.
                   </p>
              </CardContent>
           </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Lesestatistiken
          </CardTitle>
          <CardDescription>
            Hier siehst du, wer welche Artikel gelesen hat. Interne Artikel können hier gelöscht werden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {articles.length > 0 ? articles.map((article) => {
              const articleReceipts = getReceiptsForArticle(article.id);
              return (
                <AccordionItem value={article.id} key={article.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                      <span className="text-left font-medium truncate">{article.title}</span>
                      <div className="flex items-center gap-2">
                        {article.source === 'internal' && (
                          <AlertDialog onOpenChange={(open) => !open && setIsDeleting(null)}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                                onClick={(e) => e.stopPropagation()} 
                                disabled={isDeleting === article.id}
                              >
                                {isDeleting === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Diese Aktion kann nicht rückgängig gemacht werden. Der Artikel und alle zugehörigen Lesestatistiken werden dauerhaft gelöscht.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteArticle(article.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                          {articleReceipts.length}
                          <Eye className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {articleReceipts.length > 0 ? (
                       <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mitarbeiter</TableHead>
                            <TableHead>Gelesen am</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {articleReceipts.map(receipt => (
                            <TableRow key={receipt.id}>
                              <TableCell>{receipt.user?.displayName || receipt.user?.email || 'Unbekannt'}</TableCell>
                              <TableCell>{new Date(receipt.readAt).toLocaleString('de-DE')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                       </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Dieser Artikel wurde noch von niemandem gelesen.
                      </p>
                    )}
                    {article.source === 'internal' && (
                        <div className="border-t mt-4 pt-4">
                            <h4 className="font-semibold text-sm mb-2">Einstellungen</h4>
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`comments-${article.id}`} className="text-sm font-normal">
                                    Kommentare aktivieren
                                </Label>
                                <Switch
                                    id={`comments-${article.id}`}
                                    checked={article.commentsEnabled}
                                    onCheckedChange={(checked) => handleToggleComments(article.id, checked)}
                                />
                            </div>
                        </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            }) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Keine Artikel in der Datenbank gefunden.</p>
                    <p className="text-sm mt-2">Bitte importiere die Artikel im Admin-Bereich.</p>
                </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
