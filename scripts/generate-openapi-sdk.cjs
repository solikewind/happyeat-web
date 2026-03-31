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
const sdkDir = path.join(root, 'src', 'api', 'sdk', 'happyeat-web-sdk')

function walkTsFiles(dir) {
  if (!fs.existsSync(dir)) return []
  const result = []
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      result.push(...walkTsFiles(filePath))
      continue
    }
    if (filePath.endsWith('.ts') && !filePath.endsWith('.d.ts')) {
      result.push(filePath)
    }
  }
  return result
}

function normalizeSdkImportsAndParams() {
  const tsFiles = walkTsFiles(sdkDir)
  const paramTypes = new Set()
  const paramRegex = /API\.([A-Za-z0-9_]+Params)\b/g

  for (const filePath of tsFiles) {
    const source = fs.readFileSync(filePath, 'utf8')
    const patched = source.replace(/from "\.\/src\/api\/request";/g, 'from "../../request";')
    if (patched !== source) {
      fs.writeFileSync(filePath, patched, 'utf8')
    }

    let match = paramRegex.exec(patched)
    while (match) {
      paramTypes.add(match[1])
      match = paramRegex.exec(patched)
    }
  }

  const lines = [
    'declare namespace API {',
    '  type AnyParams = Record<string, any>;',
    '',
    ...Array.from(paramTypes).sort().map((name) => `  type ${name} = AnyParams;`),
    '}',
    '',
  ]
  fs.writeFileSync(path.join(sdkDir, 'params.d.ts'), lines.join('\n'), 'utf8')
}

const env = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, '.env.development')),
  ...process.env,
}

const cliSchemaPath = process.argv[2]
const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8888'
const rawSchemaPath = cliSchemaPath || env.OPENAPI_SCHEMA_PATH || `${proxyTarget}/openapi/happyeat.json`
const schemaPath =
  /^https?:\/\//i.test(rawSchemaPath) || path.isAbsolute(rawSchemaPath)
    ? rawSchemaPath
    : path.resolve(root, rawSchemaPath)

generateService({
  schemaPath,
  requestLibPath: '../../request',
  serversPath: './src/api/sdk',
  projectName: 'happyeat-web-sdk',
  namespace: 'API',
})
  .then(() => {
    normalizeSdkImportsAndParams()
    console.log(`[openapi] SDK generated from: ${schemaPath}`)
  })
  .catch((error) => {
    console.error('[openapi] generate failed:', error)
    process.exit(1)
  })
