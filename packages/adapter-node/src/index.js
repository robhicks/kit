import { handler } from 'HANDLER'
import { env } from 'ENV'
import polka from 'polka'
import throng from 'throng'

export const path = env('SOCKET_PATH', false)
export const host = env('HOST', '0.0.0.0')
export const port = env('PORT', !path && '3000')

const server = polka().use(handler)

function master() {
  console.log('Started master')

  process.on('beforeExit', () => {
    console.log('Master cleanup.')
  })
}

/**
 * @param {any} id
 * @param {() => void} disconnect
 */
function worker(id, disconnect) {
  let exited = false
  server.listen({ path, host, port }, () => {
    console.log(`Listening on ${path ? path : `${host}:${port}`}`)
  })
  console.log(`Started worker ${id}`)
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  async function shutdown() {
    if (exited) return
    exited = true

    await new Promise((r) => setTimeout(r, 300)) // simulate async cleanup work
    console.log(`Worker ${id} cleanup done.`)
    disconnect()
  }
}

throng({
  workers: env('WEB_CONCURRENCY', 1),
  lifetime: Infinity,
  master,
  worker,
})

export { server }
