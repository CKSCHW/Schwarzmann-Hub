
import SurveyForm from "../SurveyForm";
import { getUsersWithGroups } from '@/actions/adminActions';
import { getCurrentUser } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CreateSurveyPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    const isSurveyManager = user.isAdmin || user.groups?.includes('Projektleiter') || user.groups?.includes('Schulungsleiter');
    if (!isSurveyManager) {
        redirect('/');
    }
    
    const allUsers = await getUsersWithGroups();

    return (
        <div className="max-w-4xl mx-auto">
            <Button asChild variant="outline" className="mb-4">
                <Link href="/admin?tab=surveys">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Übersicht
                </Link>
            </Button>
            <header className="mb-6 mt-4">
                <h1 className="text-3xl font-bold">Neue Umfrage erstellen</h1>
                <p className="text-muted-foreground mt-1">Fülle die Details aus, um eine neue anonyme Umfrage zu veröffentlichen.</p>
            </header>
            <SurveyForm allUsers={allUsers} currentUser={user} mode="create" />
        </div>
    )
}
