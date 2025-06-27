'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Search, Send } from 'lucide-react';
import type { SimpleUser } from '@/types';
import { sendCustomPushNotification } from '@/actions/adminActions';

const notificationSchema = z.object({
  title: z.string().min(3, 'Der Titel muss mindestens 3 Zeichen haben.'),
  body: z.string().min(5, 'Die Nachricht muss mindestens 5 Zeichen haben.'),
  url: z.string().optional().or(z.literal('')),
  userIds: z.array(z.string()).min(1, 'Du musst mindestens einen Empfänger auswählen.'),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface CustomNotifierProps {
  allUsers: SimpleUser[];
}

export default function CustomNotifier({ allUsers }: CustomNotifierProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      body: '',
      url: '/',
      userIds: [],
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: NotificationFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await sendCustomPushNotification(data.userIds, {
        title: data.title,
        body: data.body,
        url: data.url || '/',
      });
      if (result.success) {
        toast({ title: 'Erfolg', description: result.message });
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredUsers = allUsers.filter(user => {
      const name = user.displayName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search);
  });
  
  const selectedUserCount = form.watch('userIds').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Individuelle Benachrichtigung senden</CardTitle>
        <CardDescription>
          Sende eine gezielte Push-Benachrichtigung an ausgewählte Benutzer. Diese wird nicht im Benachrichtigungs-Verlauf gespeichert.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl><Input {...field} placeholder="Erinnerung: Impftermin" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="body" render={({ field }) => (
              <FormItem>
                <FormLabel>Nachricht</FormLabel>
                <FormControl><Textarea {...field} placeholder="Dein Impftermin ist morgen um 10:00 Uhr." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="url" render={({ field }) => (
              <FormItem>
                <FormLabel>Link (Optional)</FormLabel>
                <FormControl><Input {...field} placeholder="z.B. /surveys oder eine externe URL" /></FormControl>
                <FormMessage />
                 <p className="text-xs text-muted-foreground">Der Link, der beim Klick auf die Benachrichtigung geöffnet wird. Standard ist die Startseite ('/').</p>
              </FormItem>
            )} />

            <FormField control={form.control} name="userIds" render={({ field }) => (
              <FormItem>
                <FormLabel>Empfänger</FormLabel>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      {selectedUserCount > 0 ? `${selectedUserCount} Empfänger ausgewählt` : 'Empfänger auswählen'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Empfänger auswählen</DialogTitle>
                      <DialogDescription>Wähle die Benutzer aus, die diese Benachrichtigung erhalten sollen.</DialogDescription>
                    </DialogHeader>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Suchen nach Name oder E-Mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <ScrollArea className="h-72 border rounded-md">
                      <div className="p-4 space-y-2">
                        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                          <div key={user.uid} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user.uid}`}
                              checked={field.value?.includes(user.uid)}
                              onCheckedChange={(checked) => {
                                const currentAssigned = field.value || [];
                                if (checked) {
                                  field.onChange([...currentAssigned, user.uid]);
                                } else {
                                  field.onChange(currentAssigned.filter(id => id !== user.uid));
                                }
                              }}
                            />
                            <label htmlFor={`user-${user.uid}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {user.displayName || user.email}
                            </label>
                          </div>
                        )) : (
                          <p className="p-4 text-center text-sm text-muted-foreground">
                            Keine Benutzer für die Suche gefunden.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                    <DialogFooter>
                      <Button type="button" onClick={() => setIsUserDialogOpen(false)}>
                        Auswahl bestätigen
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                Benachrichtigung senden
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
