import { GoogleGenerativeAI } from "@google/generative-ai";

const globalForGemini = globalThis as unknown as {
  geminiClient: GoogleGenerativeAI | undefined;
};

export const geminiClient =
  globalForGemini.geminiClient ??
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

if (process.env.NODE_ENV !== "production")
  globalForGemini.geminiClient = geminiClient;

export function getGeminiModel() {
  return geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export async function analyzeImageWithGemini({
  imageData,
  mimeType,
  prompt,
}: {
  imageData: Buffer;
  mimeType: string;
  prompt: string;
}): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageData.toString("base64"),
        mimeType,
      },
    },
  ]);
  return result.response.text();
}

export async function analyzeVideoWithGemini({
  videoData,
  mimeType,
  prompt,
}: {
  videoData: Buffer;
  mimeType: string;
  prompt: string;
}): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: videoData.toString("base64"),
        mimeType,
      },
    },
  ]);
  return result.response.text();
}
