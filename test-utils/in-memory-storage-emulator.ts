interface FileMetadata {
  size: number
  contentType: string
}

type StorageAuthState = { uid: string } | null

type StoredFile = {
  metadata: FileMetadata
}

class InMemoryStorageTestEnvironment {
  private readonly createSizeLimit: number
  private readonly updateSizeLimit: number
  private readonly contentTypePattern: RegExp
  private readonly ownerHelperDefinition: RegExp
  private readonly rawRules: string
  private readonly files = new Map<string, StoredFile>()
  private securityDisabled = false

  constructor(private readonly options: { rules: string; projectId?: string }) {
    this.rawRules = options.rules
    this.ownerHelperDefinition = /function\s+isOwner\s*\(\s*userId\s*\)\s*\{\s*return\s+request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*userId;\s*\}/

    this.ensureOwnerHelperPresent()

    this.createSizeLimit = parseSizeLimit(this.rawRules, 'create') ?? 5 * 1024 * 1024
    this.updateSizeLimit = parseSizeLimit(this.rawRules, 'update') ?? 10 * 1024 * 1024
    this.contentTypePattern = parseContentTypePattern(this.rawRules) ?? /^image\/(jpeg|jpg|png|webp|gif)$/
  }

  authenticatedContext(uid: string) {
    return new StorageRulesTestContext(this, { uid }, false)
  }

  unauthenticatedContext() {
    return new StorageRulesTestContext(this, null, false)
  }

  async withSecurityRulesDisabled<T>(callback: (context: StorageRulesTestContext) => Promise<T>) {
    const previousState = this.securityDisabled
    this.securityDisabled = true
    try {
      const context = new StorageRulesTestContext(this, null, true)
      return await callback(context)
    } finally {
      this.securityDisabled = previousState
    }
  }

  async clearStorage() {
    this.files.clear()
  }

  async cleanup() {
    await this.clearStorage()
  }

  createFile(path: string, metadata: FileMetadata, auth: StorageAuthState, bypass: boolean) {
    if (!bypass && !this.securityDisabled && !this.canCreate(path, metadata, auth)) {
      throw new Error('PERMISSION_DENIED')
    }

    this.files.set(normalizePath(path), { metadata: cloneMetadata(metadata) })
  }

  updateFile(path: string, metadata: FileMetadata, auth: StorageAuthState, bypass: boolean) {
    const normalizedPath = normalizePath(path)
    const existing = this.files.get(normalizedPath)

    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    if (!bypass && !this.securityDisabled && !this.canUpdate(path, metadata, auth)) {
      throw new Error('PERMISSION_DENIED')
    }

    this.files.set(normalizedPath, { metadata: cloneMetadata(metadata) })
  }

  getFile(path: string, auth: StorageAuthState, bypass: boolean) {
    const normalizedPath = normalizePath(path)
    const record = this.files.get(normalizedPath)

    if (!record) {
      throw new Error('NOT_FOUND')
    }

    if (!bypass && !this.securityDisabled && !this.canRead(path, auth)) {
      throw new Error('PERMISSION_DENIED')
    }

    return { metadata: cloneMetadata(record.metadata) }
  }

  listFiles(prefix: string, auth: StorageAuthState, bypass: boolean) {
    if (!bypass && !this.securityDisabled && !this.canList(prefix, auth)) {
      throw new Error('PERMISSION_DENIED')
    }

    const normalizedPrefix = normalizePath(prefix)
    const items: Array<{ path: string; metadata: FileMetadata }> = []

    for (const [path, record] of this.files.entries()) {
      if (!path.startsWith(normalizedPrefix)) {
        continue
      }

      items.push({ path, metadata: cloneMetadata(record.metadata) })
    }

    return { items }
  }

  deleteFile(path: string, auth: StorageAuthState, bypass: boolean) {
    const normalizedPath = normalizePath(path)

    if (!this.files.has(normalizedPath)) {
      return
    }

    if (!bypass && !this.securityDisabled && !this.canDelete(path, auth)) {
      throw new Error('PERMISSION_DENIED')
    }

    this.files.delete(normalizedPath)
  }

  private canCreate(path: string, metadata: FileMetadata, auth: StorageAuthState) {
    const userId = extractOwnerFromPath(path)

    if (!userId || !isOwner(auth, userId)) {
      return false
    }

    if (metadata.size >= this.createSizeLimit) {
      return false
    }

    return this.contentTypePattern.test(metadata.contentType)
  }

  private canUpdate(path: string, metadata: FileMetadata, auth: StorageAuthState) {
    const userId = extractOwnerFromPath(path)

    if (!userId || !isOwner(auth, userId)) {
      return false
    }

    if (metadata.size >= this.updateSizeLimit) {
      return false
    }

    return this.contentTypePattern.test(metadata.contentType)
  }

  private canDelete(path: string, auth: StorageAuthState) {
    const userId = extractOwnerFromPath(path)
    return Boolean(userId && isOwner(auth, userId))
  }

  private canRead(path: string, auth: StorageAuthState) {
    const userId = extractOwnerFromPath(path)
    return Boolean(userId && isOwner(auth, userId))
  }

  private canList(prefix: string, auth: StorageAuthState) {
    const userId = extractOwnerFromPrefix(prefix)
    return Boolean(userId && isOwner(auth, userId))
  }

  private ensureOwnerHelperPresent() {
    const normalizedRules = collapseWhitespace(this.rawRules)

    if (!this.ownerHelperDefinition.test(normalizedRules)) {
      throw new Error('Expected storage rules to define an isOwner helper')
    }
  }
}

class StorageRulesTestContext {
  constructor(
    private readonly env: InMemoryStorageTestEnvironment,
    private readonly auth: StorageAuthState,
    private readonly bypass: boolean,
  ) {}

  storage() {
    return new InMemoryStorage(this.env, this.auth, this.bypass)
  }
}

class InMemoryStorage {
  constructor(
    private readonly env: InMemoryStorageTestEnvironment,
    private readonly auth: StorageAuthState,
    private readonly bypass: boolean,
  ) {}

  async createFile(path: string, metadata: FileMetadata) {
    this.env.createFile(path, metadata, this.auth, this.bypass)
  }

  async updateFile(path: string, metadata: FileMetadata) {
    this.env.updateFile(path, metadata, this.auth, this.bypass)
  }

  async getFile(path: string) {
    return this.env.getFile(path, this.auth, this.bypass)
  }

  async listFiles(prefix: string) {
    return this.env.listFiles(prefix, this.auth, this.bypass)
  }

  async deleteFile(path: string) {
    this.env.deleteFile(path, this.auth, this.bypass)
  }
}

function normalizePath(path: string) {
  return path.replace(/^\/+/, '')
}

function extractOwnerFromPath(path: string) {
  const normalized = normalizePath(path)
  const segments = normalized.split('/')

  if (segments[0] !== 'images') {
    return null
  }

  return segments[1] ?? null
}

function extractOwnerFromPrefix(prefix: string) {
  const normalized = normalizePath(prefix)
  const segments = normalized.split('/')

  if (segments[0] !== 'images') {
    return null
  }

  return segments[1] ?? null
}

function isOwner(auth: StorageAuthState, userId: string) {
  return auth != null && auth.uid === userId
}

function parseSizeLimit(rules: string, operation: 'create' | 'update') {
  const pattern = new RegExp(
    `allow\\s+${operation}:[\\s\\S]*?request\\.resource\\.size\\s*<\\s*(\\d+)\\s*\\*\\s*1024\\s*\\*\\s*1024`,
    'i',
  )
  const match = rules.match(pattern)

  if (!match) {
    return null
  }

  const megabytes = Number.parseInt(match[1], 10)

  if (Number.isNaN(megabytes)) {
    return null
  }

  return megabytes * 1024 * 1024
}

function parseContentTypePattern(rules: string) {
  const match = rules.match(/request\.resource\.contentType\.matches\('(.*?)'\)/)
  if (!match) {
    return null
  }

  return new RegExp(`^${match[1]}$`)
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ')
}

function cloneMetadata(metadata: FileMetadata): FileMetadata {
  return { ...metadata }
}

export type StorageRulesTestEnvironment = InMemoryStorageTestEnvironment

export async function initializeTestEnvironment(options: { projectId?: string; storage: { rules: string } }) {
  return new InMemoryStorageTestEnvironment({ rules: options.storage.rules, projectId: options.projectId })
}

export async function assertSucceeds<T>(promise: Promise<T>) {
  return promise
}

export async function assertFails(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    if (error instanceof Error) {
      return error
    }

    return new Error('Unknown error')
  }

  throw new Error('Expected promise to fail, but it resolved successfully')
}
