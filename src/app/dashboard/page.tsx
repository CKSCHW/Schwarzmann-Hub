
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Newspaper, CalendarCheck2, Users, Settings } from "lucide-react";
import Image from "next/image";
import { getAppointmentsForUser } from "@/actions/dashboardActions";

export const dynamic = 'force-dynamic';

const quickAccessItems = [
  {
    title: "Aktuelle News",
    description: "Lesen Sie alle Unternehmensankündigungen und Updates.",
    icon: Newspaper,
    href: "/",
    cta: "News ansehen",
  },
  {
    title: "Wochenpläne",
    description: "Greifen Sie auf die Wocheneinteilungen Ihres Teams zu.",
    icon: CalendarCheck2,
    href: "/schedule",
    cta: "Pläne ansehen",
  },
  {
    title: "Teamverzeichnis",
    description: "Finden Sie Kontaktinformationen Ihrer Kollegen.",
    icon: Users,
    href: "#", // Placeholder for future feature
    cta: "Verzeichnis öffnen",
    disabled: true,
  },
  {
    title: "Kontoeinstellungen",
    description: "Verwalten Sie Ihr Profil und Ihre Benachrichtigungen.",
    icon: Settings,
    href: "#", // Placeholder
    cta: "Zu den Einstellungen",
    disabled: true,
  }
];

export default async function DashboardPage() {
  const appointments = await getAppointmentsForUser();

  return (
    <div className="space-y-8">
      <section aria-labelledby="dashboard-welcome-title">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-lg bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg">
          <div>
            <h1 id="dashboard-welcome-title" className="text-3xl font-headline font-semibold mb-2">
              Willkommen im Dashboard!
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Ihre zentrale Anlaufstelle für Neuigkeiten, Pläne und Ressourcen.
            </p>
          </div>
           <Image src="https://placehold.co/300x200.png" alt="Dashboard Illustration" width={300} height={200} className="rounded-md object-cover hidden md:block" data-ai-hint="team work" />
        </div>
      </section>

      <section aria-labelledby="quick-access-title">
        <h2 id="quick-access-title" className="text-2xl font-headline font-semibold mb-6">
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickAccessItems.map((item) => (
            <Card key={item.title} className="flex flex-col transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                <item.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
              <CardContent className="pt-0">
                 <Button asChild variant={item.disabled ? "outline" : "default"} className="w-full" disabled={item.disabled}>
                  <Link href={item.href}>
                    {item.cta}
                    {!item.disabled && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="upcoming-events-title">
         <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">Ihre anstehenden Termine</CardTitle>
                <CardDescription>Für Sie und Ihre Gruppen relevante Termine.</CardDescription>
            </CardHeader>
            <CardContent>
                {appointments.length > 0 ? (
                  <ul className="space-y-3">
                      {appointments.map(appointment => (
                          <li key={appointment.id} className="flex items-start justify-between p-3 bg-secondary/50 rounded-md">
                              <div>
                                  <p className="font-medium">{appointment.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                      {new Date(appointment.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                  {appointment.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{appointment.description}</p>
                                  )}
                              </div>
                          </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                      Für Sie sind aktuell keine Termine eingetragen.
                  </p>
                )}
            </CardContent>
         </Card>
      </section>
    </div>
  );
}
