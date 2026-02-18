// src/lib/metrics-collector.ts
// 🚨 System Metrics Collector - Prometheus Bridge
// Collects real system metrics and pushes to Supabase

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090/api/v1/query';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SystemMetrics {
  cpu_load: number;
  db_connections: number;
  memory_usage: number;
  status: 'nominal' | 'busy' | 'stress' | 'ghost_detected';
}

/**
 * Query Prometheus for system metrics
 */
async function queryPrometheus(query: string): Promise<number> {
  try {
    const response = await axios.get(PROMETHEUS_URL, {
      params: { query },
      timeout: 5000
    });

    const result = response.data?.data?.result?.[0];
    if (result && result.value && result.value[1]) {
      return parseFloat(result.value[1]);
    }
    
    return 0;
  } catch (error) {
    console.error(`Prometheus query failed: ${query}`, error);
    return 0;
  }
}

/**
 * Collect simulated metrics (fallback when Prometheus unavailable)
 */
function getSimulatedMetrics(): SystemMetrics {
  const cpu_load = Math.floor(Math.random() * 60) + 10; // 10-70%
  const db_connections = Math.floor(Math.random() * 10) + 2; // 2-12 connections
  const memory_usage = Math.floor(Math.random() * 50) + 30; // 30-80%
  
  let status: SystemMetrics['status'] = 'nominal';
  if (cpu_load > 80) status = 'stress';
  else if (cpu_load > 50) status = 'busy';
  
  return {
    cpu_load,
    db_connections,
    memory_usage,
    status
  };
}

/**
 * Collect real metrics from Prometheus
 */
async function collectRealMetrics(): Promise<SystemMetrics> {
  try {
    // CPU Load (100 - idle percentage)
    const cpuQuery = '100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)';
    const cpu_load = await queryPrometheus(cpuQuery);

    // Database Connections
    const dbQuery = 'pg_stat_activity_count';
    const db_connections = await queryPrometheus(dbQuery);

    // Memory Usage
    const memQuery = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100';
    const memory_usage = await queryPrometheus(memQuery);

    // Determine status
    let status: SystemMetrics['status'] = 'nominal';
    if (cpu_load > 85 || memory_usage > 90) {
      status = 'stress';
    } else if (cpu_load > 60 || memory_usage > 75) {
      status = 'busy';
    }

    return {
      cpu_load: Math.max(0, Math.min(100, cpu_load)),
      db_connections: Math.max(0, db_connections),
      memory_usage: Math.max(0, Math.min(100, memory_usage)),
      status
    };
  } catch (error) {
    console.warn('Failed to collect real metrics, using simulated data');
    return getSimulatedMetrics();
  }
}

/**
 * Push metrics to Supabase
 */
async function pushMetricsToSupabase(metrics: SystemMetrics) {
  try {
    const { error } = await supabase
      .from('system_stats')
      .insert({
        cpu_load: metrics.cpu_load,
        db_connections: metrics.db_connections,
        status: metrics.status,
        created_at: new Date().toISOString()
      });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to push metrics to Supabase:', error.message);
    } else {
      // eslint-disable-next-line no-console
      console.log(`📊 Metrics synced: CPU ${metrics.cpu_load.toFixed(1)}% | DB ${metrics.db_connections} | Status: ${metrics.status}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Supabase push error:', error);
  }
}

/**
 * Main metrics collection loop
 */
export async function syncSystemMetrics() {
  // eslint-disable-next-line no-console
  console.log('🚀 Metrics Collector started');
  
  // Collect and push metrics every 10 seconds
  const interval = setInterval(async () => {
    try {
      const metrics = await collectRealMetrics();
      await pushMetricsToSupabase(metrics);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Metrics collection cycle failed:', error);
    }
  }, 10000); // 10 seconds

  // Cleanup on process termination
  process.on('SIGTERM', () => {
    // eslint-disable-next-line no-console
    console.log('🛑 Metrics Collector shutting down...');
    clearInterval(interval);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log('🛑 Metrics Collector interrupted');
    clearInterval(interval);
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  syncSystemMetrics();
}
