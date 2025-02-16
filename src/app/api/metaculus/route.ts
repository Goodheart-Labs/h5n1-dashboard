const METACULUS_API = "https://www.metaculus.com/api";

export async function GET(request: Request) {
  try {
    // Get questionId from URL params
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return Response.json(
        { error: "Question ID is required" },
        { status: 400 },
      );
    }

    const questionResponse = await fetch(
      `${METACULUS_API}/posts/${questionId}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!questionResponse.ok) {
      const errorText = await questionResponse.text();
      console.error("Error response body:", errorText);

      return Response.json(
        {
          error: "Failed to fetch Metaculus data",
          status: questionResponse.status,
          details: errorText,
        },
        { status: questionResponse.status },
      );
    }

    const questionData = await questionResponse.json();
    return Response.json(questionData, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching Metaculus data:", error);
    return Response.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
        },
      },
    );
  }
}
