interface Answer {
  text: string;
  prob: number;
  probChanges: {
    day: number;
    week: number;
    month: number;
  };
}

export interface ManifoldGroupedData {
  id: string;
  question: string;
  answers: Answer[];
  min: number;
  max: number;
}

export function transformManifoldDataForChart(
  data: ManifoldGroupedData,
): { date: string; value: number }[] {
  return data.answers.map((answer) => ({
    date: answer.text.split("-")[0], // Extract first year from range
    value: answer.prob * 100, // Convert to percentage
  }));
}

export async function getManifoldGroupedData(
  slug: string,
): Promise<ManifoldGroupedData> {
  const response = await fetch(`/api/manifold-grouped?slug=${slug}`);
  if (!response.ok) throw new Error("Failed to fetch manifold grouped data");
  return response.json();
}
