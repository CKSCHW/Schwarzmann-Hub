
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Zap, KeyRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function setSessionCookie(idToken: string) {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect sets up the reCAPTCHA verifier once the component mounts.
    // It's invisible to the user.
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    } catch (error) {
      console.error("Error setting up reCAPTCHA", error);
      toast({
        title: "Sicherheits-Check Fehler",
        description: "Das reCAPTCHA konnte nicht initialisiert werden. Bitte laden Sie die Seite neu.",
        variant: "destructive"
      });
    }
  }, [toast]);


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      await setSessionCookie(idToken);
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Anmeldefehler',
        description: 'E-Mail oder Passwort ist falsch. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLoginSendCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!phoneNumber) {
        toast({ title: "Fehlende Angabe", description: "Bitte geben Sie eine Telefonnummer ein." });
        return;
      }
      setIsLoading(true);
      try {
        const appVerifier = window.recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setIsCodeSent(true);
        toast({
          title: "Code gesendet",
          description: `Ein Bestätigungscode wurde an ${phoneNumber} gesendet.`,
        });
      } catch (error) {
        console.error("SMS send error:", error);
        toast({
          title: 'Fehler beim Senden des Codes',
          description: 'Der Code konnte nicht gesendet werden. Bitte prüfen Sie die Nummer und versuchen Sie es erneut.',
          variant: 'destructive',
        });
        setIsCodeSent(false);
      } finally {
        setIsLoading(false);
      }
  };

  const handlePhoneLoginVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!verificationCode || !confirmationResult) return;
      setIsLoading(true);
      try {
        const result = await confirmationResult.confirm(verificationCode);
        const idToken = await result.user.getIdToken();
        await setSessionCookie(idToken);
        router.push('/');
      } catch (error) {
         console.error("Code verification error:", error);
         toast({
          title: 'Ungültiger Code',
          description: 'Der eingegebene Code ist falsch. Bitte versuchen Sie es erneut.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
          <div className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              <span className="text-2xl font-headline font-semibold">Schwarzmann App</span>
          </div>

        <Card className="w-full">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">E-Mail</TabsTrigger>
              <TabsTrigger value="phone">Telefon</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl">Anmelden</CardTitle>
                  <CardDescription>Geben Sie Ihre E-Mail & Passwort ein.</CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="max@mustermann.at"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Passwort</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Anmelden...' : 'Anmelden'}
                    </Button>
                  </CardFooter>
                </form>
            </TabsContent>
            
            <TabsContent value="phone">
                 <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl">Anmelden</CardTitle>
                  <CardDescription>Nutzen Sie Ihre Telefonnummer.</CardDescription>
                </CardHeader>
                {!isCodeSent ? (
                    <form onSubmit={handlePhoneLoginSendCode}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                            <Label htmlFor="phone">Telefonnummer</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+43 664 1234567"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={isLoading}
                            />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Senden...' : 'Code anfordern'}
                            </Button>
                        </CardFooter>
                    </form>
                ) : (
                     <form onSubmit={handlePhoneLoginVerifyCode}>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-center text-muted-foreground">
                                Ein Code wurde an {phoneNumber} gesendet.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="code">Bestätigungscode</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="123456"
                                    required
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    disabled={isLoading}
                                    maxLength={6}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <KeyRound className="animate-spin" /> : 'Verifizieren & Anmelden'}
                            </Button>
                             <Button variant="link" size="sm" onClick={() => setIsCodeSent(false)} disabled={isLoading}>
                                Andere Nummer verwenden
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </TabsContent>
          </Tabs>
        </Card>
        
        <div id="recaptcha-container"></div>

        <p className="px-8 text-center text-sm text-muted-foreground">
            Bitte verwenden Sie die vom Unternehmen bereitgestellten Anmeldedaten.
        </p>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
