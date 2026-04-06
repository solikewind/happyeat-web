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
const tempDir = path.join(root, 'node_modules', '.cache', 'happyeat-openapi')

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

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value))
}

function sanitizeSwagger2Schema(filePath) {
  if (!fs.existsSync(filePath)) return filePath
  if (path.extname(filePath).toLowerCase() !== '.json') return filePath

  let raw
  try {
    raw = fs.readFileSync(filePath, 'utf8')
  } catch {
    return filePath
  }

  let spec
  try {
    spec = JSON.parse(raw)
  } catch {
    return filePath
  }

  if (!spec || spec.swagger !== '2.0' || !spec.paths || typeof spec.paths !== 'object') {
    return filePath
  }

  let changed = false
  for (const pathKey of Object.keys(spec.paths)) {
    const item = spec.paths[pathKey]
    if (!item || typeof item !== 'object') continue
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = item[method]
      if (!op || !Array.isArray(op.parameters)) continue
      const hasFormData = op.parameters.some((p) => p && p.in === 'formData')
      const bodyIndexes = op.parameters
        .map((p, i) => (p && p.in === 'body' ? i : -1))
        .filter((i) => i >= 0)
      if (!hasFormData || bodyIndexes.length === 0) continue

      op.parameters = op.parameters.filter((p) => !(p && p.in === 'body'))
      changed = true
    }
  }

  if (!changed) return filePath

  fs.mkdirSync(tempDir, { recursive: true })
  const outPath = path.join(tempDir, `sanitized-${path.basename(filePath)}`)
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8')
  return outPath
}

async function prepareSchemaPath(inputPath) {
  if (isHttpUrl(inputPath)) {
    try {
      const res = await fetch(inputPath)
      if (!res.ok) return inputPath
      const text = await res.text()
      const ext = inputPath.toLowerCase().includes('.yaml') || inputPath.toLowerCase().includes('.yml') ? '.yaml' : '.json'
      fs.mkdirSync(tempDir, { recursive: true })
      const tempRawPath = path.join(tempDir, `remote-schema${ext}`)
      fs.writeFileSync(tempRawPath, text, 'utf8')
      return sanitizeSwagger2Schema(tempRawPath)
    } catch {
      return inputPath
    }
  }
  return sanitizeSwagger2Schema(inputPath)
}

const env = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, '.env.development')),
  ...process.env,
}

const cliSchemaPath = process.argv[2]
const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8888'
const rawSchemaPath = cliSchemaPath || env.OPENAPI_SCHEMA_PATH || `${proxyTarget}/openapi/happyeat.json`
const resolvedSchemaPath =
  isHttpUrl(rawSchemaPath) || path.isAbsolute(rawSchemaPath)
    ? rawSchemaPath
    : path.resolve(root, rawSchemaPath)

async function main() {
  const schemaPath = await prepareSchemaPath(resolvedSchemaPath)
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
}

main()
