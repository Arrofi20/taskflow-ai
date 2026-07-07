const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiGenerateRequest = {
  contents: Array<{
    role: "user";
    parts: Array<{ text: string }>;
  }>;
  generationConfig: {
    responseMimeType: "application/json";
    responseSchema: Record<string, unknown>;
    temperature: number;
  };
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY environment variable in .env.local",
    );
  }

  return apiKey;
}

export async function generateGeminiJson<T>(
  prompt: string,
  responseSchema: Record<string, unknown>,
): Promise<T> {
  const body: GeminiGenerateRequest = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": getGeminiApiKey(),
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as GeminiGenerateResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ?? `Gemini API request failed (${response.status})`,
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini API returned an empty response.");
  }

  return JSON.parse(text) as T;
}
