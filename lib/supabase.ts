import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase credentials missing. Database features will be disabled.");
      return null;
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export async function saveMetricsSnapshot(repoName: string, metrics: any) {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("repo_metrics")
    .insert([
      {
        repo_name: repoName,
        success_rate: metrics.successRate,
        avg_build_time: metrics.avgBuildTime,
        deployment_frequency: metrics.deploymentFrequency,
      },
    ]);

  if (error) {
    console.error("Supabase insert error:", error);
    return null;
  }
  return data;
}
