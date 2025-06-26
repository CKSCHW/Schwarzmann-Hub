
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Save } from 'lucide-react';
import type { SimpleUser } from '@/types';
import { updateUserProfile } from '@/actions/userActions';

// Schema for profile data
const profileSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich.'),
  lastName: z.string().min(1, 'Nachname ist erforderlich.'),
  title: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

// Schema for password change
const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
}).refine(data => {
  // Only validate if a password is being changed
  if (data.newPassword || data.confirmPassword) {
    return data.newPassword.length >= 6;
  }
  return true;
}, {
  message: "Das neue Passwort muss mindestens 6 Zeichen lang sein.",
  path: ['newPassword'],
}).refine(data => {
  if (data.newPassword || data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Die Passwörter stimmen nicht überein.",
  path: ['confirmPassword'],
}).refine(data => {
  if (data.newPassword || data.confirmPassword) {
    return !!data.currentPassword;
  }
  return true;
}, {
    message: "Dein aktuelles Passwort ist erforderlich, um es zu ändern.",
    path: ["currentPassword"],
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ProfileClientProps {
  user: SimpleUser;
}

export default function ProfileClient({ user: initialUser }: ProfileClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: initialUser.firstName || '',
      lastName: initialUser.lastName || '',
      title: initialUser.title || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    const formData = new FormData();
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('title', data.title || '');

    const result = await updateUserProfile(formData);
    if (result.success) {
      toast({ title: 'Erfolg', description: result.message });
    } else {
      toast({ title: 'Fehler', description: result.message, variant: 'destructive' });
    }
    setIsUpdatingProfile(false);
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user || !data.newPassword) {
      toast({ title: 'Info', description: 'Gib ein neues Passwort ein, um es zu ändern.', variant: 'default' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);
      toast({ title: 'Erfolg', description: 'Dein Passwort wurde erfolgreich geändert.' });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Password change error:", error);
      let description = 'Ein unerwarteter Fehler ist aufgetreten.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Dein aktuelles Passwort ist nicht korrekt.';
      } else if (error.code === 'auth/weak-password') {
        description = 'Das neue Passwort ist zu schwach.';
      }
      toast({ title: 'Fehler bei Passwortänderung', description, variant: 'destructive' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profilinformationen</CardTitle>
          <CardDescription>
            Passe deinen Namen und deine Berufsbezeichnung an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachname</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={profileForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel / Position (optional)</FormLabel>
                  <FormControl><Input placeholder="z.B. Monteur, Techniker" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
                Profil speichern
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
          <CardDescription>
            Gib dein aktuelles und ein neues Passwort ein, um es zu ändern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Aktuelles Passwort</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Neues Passwort</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Neues Passwort bestätigen</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? <Loader2 className="animate-spin" /> : <KeyRound className="mr-2" />}
                Passwort ändern
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
