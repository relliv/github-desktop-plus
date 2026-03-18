/**
 * Lightweight performance logger for measuring operation durations.
 * Works in both main (Node) and renderer (browser) processes.
 *
 * Usage:
 *   const end = perf.start('db:init')
 *   // ... work ...
 *   end()                      // logs "[perf] db:init 42ms"
 *
 *   const result = await perf.measure('git:status', () => git.status())
 *
 *   perf.mark('app:ready')     // logs elapsed since process start
 */

const origin = typeof performance !== 'undefined' ? performance.now.bind(performance) : () => Date.now()
const t0 = origin()

type LogFn = (msg: string) => void

let _log: LogFn = (msg) => console.log(msg)
let _enabled = true

function elapsed(): number {
  return Math.round(origin() - t0)
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function start(label: string): () => void {
  if (!_enabled) return () => {}
  const begin = origin()
  return () => {
    const duration = origin() - begin
    _log(`[perf] ${label} ${formatDuration(duration)}`)
  }
}

async function measure<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
  const end = start(label)
  try {
    const result = await fn()
    return result
  } finally {
    end()
  }
}

function mark(label: string): void {
  if (!_enabled) return
  _log(`[perf] ${label} at +${formatDuration(elapsed())}`)
}

function configure(opts: { enabled?: boolean; log?: LogFn }) {
  if (opts.enabled !== undefined) _enabled = opts.enabled
  if (opts.log) _log = opts.log
}

/**
 * Wrap ipcMain.handle with automatic perf logging.
 * Usage: perfHandle(ipcMain, 'channel', handler)
 */
function handle(
  ipc: { handle: (channel: string, listener: (...args: any[]) => any) => void },
  channel: string,
  listener: (...args: any[]) => any
): void {
  ipc.handle(channel, async (...args: any[]) => {
    return measure(`ipc:${channel}`, () => listener(...args))
  })
}

export const perf = { start, measure, mark, configure, elapsed, handle }
