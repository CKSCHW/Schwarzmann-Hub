
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Newspaper, CalendarCheck2, Users, Settings } from "lucide-react";
import Image from "next/image";

const quickAccessItems = [
  {
    title: "Latest News",
    description: "Catch up on all company announcements and updates.",
    icon: Newspaper,
    href: "/",
    cta: "View News",
  },
  {
    title: "Weekly Schedules",
    description: "Access your team's Wocheneinteilungen.",
    icon: CalendarCheck2,
    href: "/schedule",
    cta: "View Schedules",
  },
  {
    title: "Team Directory",
    description: "Find contact information for your colleagues.",
    icon: Users,
    href: "#", // Placeholder for future feature
    cta: "Open Directory",
    disabled: true,
  },
  {
    title: "Account Settings",
    description: "Manage your profile and notification preferences.",
    icon: Settings,
    href: "#", // Placeholder
    cta: "Go to Settings",
    disabled: true,
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="dashboard-welcome-title">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-lg bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg">
          <div>
            <h1 id="dashboard-welcome-title" className="text-3xl font-headline font-semibold mb-2">
              Welcome to Your Dashboard!
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Your central hub for company news, schedules, and resources.
            </p>
          </div>
           <Image src="https://placehold.co/300x200.png" alt="Dashboard illustration" width={300} height={200} className="rounded-md object-cover hidden md:block" data-ai-hint="team work" />
        </div>
      </section>

      <section aria-labelledby="quick-access-title">
        <h2 id="quick-access-title" className="text-2xl font-headline font-semibold mb-6">
          Quick Access
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
                <CardTitle className="text-xl font-headline">Upcoming Events & Deadlines</CardTitle>
                <CardDescription>Stay informed about important dates.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Placeholder for events list or calendar integration */}
                <ul className="space-y-3">
                    <li className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                        <div>
                            <p className="font-medium">Quarterly Review Meeting</p>
                            <p className="text-sm text-muted-foreground">August 15, 2024 - 10:00 AM</p>
                        </div>
                        <Button variant="outline" size="sm" disabled>Details</Button>
                    </li>
                    <li className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                        <div>
                            <p className="font-medium">Project Alpha Deadline</p>
                            <p className="text-sm text-muted-foreground">August 20, 2024</p>
                        </div>
                         <Button variant="outline" size="sm" disabled>View Project</Button>
                    </li>
                </ul>
                <p className="text-center text-muted-foreground mt-4">
                    More event details will be available soon.
                </p>
            </CardContent>
         </Card>
      </section>
    </div>
  );
}
