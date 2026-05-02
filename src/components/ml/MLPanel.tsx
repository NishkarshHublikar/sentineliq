'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

const METRICS = [
  { name: 'Accuracy',  value: 87.3, color: '#3b82f6' },
  { name: 'Precision', value: 84.1, color: '#6366f1' },
  { name: 'Recall',    value: 81.6, color: '#a855f7' },
  { name: 'F1 Score',  value: 82.8, color: '#22c55e' },
  { name: 'AUC-ROC',   value: 92.1, color: '#f59e0b' },
]

const FEATURES = [
  { name: 'Hour of day',           value: 0.234 },
  { name: 'Coordinates (lat/lng)', value: 0.198 },
  { name: 'Day of week',           value: 0.156 },
  { name: 'Prior incidents (24h)', value: 0.132 },
  { name: 'District',              value: 0.098 },
  { name: 'Month',                 value: 0.087 },
  { name: 'Temperature',           value: 0.065 },
  { name: 'Precipitation',         value: 0.030 },
]

const ARCH = [
  ['Model',     'RandomForestClassifier(n_estimators=200, max_depth=12, min_samples_split=5, n_jobs=-1)'],
  ['Features',  'lat, lng, hour, day_of_week, month, district_encoded, prev_crimes_24h, temperature, precipitation'],
  ['Target',    'crime_type — multiclass (5 categories)'],
  ['Training',  '127,439 records · Test: 31,860 records · 5-fold stratified CV · GridSearchCV'],
  ['Anomaly',   'IsolationForest(n_estimators=100, contamination=0.05) · threshold: 8 events/5min'],
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const row = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

export function MLPanel() {
  return (
    <ScrollArea className="flex-1">
      <motion.div
        className="grid grid-cols-2 gap-4 p-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ── Model performance ── */}
        <motion.div variants={row}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Model Performance</CardTitle>
                <Badge variant="success">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {METRICS.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                >
                  <div className="mb-1.5 flex justify-between">
                    <span className="text-[12px] font-medium text-zinc-300">{m.name}</span>
                    <span className="font-mono text-[12px] font-semibold" style={{ color: m.color }}>
                      {m.value}%
                    </span>
                  </div>
                  <Progress value={m.value} color={m.color} height={5} />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Feature importance ── */}
        <motion.div variants={row}>
          <Card className="h-full">
            <CardHeader><CardTitle>Feature Importance</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.name}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-center gap-2.5 border-b border-white/[0.04] py-2.5 last:border-0"
                  >
                    <span className="flex-1 text-[12px] text-zinc-400">{f.name}</span>
                    <div className="w-16 overflow-hidden rounded-full bg-zinc-800" style={{ height: 3 }}>
                      <motion.div
                        className="h-full rounded-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.value / 0.234) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="min-w-[34px] text-right font-mono text-[11px] text-blue-400">
                      {(f.value * 100).toFixed(1)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Architecture ── full width */}
        <motion.div className="col-span-2" variants={row}>
          <Card>
            <CardHeader><CardTitle>Model Architecture</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/[0.06] bg-zinc-950 p-4 font-mono text-[12px] leading-[2] text-zinc-400">
                {ARCH.map(([k, v]) => (
                  <div key={k}>
                    <span className="font-semibold text-blue-400">{k}</span>
                    <span className="text-zinc-600"> · </span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Training pipeline ── */}
        <motion.div className="col-span-2" variants={row}>
          <Card>
            <CardHeader><CardTitle>Training Pipeline</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-0">
                {[
                  { step: '01', label: 'Data Ingestion',     desc: 'CSV / PostgreSQL PostGIS' },
                  { step: '02', label: 'Feature Engineering', desc: 'Time, spatial, weather' },
                  { step: '03', label: 'Train / Split',       desc: '80 / 20 stratified' },
                  { step: '04', label: 'GridSearchCV',        desc: 'Hyperparameter tuning' },
                  { step: '05', label: 'Evaluation',          desc: 'F1, AUC-ROC, CM' },
                  { step: '06', label: 'Export',              desc: 'joblib .pkl → FastAPI' },
                ].map((s, i, arr) => (
                  <div key={s.step} className="flex items-center flex-1">
                    <motion.div
                      className="flex flex-col items-center text-center flex-1"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                    >
                      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 font-mono text-[11px] font-semibold text-blue-400">
                        {s.step}
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-300">{s.label}</p>
                      <p className="text-[10px] text-zinc-600">{s.desc}</p>
                    </motion.div>
                    {i < arr.length - 1 && (
                      <div className="h-px flex-shrink-0 w-4 bg-white/[0.06]" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ScrollArea>
  )
}
