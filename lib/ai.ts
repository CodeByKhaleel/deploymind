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
    As a Senior DevOps Architect, analyze the following metrics for the repository "${repoName}" and provide a professional DevOps health summary.
    
    Metrics:
    - Deployment Frequency: ${metrics.deploymentFrequency.toFixed(2)} runs/week
    - Success Rate: ${metrics.successRate.toFixed(1)}%
    - Average Build Time: ${metrics.avgBuildTime.toFixed(1)} minutes
    - PR Merge Frequency: ${metrics.prMergeFrequency.toFixed(2)} PRs/week
    - Overall Health Score: ${metrics.healthScore}/100
    
    1. A concise summary of the current DevOps state.
    2. Risk detection (e.g., high failure rates, slow builds).
    3. Actionable recommendations for improvement.
    
    Format the output in professional, STRICT Markdown only. DO NOT output any HTML tags (e.g., do not use <span>, <div>, or any other HTML elements). Use markdown syntax for tables, bolding, colors (if any syntax highlighting), etc.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text || "No insights generated.";
}
