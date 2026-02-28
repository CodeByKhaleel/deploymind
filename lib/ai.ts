import { GoogleGenAI } from "@google/genai";
import { DevOpsMetrics } from "./metrics";

export async function generateDevOpsInsights(repoName: string, metrics: DevOpsMetrics) {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  
  const prompt = `
    As a Senior DevOps Architect, analyze the following metrics for the repository "${repoName}" and provide a professional DevOps health summary.
    
    Metrics:
    - Deployment Frequency: ${metrics.deploymentFrequency.toFixed(2)} runs/week
    - Success Rate: ${metrics.successRate.toFixed(1)}%
    - Average Build Time: ${metrics.avgBuildTime.toFixed(1)} minutes
    - PR Merge Frequency: ${metrics.prMergeFrequency.toFixed(2)} PRs/week
    - Overall Health Score: ${metrics.healthScore}/100
    
    Please provide:
    1. A concise summary of the current DevOps state.
    2. Risk detection (e.g., high failure rates, slow builds).
    3. Actionable recommendations for improvement.
    
    Format the output in professional Markdown.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text || "No insights generated.";
}
