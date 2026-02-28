import { differenceInMinutes, parseISO, startOfWeek, format } from "date-fns";

export interface DevOpsMetrics {
  deploymentFrequency: number; // Runs per week
  successRate: number; // Percentage
  avgBuildTime: number; // Minutes
  prMergeFrequency: number; // Merged PRs per week
  healthScore: number;
  trends: {
    deployments: { date: string; count: number }[];
    buildDurations: { date: string; duration: number }[];
    successVsFailure: { success: number; failure: number };
    prActivity: { date: string; count: number }[];
  };
}

export function calculateMetrics(data: any): DevOpsMetrics {
  const { workflowRuns, pullRequests, commits } = data;

  // 1. Deployment Frequency (using workflow runs as proxy for deployments)
  const runsByWeek: Record<string, number> = {};
  workflowRuns.forEach((run: any) => {
    const week = format(startOfWeek(parseISO(run.created_at)), "yyyy-MM-dd");
    runsByWeek[week] = (runsByWeek[week] || 0) + 1;
  });

  const weeks = Object.keys(runsByWeek).length || 1;
  const totalRuns = workflowRuns.length;
  const deploymentFrequency = totalRuns / weeks;

  // 2. Success Rate
  const successfulRuns = workflowRuns.filter((run: any) => run.conclusion === "success").length;
  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

  // 3. Average Build Time
  let totalDuration = 0;
  let timedRuns = 0;
  const buildDurations: { date: string; duration: number }[] = [];

  workflowRuns.forEach((run: any) => {
    if (run.conclusion && run.updated_at && run.run_started_at) {
      const duration = differenceInMinutes(parseISO(run.updated_at), parseISO(run.run_started_at));
      if (duration > 0) {
        totalDuration += duration;
        timedRuns++;
        buildDurations.push({
          date: format(parseISO(run.created_at), "MMM dd"),
          duration,
        });
      }
    }
  });

  const avgBuildTime = timedRuns > 0 ? totalDuration / timedRuns : 0;

  // 4. PR Merge Frequency
  const mergedPRs = pullRequests.filter((pr: any) => pr.merged_at).length;
  const prMergeFrequency = mergedPRs / weeks;

  // 5. Health Score (Simple weighted average)
  // Success Rate (40%), Deployment Frequency (30%), Avg Build Time (20% - lower is better), PR Activity (10%)
  const buildTimeScore = Math.max(0, 100 - avgBuildTime * 2); // Penalty for long builds
  const freqScore = Math.min(100, deploymentFrequency * 10); // Reward for frequent deploys
  const healthScore = (successRate * 0.4) + (freqScore * 0.3) + (buildTimeScore * 0.2) + (Math.min(100, prMergeFrequency * 20) * 0.1);

  // Trends
  const deploymentsTrend = Object.entries(runsByWeek).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  
  const prByWeek: Record<string, number> = {};
  pullRequests.forEach((pr: any) => {
    const week = format(startOfWeek(parseISO(pr.created_at)), "yyyy-MM-dd");
    prByWeek[week] = (prByWeek[week] || 0) + 1;
  });
  const prActivityTrend = Object.entries(prByWeek).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    deploymentFrequency,
    successRate,
    avgBuildTime,
    prMergeFrequency,
    healthScore: Math.round(healthScore),
    trends: {
      deployments: deploymentsTrend,
      buildDurations: buildDurations.slice(0, 10).reverse(),
      successVsFailure: {
        success: successfulRuns,
        failure: totalRuns - successfulRuns,
      },
      prActivity: prActivityTrend,
    },
  };
}
