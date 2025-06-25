
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
import { useToast } from '@/hooks/use-toast';
import { BellRing, Eye, Loader2, Newspaper, UploadCloud, Globe } from 'lucide-react';
import { seedInitialData, createArticle, importWordPressArticles } from '@/actions/adminActions';
import type { NewsArticle, ReadReceiptWithUser } from '@/types';
import { allNewsArticles } from '@/lib/mockData';

const articleSchema = z.object({
  title: z.string().min(5, 'Der Titel muss mindestens 5 Zeichen lang sein.'),
  snippet: z.string().min(10, 'Die Kurzbeschreibung muss mindestens 10 Zeichen lang sein.'),
  content: z.string().optional(),
  imageUrl: z.string().url('Bitte geben Sie eine gültige Bild-URL ein.').optional().or(z.literal('')),
  author: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

type AdminDashboardClientProps = {
  initialArticles: NewsArticle[];
  initialReceipts: ReadReceiptWithUser[];
  mockArticles: NewsArticle[];
  adminEmail: string;
};

export default function AdminDashboardClient({
  initialArticles,
  initialReceipts,
  mockArticles,
  adminEmail,
}: AdminDashboardClientProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [receipts, setReceipts] = useState<ReadReceiptWithUser[]>(initialReceipts);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedInitialData(mockArticles);
      // Simple reload to show new data. For production, you might update state directly.
      window.location.reload();
      toast({
        title: 'Daten erfolgreich importiert',
        description: `${result.count} Artikel wurden in die Datenbank geschrieben.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Fehler beim Import',
        description: 'Die Beispieldaten konnten nicht importiert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleImportWordPress = async () => {
    setIsImporting(true);
    try {
      const result = await importWordPressArticles();
      window.location.reload(); // Reload to show new articles
      toast({
        title: 'Webseiten-Import erfolgreich',
        description: `${result.count} neue Artikel wurden importiert.`,
      });
      if (result.count > 0) {
          toast({
            title: 'Push-Benachrichtigung (Simuliert)',
            description: 'Eine Benachrichtigung über die neuen Artikel würde jetzt an alle Benutzer gesendet.',
            variant: 'default',
        });
      }
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
      const newArticleData: Omit<NewsArticle, 'id' | 'date'> = {
        ...data,
        imageUrl: data.imageUrl || `https://placehold.co/1200x600.png`,
        author: data.author || 'Geschäftsführung',
        category: 'Unternehmen',
        source: 'internal', // Explicitly set source for internal articles
      };
      const newArticle = await createArticle(newArticleData);
      setArticles([newArticle, ...articles]);
      form.reset();
      toast({
        title: 'Artikel erstellt',
        description: 'Der neue Artikel wurde erfolgreich gespeichert.',
      });
      // Here you would trigger the push notification
      toast({
        title: 'Push-Benachrichtigung (Simuliert)',
        description: 'Eine Benachrichtigung würde jetzt an alle Benutzer gesendet.',
        variant: 'default',
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
                Veröffentlichen Sie hier neue unternehmensinterne News.
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
                     <Button type="button" variant="secondary" disabled>
                        <BellRing className="mr-2" />
                        Push-Benachrichtigung senden (Nächster Schritt)
                     </Button>
                   </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle>Datenbank</CardTitle>
              <CardDescription>
                Wenn die Artikelliste leer ist, können Sie hier die Beispieldaten importieren.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSeedData} disabled={isSeeding || articles.length > 0}>
                {isSeeding ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <UploadCloud className="mr-2" />
                )}
                Beispieldaten importieren
              </Button>
               {articles.length > 0 && <p className="text-xs text-muted-foreground mt-2">Daten bereits vorhanden.</p>}
               <p className="text-xs text-muted-foreground mt-4">Dies schreibt die Artikel aus den ursprünglichen Mock-Daten in Ihre Firestore-Datenbank.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Webseiten-Import
                </CardTitle>
                <CardDescription>
                    Importieren Sie die neuesten Beiträge von den öffentlichen Unternehmenswebseiten.
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
                    Sucht nach neuen Artikeln und fügt sie hier hinzu.
                </p>
            </CardContent>
          </Card>
           <Card>
              <CardHeader>
                  <CardTitle>Info</CardTitle>
                  <CardDescription>Angemeldet als Admin:</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="font-mono text-sm">{adminEmail}</p>
                   <p className="text-xs text-muted-foreground mt-4">
                      Nur Benutzer mit der `admin`-Rolle können diese Seite sehen. Sie können Rollen über Firebase Admin SDK (Custom Claims) vergeben.
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
            Hier sehen Sie, wer welche Artikel gelesen hat.
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
                      <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                        {articleReceipts.length}
                        <Eye className="h-4 w-4" />
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {articleReceipts.length > 0 ? (
                       <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mitarbeiter (E-Mail)</TableHead>
                            <TableHead>Gelesen am</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {articleReceipts.map(receipt => (
                            <TableRow key={receipt.id}>
                              <TableCell>{receipt.user?.email ?? 'Unbekannt'}</TableCell>
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
                  </AccordionContent>
                </AccordionItem>
              )
            }) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Keine Artikel in der Datenbank gefunden.</p>
                    <p className="text-sm mt-2">Bitte importieren Sie die Beispieldaten.</p>
                </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
