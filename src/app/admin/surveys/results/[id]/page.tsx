
import { getSurveyResults } from "@/actions/surveyActions";
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from "@/lib/firebase-admin";
import SurveyResultsClient from "../SurveyResultsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SurveyResultsPage({ params }: { params: { id: string } }) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    const isSurveyManager = user.isAdmin || user.groups?.includes('Projektleiter') || user.groups?.includes('Schulungsleiter');
    if (!isSurveyManager) {
        redirect('/');
    }

    const results = await getSurveyResults(params.id);
    if (!results) {
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
            <SurveyResultsClient results={results} />
        </div>
    )
}
