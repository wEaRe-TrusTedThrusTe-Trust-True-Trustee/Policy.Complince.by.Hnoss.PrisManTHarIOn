// src/components/LogDashboard.tsx
'use client';

import { motion } from 'framer-motion';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useEffect, useState } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
}

interface LogDashboardProps {
  logs?: LogEntry[];
  maxHeight?: number;
}

export default function LogDashboard({ logs: externalLogs, maxHeight: _maxHeight = 500 }: LogDashboardProps) {
  const { metrics } = useSystemStatus();
  const [logs, setLogs] = useState<LogEntry[]>(externalLogs || []);
  const [currentTime, setCurrentTime] = useState<string>('--:--:--');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    // Use external logs if provided
    if (externalLogs && externalLogs.length > 0) {
      setLogs(externalLogs.slice(0, 15));
      return;
    }

    // Simulate log updates
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: metrics.cpu > 80 ? 'warning' : 'info',
        message: `CPU: ${metrics.cpu.toFixed(1)}% | Connections: ${metrics.activeConnections} | Request Rate: ${metrics.requestRate.toFixed(0)}/s`,
        source: 'monitoring'
      };

      setLogs(prev => [newLog, ...prev].slice(0, 15)); // Keep last 15 logs
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [metrics, externalLogs]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'success': return 'text-emerald-400';
      default: return 'text-cyan-400';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return '📊';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/80 p-6 rounded-2xl border border-white/10 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-cyan-400"
          />
          <h2 className="text-cyan-400 font-mono text-sm tracking-widest uppercase">
            System Logs
          </h2>
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          Last Update: {currentTime}
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">CPU</div>
          <div className={`text-2xl font-bold ${metrics.cpu > 80 ? 'text-red-400' : 'text-cyan-400'}`}>
            {Math.round(metrics.cpu)}%
          </div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Memory</div>
          <div className="text-2xl font-bold text-purple-400">
            {Math.round(metrics.memory)}%
          </div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status</div>
          <div className={`text-sm font-bold ${metrics.errorRate < 5 ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.errorRate < 5 ? '🛡️ SECURED' : '⚠️ ALERT'}
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-2 font-mono text-[11px] max-h-64 overflow-y-auto custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-gray-600 text-center py-8 italic">
            Waiting for system events...
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={`${log.timestamp}-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/30 p-2 rounded border border-white/5 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">{getLevelIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`uppercase tracking-wider ${getLevelColor(log.level)}`}>
                      [{log.source}]
                    </span>
                    <span className="text-gray-600 text-[9px]">
                      {mounted ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}
                    </span>
                  </div>
                  <p className="text-gray-400 break-words">{log.message}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
