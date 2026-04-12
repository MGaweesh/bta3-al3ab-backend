import React from 'react';
import { motion } from 'framer-motion';

function tierColor(tier) {
  const t = (tier || '').toLowerCase();
  if (t === 'ultra') return 'bg-purple-600 text-white';
  if (t === 'high') return 'bg-blue-500 text-white';
  if (t === 'medium') return 'bg-yellow-500 text-black';
  if (t === 'low') return 'bg-orange-500 text-white';
  if (t === 'very low') return 'bg-red-500 text-white';
  if (t === 'cannot run') return 'bg-red-700 text-white';
  // Legacy support
  if (t === 'strong') return 'bg-green-500 text-white';
  if (t === 'weak') return 'bg-orange-500 text-white';
  return 'bg-red-600 text-white';
}

function tierBgColor(tier) {
  const t = (tier || '').toLowerCase();
  if (t === 'ultra') return '#9333ea';
  if (t === 'high') return '#3b82f6';
  if (t === 'medium') return '#f59e0b';
  if (t === 'low') return '#fb923c';
  if (t === 'very low') return '#ef4444';
  if (t === 'cannot run') return '#b91c1c';
  if (t === 'strong') return '#16a34a';
  if (t === 'weak') return '#fb923c';
  return '#ef4444';
}

function tierText(tier) {
  const t = (tier || '').toLowerCase();
  if (t === 'ultra') return '🔥 ألترا';
  if (t === 'high') return '⚡ عالي';
  if (t === 'medium') return '✅ متوسط';
  if (t === 'low') return '⚠️ منخفض';
  if (t === 'very low') return '🔻 ضعيف جداً';
  if (t === 'cannot run') return '❌ لا يمكن التشغيل';
  if (t === 'strong') return '✅ قوي';
  if (t === 'weak') return '⚠️ ضعيف';
  return '❓ غير معروف';
}

function tierCanRun(tier) {
  const t = (tier || '').toLowerCase();
  return t === 'ultra' || t === 'high' || t === 'medium' || t === 'low' || t === 'strong';
}

function getBottleneck(perf) {
  if (!perf) return null;
  const { cpuScore, gpuScore, ramScore, storageScore } = perf;
  
  // Find the weakest component
  const components = [
    { name: 'المعالج (CPU)', score: cpuScore ?? 100, icon: '💻' },
    { name: 'كارت الشاشة (GPU)', score: gpuScore ?? 100, icon: '🎨' },
    { name: 'الذاكرة (RAM)', score: ramScore ?? 100, icon: '🧠' },
    { name: 'التخزين', score: storageScore ?? 100, icon: '💾' },
  ];
  
  const sorted = [...components].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  
  // If all scores are high, no bottleneck
  if (weakest.score >= 90) return null;
  
  // Calculate bottleneck severity
  const diff = strongest.score - weakest.score;
  if (diff < 15) return null; // No significant bottleneck
  
  let severity = 'mild';
  let severityText = 'طفيف';
  let severityColor = '#f59e0b';
  if (diff >= 50) {
    severity = 'severe';
    severityText = 'شديد';
    severityColor = '#ef4444';
  } else if (diff >= 30) {
    severity = 'moderate';
    severityText = 'متوسط';
    severityColor = '#fb923c';
  }
  
  return {
    component: weakest,
    severity,
    severityText,
    severityColor,
    diff,
    suggestion: getSuggestion(weakest.name, weakest.score),
  };
}

function getSuggestion(componentName, score) {
  if (componentName.includes('CPU') || componentName.includes('المعالج')) {
    if (score < 30) return 'يُنصح بشدة بترقية المعالج — أداء اللعبة سيكون محدوداً جداً';
    if (score < 60) return 'ترقية المعالج ستحسن الأداء بشكل ملحوظ';
    return 'المعالج قريب من الحد الأدنى — قد تلاحظ تقطعات في المشاهد المعقدة';
  }
  if (componentName.includes('GPU') || componentName.includes('الشاشة')) {
    if (score < 30) return 'كارت الشاشة غير كافٍ — يُنصح بترقيته لتجربة أفضل';
    if (score < 60) return 'ترقية كارت الشاشة ستحسن جودة الرسوميات بشكل كبير';
    return 'كارت الشاشة قريب من الحد الأدنى — قلّل إعدادات الرسوميات';
  }
  if (componentName.includes('RAM') || componentName.includes('الذاكرة')) {
    if (score < 50) return 'الذاكرة غير كافية — أضف المزيد من الرام';
    return 'الذاكرة قريبة من الحد الأدنى — أغلق البرامج الأخرى أثناء اللعب';
  }
  if (componentName.includes('التخزين')) {
    return 'مساحة التخزين غير كافية — وفّر مساحة أو أضف قرص إضافي';
  }
  return 'يُنصح بترقية هذا المكوّن';
}

export default function GameResultBadge({ perf, isBottleneckOnly = false }) {
  if (!perf || perf.score == null) return null;
  
  const { score, tier } = perf;
  const pct = Math.round(score * 100);
  const canRun = tierCanRun(tier);
  const bottleneck = getBottleneck(perf);

  const analysisContent = bottleneck ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        marginTop: isBottleneckOnly ? 0 : 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1px solid ${bottleneck.severityColor}40`,
        background: `${bottleneck.severityColor}10`,
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 8,
        fontWeight: 700,
        fontSize: 14,
        color: bottleneck.severityColor
      }}>
        <span>🔍</span>
        <span>تحليل الاختناق (Bottleneck) — {bottleneck.severityText}</span>
      </div>
      <div style={{ 
        fontSize: 13, 
        color: 'var(--text-secondary, #9ca3af)',
        lineHeight: 1.6 
      }}>
        <div style={{ marginBottom: 6 }}>
          {bottleneck.component.icon} <strong>{bottleneck.component.name}</strong> هو العنصر الأضعف بنسبة توافق <strong style={{ color: bottleneck.severityColor }}>{bottleneck.component.score}%</strong>
        </div>
        <div style={{ color: 'var(--text-tertiary, #6b7280)', fontWeight: 500 }}>
          💡 {bottleneck.suggestion}
        </div>
      </div>
    </motion.div>
  ) : (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        marginTop: isBottleneckOnly ? 0 : 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1px solid #10b98140`,
        background: `#10b98110`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 600,
        fontSize: 13,
        color: '#10b981'
      }}
    >
      <span>✨</span> جهازك متوازن ولا يوجد أي اختناق (Bottleneck) يؤثر على الأداء.
    </motion.div>
  );

  if (isBottleneckOnly) return analysisContent;
  
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
            color: 'var(--text-primary, #fff)',
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
            padding: '6px 14px', 
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: 'nowrap'
          }}
        >
          {canRun ? '✅ يمكن التشغيل' : '❌ لا يمكن التشغيل'}
        </div>
      </div>

      {/* Bottleneck Analysis */}
      {analysisContent}
    </motion.div>
  );
}
