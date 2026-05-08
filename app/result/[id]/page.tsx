import { ResultView } from "@/components/ResultView";
import { requireDiagnostic } from "@/lib/services/diagnosticService";

type ResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const diagnostic = await requireDiagnostic(id);

  return <ResultView diagnostic={diagnostic} />;
}
