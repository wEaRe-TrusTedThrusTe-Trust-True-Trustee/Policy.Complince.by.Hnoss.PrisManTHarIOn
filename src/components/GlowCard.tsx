// src/components/GlowCard.tsx
'use client';

import { motion } from 'framer-motion';

const glowColors = {
  cyan: 'rgba(0, 255, 255, 0.5)',
  purple: 'rgba(147, 51, 234, 0.5)',
  blue: 'rgba(59, 130, 246, 0.5)',
  emerald: 'rgba(16, 185, 129, 0.5)',
  gold: 'rgba(255, 215, 0, 0.5)',
  pink: 'rgba(236, 72, 153, 0.5)',
  silver: 'rgba(192, 192, 192, 0.5)',
  platinum: 'rgba(220, 220, 230, 0.5)',
  copper: 'rgba(184, 115, 51, 0.5)',
  rose: 'rgba(255, 130, 171, 0.5)',
};

interface GlowCardProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
  variant?: 'gold' | 'silver' | 'platinum' | 'copper' | 'rose' | 'cyan';
}

export const GlowCard = ({ children, index: _index, className = '', variant }: GlowCardProps) => {
  const color = variant ? glowColors[variant] : glowColors.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0px 0px 30px 8px ${color}, inset 0px 0px 15px 2px ${color}`,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      className={`relative p-6 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm ${className}`}
    >
      {/* Der subtile Hintergrund-Glow im Case */}
      <motion.div 
        className="absolute -inset-px opacity-0 pointer-events-none"
        whileHover={{ opacity: 0.15 }}
        transition={{ duration: 0.5 }}
        style={{ 
          background: `radial-gradient(circle at center, ${color}, transparent 70%)` 
        }}
      />
      
      {/* Animated border gradient */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-50"
        style={{
          background: `linear-gradient(45deg, ${color}, transparent, ${color})`,
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 3s ease infinite',
          maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
        }}
      />
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
