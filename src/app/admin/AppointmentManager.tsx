
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Loader2, PlusCircle, Trash2, CalendarPlus, Edit } from 'lucide-react';

import { createAppointment, deleteAppointment, updateAppointment } from '@/actions/adminActions';
import type { Appointment, UserGroup } from '@/types';
import { userGroups } from '@/types';
import { cn } from '@/lib/utils';


const appointmentSchema = z.object({
  title: z.string().min(3, 'Der Titel muss mindestens 3 Zeichen lang sein.'),
  date: z.date({
    required_error: 'Ein Datum ist erforderlich.',
  }),
  description: z.string().optional(),
  groups: z.array(z.string()),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentManagerProps {
  initialAppointments: Appointment[];
}

export default function AppointmentManager({ initialAppointments }: AppointmentManagerProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: '',
      description: '',
      groups: [],
    },
  });

  const handleEditClick = (appointment: Appointment) => {
    setEditingId(appointment.id);
    form.reset({
      title: appointment.title,
      description: appointment.description || '',
      date: new Date(appointment.date),
      groups: appointment.groups || [],
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({
      title: '',
      description: '',
      groups: [],
      date: undefined,
    });
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    try {
      const appointmentData = {
        ...data,
        date: data.date.toISOString(),
        groups: data.groups as UserGroup[],
      };
      
      if (editingId) {
        const updatedAppointment = await updateAppointment(editingId, appointmentData);
        setAppointments((prev) => 
          prev.map((a) => a.id === editingId ? updatedAppointment : a)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
        toast({
          title: 'Termin aktualisiert',
          description: `Der Termin "${updatedAppointment.title}" wurde erfolgreich geändert.`,
        });
      } else {
        const newAppointment = await createAppointment(appointmentData);
        setAppointments((prev) => 
          [newAppointment, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
        toast({
          title: 'Termin erstellt',
          description: `Der Termin "${newAppointment.title}" wurde erfolgreich gespeichert.`,
        });
      }
      handleCancelEdit();
    } catch (error) {
      toast({
        title: editingId ? 'Fehler beim Aktualisieren' : 'Fehler beim Erstellen',
        description: 'Der Termin konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: 'Termin gelöscht',
        description: 'Der Termin wurde erfolgreich entfernt.',
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Löschen',
        description: 'Der Termin konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Edit className="h-5 w-5" /> : <CalendarPlus className="h-5 w-5" />}
              {editingId ? 'Termin bearbeiten' : 'Neuen Termin erstellen'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Ändern Sie die Details des Termins.' : 'Erstellen Sie Termine für bestimmte Mitarbeitergruppen.'}
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
                        <Input placeholder="Betriebsversammlung..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Datum und Uhrzeit</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: de })
                              ) : (
                                <span>Datum auswählen</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < today}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details zum Termin..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="groups"
                  render={() => (
                    <FormItem>
                       <div className="mb-4">
                        <FormLabel className="text-base">Gruppen zuweisen</FormLabel>
                        <p className="text-sm text-muted-foreground">
                            Wählen Sie aus, wer diesen Termin sehen soll. Wenn Sie keine Gruppe auswählen, ist der Termin für alle sichtbar.
                        </p>
                       </div>
                      <div className="grid grid-cols-2 gap-2">
                        {userGroups.map((group) => (
                          <FormField
                            key={group}
                            control={form.control}
                            name="groups"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={group}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(group)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), group])
                                          : field.onChange(field.value?.filter((value) => value !== group));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{group}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : editingId ? (
                      <Edit className="mr-2" />
                    ) : (
                      <PlusCircle className="mr-2" />
                    )}
                    {editingId ? 'Änderungen speichern' : 'Termin speichern'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Abbrechen
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Bestehende Termine</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Gruppen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.title}</TableCell>
                      <TableCell>{new Date(appointment.date).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell className="text-xs">{appointment.groups.length > 0 ? appointment.groups.join(', ') : 'Alle'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(appointment)}
                            disabled={isSubmitting}
                            aria-label="Termin bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(appointment.id)}
                            disabled={isDeleting === appointment.id}
                            aria-label="Termin löschen"
                          >
                            {isDeleting === appointment.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      Keine Termine gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
