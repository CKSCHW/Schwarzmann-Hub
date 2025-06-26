
import { getSurveyById } from "@/actions/surveyActions";
import { notFound } from 'next/navigation';
import SurveyForm from "./SurveyForm";

export const dynamic = 'force-dynamic';

export default async function TakeSurveyPage({ params }: { params: { id: string } }) {
    const survey = await getSurveyById(params.id);

    if (!survey) {
        notFound();
    }
    
    // Here you could also check if the user has already completed it,
    // though the action itself prevents re-submission.
    // A check here could provide a friendlier message.

    return (
        <div className="max-w-2xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">{survey.title}</h1>
                <p className="text-muted-foreground">{survey.description}</p>
            </header>
            <SurveyForm survey={survey} />
        </div>
    );
}
