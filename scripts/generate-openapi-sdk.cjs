const { generateService } = require('@umijs/openapi')
const fs = require('fs')
const path = require('path')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  return content.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return acc
    const index = trimmed.indexOf('=')
    if (index <= 0) return acc
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    acc[key] = value
    return acc
  }, {})
}

const root = process.cwd()
const env = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, '.env.development')),
  ...process.env,
}

const cliSchemaPath = process.argv[2]
const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8888'
const schemaPath = cliSchemaPath || env.OPENAPI_SCHEMA_PATH || `${proxyTarget}/openapi/happyeat.json`

generateService({
  schemaPath,
  requestLibPath: "import request from './src/api/request'",
  serversPath: './src/api/sdk',
  projectName: 'happyeat-web-sdk',
  namespace: 'API',
})
  .then(() => {
    console.log(`[openapi] SDK generated from: ${schemaPath}`)
  })
  .catch((error) => {
    console.error('[openapi] generate failed:', error)
    process.exit(1)
  })
