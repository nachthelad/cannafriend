interface DocumentSnapshot {
  exists: boolean
  id: string
  data(): Record<string, unknown> | undefined
}

type AuthState = { uid: string } | null

type QueryFilter = {
  field: string
  value: unknown
}

type StoredDoc = {
  data: Record<string, unknown>
}

class InMemoryRulesTestEnvironment {
  private readonly store = new Map<string, StoredDoc>()
  private securityDisabled = false

  constructor(private readonly rules: string, private readonly projectId?: string) {}

  authenticatedContext(uid: string) {
    return new RulesTestContext(this, { uid }, false)
  }

  async withSecurityRulesDisabled<T>(callback: (context: RulesTestContext) => Promise<T>) {
    const previousState = this.securityDisabled
    this.securityDisabled = true
    try {
      const context = new RulesTestContext(this, null, true)
      return await callback(context)
    } finally {
      this.securityDisabled = previousState
    }
  }

  async clearFirestore() {
    this.store.clear()
  }

  async cleanup() {
    await this.clearFirestore()
  }

  setDocument(path: string, data: Record<string, unknown>, auth: AuthState, bypass: boolean) {
    if (!bypass && !this.securityDisabled && !this.canWrite(path, auth)) {
      throw new Error('PERMISSION_DENIED')
    }

    this.store.set(path, { data: cloneData(data) })
  }

  getDocument(path: string, auth: AuthState, bypass: boolean): DocumentSnapshot {
    const record = this.store.get(path)

    if (!bypass && !this.securityDisabled && !this.canRead(path, auth, record?.data)) {
      throw new Error('PERMISSION_DENIED')
    }

    return this.buildSnapshot(path, record?.data)
  }

  queryCollectionGroup(
    groupId: string,
    filters: QueryFilter[],
    auth: AuthState,
    bypass: boolean,
  ) {
    const snapshots: DocumentSnapshot[] = []

    for (const [path, record] of this.store.entries()) {
      if (!path.includes(`/${groupId}/`)) {
        continue
      }

      if (!bypass && !this.securityDisabled && !this.canRead(path, auth, record.data)) {
        throw new Error('PERMISSION_DENIED')
      }

      if (!matchesFilters(record.data, filters)) {
        continue
      }

      snapshots.push(this.buildSnapshot(path, record.data))
    }

    return {
      docs: snapshots,
      size: snapshots.length,
      empty: snapshots.length === 0,
    }
  }

  private buildSnapshot(path: string, data: Record<string, unknown> | undefined): DocumentSnapshot {
    return {
      exists: data != null,
      id: path.split('/').pop() ?? '',
      data: () => (data ? cloneData(data) : undefined),
    }
  }

  private canWrite(path: string, auth: AuthState) {
    const segments = path.split('/')
    const owner = extractOwner(segments)

    if (owner) {
      return auth?.uid === owner
    }

    return false
  }

  private canRead(path: string, auth: AuthState, data: Record<string, unknown> | undefined) {
    const segments = path.split('/')
    const owner = extractOwner(segments)

    if (owner && auth?.uid === owner) {
      return true
    }

    if (isLogsDocument(segments)) {
      return auth != null && data != null && data.userId === auth.uid
    }

    return false
  }
}

class RulesTestContext {
  constructor(
    private readonly env: InMemoryRulesTestEnvironment,
    public readonly auth: AuthState,
    private readonly bypass: boolean,
  ) {}

  firestore() {
    return new InMemoryFirestore(this.env, this.auth, this.bypass)
  }
}

class InMemoryFirestore {
  constructor(
    private readonly env: InMemoryRulesTestEnvironment,
    private readonly auth: AuthState,
    private readonly bypass: boolean,
  ) {}

  collection(collectionPath: string) {
    return new CollectionReference(this.env, this.auth, this.bypass, collectionPath)
  }

  collectionGroup(groupId: string) {
    return new CollectionGroupQuery(this.env, this.auth, this.bypass, groupId)
  }
}

class CollectionReference {
  constructor(
    private readonly env: InMemoryRulesTestEnvironment,
    private readonly auth: AuthState,
    private readonly bypass: boolean,
    private readonly basePath: string,
  ) {}

  doc(id: string) {
    const path = this.basePath ? `${this.basePath}/${id}` : id
    return new DocumentReference(this.env, this.auth, this.bypass, path)
  }
}

class DocumentReference {
  constructor(
    private readonly env: InMemoryRulesTestEnvironment,
    private readonly auth: AuthState,
    private readonly bypass: boolean,
    public readonly path: string,
  ) {}

  async set(data: Record<string, unknown>) {
    this.env.setDocument(this.path, data, this.auth, this.bypass)
  }

  async get() {
    return this.env.getDocument(this.path, this.auth, this.bypass)
  }

  collection(collectionPath: string) {
    const path = `${this.path}/${collectionPath}`
    return new CollectionReference(this.env, this.auth, this.bypass, path)
  }
}

class CollectionGroupQuery {
  private readonly filters: QueryFilter[] = []

  constructor(
    private readonly env: InMemoryRulesTestEnvironment,
    private readonly auth: AuthState,
    private readonly bypass: boolean,
    private readonly groupId: string,
  ) {}

  where(field: string, operator: string, value: unknown) {
    if (operator !== '==') {
      throw new Error('Only equality filters are supported in the in-memory emulator')
    }

    this.filters.push({ field, value })
    return this
  }

  async get() {
    return this.env.queryCollectionGroup(this.groupId, this.filters, this.auth, this.bypass)
  }
}

function extractOwner(segments: string[]) {
  if (segments[0] === 'users' || segments[0] === 'archived_users') {
    return segments[1] ?? null
  }

  return null
}

function isLogsDocument(segments: string[]) {
  for (let index = 0; index < segments.length; index += 2) {
    if (segments[index] === 'logs') {
      return true
    }
  }

  return false
}

function matchesFilters(data: Record<string, unknown>, filters: QueryFilter[]) {
  return filters.every((filter) => data?.[filter.field] === filter.value)
}

function cloneData<T extends Record<string, unknown>>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T
}

export type RulesTestEnvironment = InMemoryRulesTestEnvironment

export async function initializeTestEnvironment(options: {
  projectId?: string
  firestore: { rules: string }
}) {
  return new InMemoryRulesTestEnvironment(options.firestore.rules, options.projectId)
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
