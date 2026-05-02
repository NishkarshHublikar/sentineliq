/**
 * SentinelIQ — WebSocket Crime Stream Server
 * ============================================
 * Emits live crime events via Socket.IO.
 * In production, replace the simulator with real data source
 * (database triggers, Kafka consumer, etc.)
 *
 * Usage:
 *   npm install socket.io express cors
 *   node scripts/ws-server.js
 */

const express   = require('express')
const http      = require('http')
const { Server } = require('socket.io')
const cors      = require('cors')

const PORT = process.env.PORT || 4000

const CRIME_TYPES = ['violent', 'property', 'theft', 'drug', 'vandalism']
const DISTRICTS   = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Midtown', 'Staten Island']
const SEVERITIES  = ['critical', 'high', 'medium']

const CITIES = {
  nyc:     { lat: 40.7128,  lng: -74.0060  },
  la:      { lat: 34.0522,  lng: -118.2437 },
  chicago: { lat: 41.8781,  lng: -87.6298  },
  houston: { lat: 29.7604,  lng: -95.3698  },
}

const rand    = (a, b) => a + Math.random() * (b - a)
const randInt = (a, b) => Math.floor(rand(a, b))
const pick    = (arr)  => arr[randInt(0, arr.length)]

// ── Express + Socket.IO setup ─────────────────────────────────────
const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

app.use(cors())
app.use(express.json())

// ── REST health endpoint ──────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', clients: io.engine.clientsCount, ts: new Date() })
})

// ── REST: recent crimes (last 200) ───────────────────────────────
const recentCrimes = []
app.get('/api/crimes', (_, res) => {
  res.json({ data: recentCrimes.slice(0, 200) })
})

// ── Socket.IO connection handler ──────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`)

  // Send snapshot of recent crimes on connect
  socket.emit('snapshot', recentCrimes.slice(0, 50))

  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`)
  })
})

// ── Crime event generator ─────────────────────────────────────────
let eventCount = 0

function generateCrime(cityKey = 'nyc') {
  const city  = CITIES[cityKey] || CITIES.nyc
  const typeId = pick(CRIME_TYPES)
  const hour   = new Date().getHours()

  return {
    id:       `live-${Date.now()}-${eventCount++}`,
    lat:      city.lat + rand(-0.09, 0.09),
    lng:      city.lng + rand(-0.09, 0.09),
    typeId,
    severity: pick(SEVERITIES),
    district: pick(DISTRICTS),
    hour,
    ts:       new Date().toISOString(),
    resolved: false,
    isNew:    true,
    flash:    1.8,
    city:     cityKey,
  }
}

// ── Live stream loop ──────────────────────────────────────────────
function streamCrimes() {
  const cityKeys = Object.keys(CITIES)
  const cityKey  = pick(cityKeys)
  const crime    = generateCrime(cityKey)

  recentCrimes.unshift(crime)
  if (recentCrimes.length > 500) recentCrimes.pop()

  // Broadcast to all connected clients
  io.emit('new_crime', crime)

  // Anomaly detection: check event rate
  const fiveMinAgo  = Date.now() - 5 * 60 * 1000
  const recentCount = recentCrimes.filter(c => new Date(c.ts) > fiveMinAgo).length

  if (recentCount > 8) {
    io.emit('anomaly', {
      is_anomaly:   true,
      recent_count: recentCount,
      threshold:    8,
      ts:           new Date().toISOString(),
    })
  }

  // Schedule next event: 2–5 s
  setTimeout(streamCrimes, rand(2000, 5000))
}

// ── Burst mode: extra event every 7 s (25% chance) ───────────────
setInterval(() => {
  if (Math.random() < 0.25) {
    const crime = generateCrime()
    recentCrimes.unshift(crime)
    io.emit('new_crime', crime)
  }
}, 7000)

// ── Start ─────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 SentinelIQ WebSocket server running on port ${PORT}`)
  console.log(`   REST API:  http://localhost:${PORT}/api/health`)
  console.log(`   Socket.IO: ws://localhost:${PORT}\n`)
  streamCrimes()
})
