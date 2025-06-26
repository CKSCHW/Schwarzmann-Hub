
import SurveyForm from "../../SurveyForm";
import { getUsersWithGroups } from '@/actions/adminActions';
import { getSurveyForEditing } from '@/actions/surveyActions';
import { getCurrentUser } from "@/lib/firebase-admin";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function EditSurveyPage({ params }: { params: { id: string } }) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    const isSurveyManager = user.isAdmin || user.groups?.includes('Projektleiter') || user.groups?.includes('Schulungsleiter');
    if (!isSurveyManager) {
        redirect('/');
    }

    const { id } = params;

    const [survey, allUsers] = await Promise.all([
        getSurveyForEditing(id),
        getUsersWithGroups()
    ]);

    if (!survey) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto">
             <Button asChild variant="outline" className="mb-4">
                <Link href="/admin?tab=surveys">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Übersicht
                </Link>
            </Button>
            <header className="mb-6 mt-4">
                <h1 className="text-3xl font-bold">Umfrage bearbeiten</h1>
                <p className="text-muted-foreground mt-1">Passe die Details der Umfrage an.</p>
            </header>
            <SurveyForm allUsers={allUsers} currentUser={user} mode="edit" initialData={survey} />
        </div>
    )
}
