import React from 'react';
import { motion } from 'framer-motion';

function tierColor(tier) {
  if (tier === 'Strong') return 'bg-green-500 text-white';
  if (tier === 'Medium') return 'bg-yellow-500 text-black';
  if (tier === 'Weak') return 'bg-orange-500 text-white';
  return 'bg-red-600 text-white';
}

function tierBgColor(tier) {
  if (tier === 'Strong') return '#16a34a';
  if (tier === 'Medium') return '#f59e0b';
  if (tier === 'Weak') return '#fb923c';
  return '#ef4444';
}

function tierText(tier) {
  if (tier === 'Strong') return 'قوي';
  if (tier === 'Medium') return 'متوسط';
  if (tier === 'Weak') return 'ضعيف';
  return 'لا يمكن التشغيل';
}

export default function GameResultBadge({ perf }) {
  if (!perf || !perf.score) return null;
  
  const { score, tier } = perf;
  const pct = Math.round(score * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="game-result-badge mb-4"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 160, flex: 1 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 18,
            color: 'var(--text-primary)',
            marginBottom: 8
          }}>
            {tierText(tier)} • {pct}%
          </div>
          <div style={{ 
            height: 10, 
            background: '#2b3940', 
            borderRadius: 6, 
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ 
                width: `${pct}%`, 
                height: '100%', 
                background: tierBgColor(tier),
                borderRadius: 6
              }} 
            />
          </div>
        </div>
        <div 
          className={tierColor(tier)} 
          style={{ 
            padding: '6px 12px', 
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: 'nowrap'
          }}
        >
          {tierText(tier)}
        </div>
      </div>
    </motion.div>
  );
}

