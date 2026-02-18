// src/components/DancingText.tsx
'use client';

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useSystemStatus } from '@/context/SystemStatusContext';

interface DancingTextProps {
  text: string;
  className?: string;
  variant?: 'stagger' | 'wave' | 'pulse'; // Optional animation variant
}

interface DancingCharacterProps {
  char: string;
  index: number;
  speed: number;
  textColor: string;
  systemHealth: string;
  scrollYProgress: MotionValue<number>;
}

const DancingCharacter = ({ 
  char, 
  index, 
  speed, 
  textColor, 
  systemHealth,
  scrollYProgress 
}: DancingCharacterProps) => {
  const y = useTransform(
    scrollYProgress, 
    [0, 1], 
    [0, index % 2 === 0 ? -speed : speed]
  );

  return (
    <motion.span
      style={{ 
        y, 
        display: 'inline-block', 
        whiteSpace: char === ' ' ? 'pre' : 'normal',
        color: systemHealth === 'healthy' ? textColor : '#9ca3af'
      }}
      initial={{ 
        filter: 'blur(12px)', 
        opacity: 0, 
        scale: 1.5,
        rotateX: 90 
      }}
      whileInView={{ 
        filter: 'blur(0px)', 
        opacity: 1, 
        scale: 1,
        rotateX: 0,
        transition: { 
          delay: index * 0.03 + Math.random() * 0.1,
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1]
        }
      }}
      whileHover={{ 
        scale: 1.4, 
        color: textColor,
        filter: 'blur(0px) drop-shadow(0 0 8px currentColor)',
        transition: { duration: 0.2 } 
      }}
      viewport={{ once: false, amount: 0.5 }}
      className="cursor-default select-none transition-colors duration-300 font-black tracking-tight"
    >
      {char}
    </motion.span>
  );
};

export const DancingText = ({ text, className = '' }: DancingTextProps) => {
  const characters = text.split("");
  const { scrollYProgress } = useScroll();
  const { metrics, systemHealth } = useSystemStatus();

  // Amplitude increases with system load
  const baseAmplitude = metrics.cpu > 80 ? 50 : 20;

  return (
    <div className={`flex flex-wrap justify-center overflow-hidden py-4 ${className}`}>
      {characters.map((char, i) => {
        const speed = Math.random() * baseAmplitude + 10;
        const textColor = metrics.cpu > 80 
          ? '#ff4d4d'
          : metrics.cpu > 50 
          ? '#fbbf24'
          : '#00f7ff';

        return (
          <DancingCharacter
            key={`${char}-${i}`}
            char={char}
            index={i}
            speed={speed}
            textColor={textColor}
            systemHealth={systemHealth}
            scrollYProgress={scrollYProgress}
          />
        );
      })}
    </div>
  );
};
