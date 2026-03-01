"use server";

import { GoogleGenAI } from "@google/genai";
import { DevOpsMetrics } from "./metrics";

export async function generateDevOpsInsights(repoName: string, metrics: DevOpsMetrics) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return "⚠️ **Configuration Error**: `GEMINI_API_KEY` is not set in the `.env` file. Please set it to generate AI insights.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    As a highly precise Senior DevOps Architect, analyze the following metrics for the repository "${repoName}" and provide a deeply analytical and professional DevOps health summary.
    
    Metrics:
    - Deployment Frequency: ${metrics.deploymentFrequency.toFixed(2)} runs/week
    - Success Rate: ${metrics.successRate.toFixed(1)}%
    - Successful Runs: ${metrics.trends.successVsFailure.success}
    - Failed Runs: ${metrics.trends.successVsFailure.failure}
    - Average Build Time: ${metrics.avgBuildTime.toFixed(1)} minutes
    - PR Merge Frequency: ${metrics.prMergeFrequency.toFixed(2)} PRs/week
    - Overall Health Score: ${metrics.healthScore}/100
    
    Provide your analysis structured strictly as follows:
    1. **Concise Summary**: A precise overview of the current DevOps state, referencing specific numbers.
    2. **Risk Detection**: Highly specific identification of risks (e.g., exact failure rates, anomalies in build times, or merge bottlenecks).
    3. **Actionable Recommendations**: Clear, step-by-step strategies for immediate improvement.
    
    Format the output in professional, STRICT Markdown only. DO NOT output any HTML tags (e.g., do not use <span>, <div>, or any other HTML elements). Use markdown syntax for tables, bolding, and structuring. Be direct, concise, and highly analytical.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text || "No insights generated.";
}
