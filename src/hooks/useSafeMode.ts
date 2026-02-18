// src/hooks/useSafeMode.ts
// 🧊 Adaptive Safe-Mode Hook
// Überwacht System-Metriken und aktiviert automatisch Drosselung bei hoher Last

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemStatus } from '@/context/SystemStatusContext';

export interface SafeModeConfig {
  criticalThreshold: number;  // CPU-Last ab der Safe-Mode aktiviert wird (%)
  recoveryThreshold: number;  // CPU-Last unter der Safe-Mode deaktiviert wird (%)
  cooldownDuration: number;   // Mindest-Dauer im Safe-Mode (ms)
}

export interface SafeModeState {
  isSafeMode: boolean;
  reason: 'none' | 'cpu' | 'memory' | 'ghost' | 'manual';
  activatedAt: Date | null;
  canRecover: boolean;
}

const DEFAULT_CONFIG: SafeModeConfig = {
  criticalThreshold: 90,
  recoveryThreshold: 60,
  cooldownDuration: 5000, // 5 Sekunden
};

export function useSafeMode(config: Partial<SafeModeConfig> = {}) {
  const { metrics, systemHealth } = useSystemStatus();
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  const [state, setState] = useState<SafeModeState>({
    isSafeMode: false,
    reason: 'none',
    activatedAt: null,
    canRecover: false,
  });

  // Safe-Mode aktivieren
  const activateSafeMode = useCallback((reason: SafeModeState['reason']) => {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  CRITICAL HEAT DETECTED. ACTIVATING SAFE MODE (Reason: ${reason})`);
    
    setState({
      isSafeMode: true,
      reason,
      activatedAt: new Date(),
      canRecover: false,
    });

    // Optional: API-Call um Backend über Safe-Mode zu informieren
    // fetch('/api/system/safe-mode', { method: 'POST', body: JSON.stringify({ active: true }) });
  }, []);

  // Safe-Mode deaktivieren
  const deactivateSafeMode = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('✅ SYSTEM RECOVERED. DEACTIVATING SAFE MODE.');
    
    setState({
      isSafeMode: false,
      reason: 'none',
      activatedAt: null,
      canRecover: false,
    });

    // Optional: API-Call
    // fetch('/api/system/safe-mode', { method: 'POST', body: JSON.stringify({ active: false }) });
  }, []);

  // CPU-Last überwachen
  useEffect(() => {
    // Safe-Mode aktivieren bei kritischer Last
    if (!state.isSafeMode && metrics.cpu > mergedConfig.criticalThreshold) {
      activateSafeMode('cpu');
    }

    // Ghost-Alarm basierend auf systemHealth
    if (!state.isSafeMode && systemHealth === 'critical') {
      activateSafeMode('ghost');
    }

    // Recovery-Check: Nach Cooldown-Periode prüfen, ob Erholung möglich
    if (state.isSafeMode && state.activatedAt) {
      const elapsed = Date.now() - state.activatedAt.getTime();
      
      if (elapsed > mergedConfig.cooldownDuration) {
        setState(prev => ({ ...prev, canRecover: true }));
      }
    }

    // Automatische Erholung
    if (
      state.isSafeMode &&
      state.canRecover &&
      metrics.cpu < mergedConfig.recoveryThreshold &&
      systemHealth === 'healthy'
    ) {
      deactivateSafeMode();
    }
  }, [
    metrics.cpu,
    systemHealth,
    state.isSafeMode,
    state.activatedAt,
    state.canRecover,
    mergedConfig,
    activateSafeMode,
    deactivateSafeMode,
  ]);

  // Manuelle Steuerung (für Admin-Panel)
  const forceActivate = useCallback(() => {
    activateSafeMode('manual');
  }, [activateSafeMode]);

  const forceDeactivate = useCallback(() => {
    deactivateSafeMode();
  }, [deactivateSafeMode]);

  return {
    ...state,
    config: mergedConfig,
    metrics,
    systemHealth,
    forceActivate,
    forceDeactivate,
  };
}

// UI-Helper: Gibt CSS-Klassen basierend auf Safe-Mode zurück
export function useSafeModeStyles() {
  const { isSafeMode, reason } = useSafeMode();

  const frameClasses = isSafeMode
    ? 'bg-blue-900 shadow-[0_0_50px_rgba(0,100,255,0.5)] transition-all duration-1000'
    : 'bg-[var(--metallic-gradient)] animate-[metallic-pulse_4s_infinite] bg-[length:200%_200%]';

  const textClasses = isSafeMode ? 'blur-sm grayscale' : 'blur-0 grayscale-0';

  const glowClasses = isSafeMode
    ? 'opacity-30 saturate-50'
    : 'opacity-100 saturate-100';

  const pulseSpeed = isSafeMode ? 'animate-pulse-slow' : 'animate-pulse';

  return {
    isSafeMode,
    reason,
    frameClasses,
    textClasses,
    glowClasses,
    pulseSpeed,
  };
}
