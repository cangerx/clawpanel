#!/usr/bin/env node
/**
 * ClawPanel 独立 Web 服务器（Headless 模式）
 * 无需 Tauri / Rust / GUI，纯 Node.js 运行
 * 适用于 Linux 服务器、Docker 等无桌面环境
 *
 * 用法：
 *   npm run serve              # 默认 0.0.0.0:1420
 *   npm run serve -- --port 8080
 *   npm run serve -- --host 127.0.0.1 --port 3000
 *   PORT=8080 npm run serve
 */
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { homedir } from 'os'
import net from 'net'
import { _initApi, _apiMiddleware } from './dev-api.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '..', 'dist')
const WEB_UPDATE_DIR = path.join(homedir(), '.openclaw', 'clawpanel', 'web-update')

function parseArgs() {
  const args = process.argv.slice(2)
  let host = process.env.HOST || '0.0.0.0'
  let port = parseInt(process.env.PORT, 10) || 1420
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host' && args[i + 1]) host = args[++i]
    if (args[i] === '--port' && args[i + 1]) port = parseInt(args[++i], 10)
    if (args[i] === '-p' && args[i + 1]) port = parseInt(args[++i], 10)
    if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
ClawPanel Web Server (Headless)

用法: node scripts/serve.js [选项]

选项:
  --host <addr>   监听地址 (默认: 0.0.0.0)
  --port, -p <n>  监听端口 (默认: 1420)
  --help, -h      显示帮助

环境变量:
  HOST            监听地址
  PORT            监听端口

示例:
  npm run serve                    # 0.0.0.0:1420
  npm run serve -- --port 8080     # 0.0.0.0:8080
  npm run serve -- --host 127.0.0.1 -p 3000
`)
      process.exit(0)
    }
  }
  return { host, port }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
}

function resolveCandidate(root, relativePath) {
  const normalized = String(relativePath || '').replace(/^\/+/, '')
  if (!normalized) return null
  const fullPath = path.resolve(root, normalized)
  if (!fullPath.startsWith(root + path.sep) && fullPath !== root) return null
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) return fullPath
  if (!path.extname(normalized)) {
    const nestedIndex = path.resolve(root, normalized, 'index.html')
    if (nestedIndex.startsWith(root + path.sep) && fs.existsSync(nestedIndex) && fs.statSync(nestedIndex).isFile()) {
      return nestedIndex
    }
  }
  return null
}

function resolveRequestedFile(urlPath) {
  const relativePath = urlPath === '/' ? 'index.html' : urlPath
  return resolveCandidate(WEB_UPDATE_DIR, relativePath)
    || resolveCandidate(DIST_DIR, relativePath)
}

function resolveSpaIndex() {
  const overlayIndex = path.join(WEB_UPDATE_DIR, 'index.html')
  if (fs.existsSync(overlayIndex)) return overlayIndex
  return path.join(DIST_DIR, 'index.html')
}

function serveStatic(req, res) {
  const urlPath = req.url.split('?')[0]
  const filePath = resolveRequestedFile(urlPath)

  if (filePath) {
    sendFile(res, filePath)
    return
  }

  const ext = path.extname(urlPath)
  if (!ext || ext === '.html') {
    sendFile(res, resolveSpaIndex())
  } else {
    res.statusCode = 404
    res.end('Not Found')
  }
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath)
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  }

  res.setHeader('Content-Type', contentType)
  fs.createReadStream(filePath).pipe(res)
}

async function main() {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error('❌ 未找到 dist/index.html，请先运行: npm run build')
    process.exit(1)
  }

  const { host, port } = parseArgs()
  _initApi()

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    await _apiMiddleware(req, res, () => {
      serveStatic(req, res)
    })
  })

  let gatewayPort = 18789
  try {
    const cfgPath = path.join(homedir(), '.openclaw', 'openclaw.json')
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    gatewayPort = cfg?.gateway?.port || 18789
  } catch {}

  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/ws')) {
      socket.destroy()
      return
    }

    const target = net.createConnection(gatewayPort, '127.0.0.1', () => {
      const reqLine = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`
      const headers = Object.entries(req.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n')
      target.write(reqLine + headers + '\r\n\r\n')
      if (head.length) target.write(head)
      socket.pipe(target)
      target.pipe(socket)
    })

    target.on('error', () => socket.destroy())
    socket.on('error', () => target.destroy())
  })

  server.listen(port, host, () => {
    console.log('')
    console.log('  ┌─────────────────────────────────────────┐')
    console.log('  │                                         │')
    console.log('  │   🦀 ClawPanel Web Server (Headless)    │')
    console.log('  │                                         │')
    console.log(`  │   http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`.padEnd(44) + '│')
    if (host === '0.0.0.0') {
      console.log(`  │   http://0.0.0.0:${port}/`.padEnd(44) + '│')
    }
    console.log('  │                                         │')
    console.log('  └─────────────────────────────────────────┘')
    console.log('')
    console.log('  按 Ctrl+C 停止服务')
    console.log('')
  })

  process.on('SIGINT', () => { console.log('\n  👋 服务已停止'); process.exit(0) })
  process.on('SIGTERM', () => { console.log('\n  👋 服务已停止'); process.exit(0) })
}

main().catch(e => { console.error('启动失败:', e); process.exit(1) })
