import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  StorageRulesTestEnvironment,
} from '../test-utils/in-memory-storage-emulator'

const PROJECT_ID = 'cannafriend-test'
const OWNER_UID = 'user123'
const OTHER_UID = 'user456'
const OWNER_IMAGE_PATH = `images/${OWNER_UID}/profile.jpg`

let testEnv: StorageRulesTestEnvironment
let rulesText: string

describe('Storage security rules', () => {
  beforeAll(async () => {
    rulesText = readFileSync(join(__dirname, '..', 'storage.rules'), 'utf8')
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      storage: { rules: rulesText },
    })
  })

  afterEach(async () => {
    await testEnv.clearStorage()
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('defines an isOwner helper and reuses it for owner checks', () => {
    const helperDefinition = /function\s+isOwner\s*\(\s*userId\s*\)/
    const rawOwnerChecks = [...rulesText.matchAll(/request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*userId/g)]

    expect(rulesText).toMatch(helperDefinition)
    expect(rawOwnerChecks).toHaveLength(1)
  })

  it('allows owners to manage their own images within limits', async () => {
    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    const storage = ownerContext.storage()

    await assertSucceeds(
      storage.createFile(OWNER_IMAGE_PATH, {
        size: 4 * 1024 * 1024,
        contentType: 'image/jpeg',
      }),
    )

    await assertSucceeds(storage.getFile(OWNER_IMAGE_PATH))
    await assertSucceeds(storage.listFiles(`images/${OWNER_UID}`))

    await assertSucceeds(
      storage.updateFile(OWNER_IMAGE_PATH, {
        size: 8 * 1024 * 1024,
        contentType: 'image/png',
      }),
    )

    await assertSucceeds(storage.deleteFile(OWNER_IMAGE_PATH))
  })

  it('enforces create size and content-type restrictions', async () => {
    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    const storage = ownerContext.storage()

    await assertFails(
      storage.createFile(`images/${OWNER_UID}/too-large.png`, {
        size: 6 * 1024 * 1024,
        contentType: 'image/png',
      }),
    )

    await assertFails(
      storage.createFile(`images/${OWNER_UID}/invalid-type.svg`, {
        size: 512 * 1024,
        contentType: 'application/octet-stream',
      }),
    )
  })

  it('enforces update size and content-type restrictions', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.storage().createFile(OWNER_IMAGE_PATH, {
        size: 2 * 1024 * 1024,
        contentType: 'image/jpeg',
      })
    })

    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    const storage = ownerContext.storage()

    await assertFails(
      storage.updateFile(OWNER_IMAGE_PATH, {
        size: 11 * 1024 * 1024,
        contentType: 'image/jpeg',
      }),
    )

    await assertFails(
      storage.updateFile(OWNER_IMAGE_PATH, {
        size: 2 * 1024 * 1024,
        contentType: 'application/pdf',
      }),
    )
  })

  it('prevents other users from reading or mutating owner files', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.storage().createFile(OWNER_IMAGE_PATH, {
        size: 1 * 1024 * 1024,
        contentType: 'image/jpeg',
      })
    })

    const otherContext = testEnv.authenticatedContext(OTHER_UID)
    const storage = otherContext.storage()

    await assertFails(
      storage.createFile(`images/${OWNER_UID}/intrusion.png`, {
        size: 1 * 1024 * 1024,
        contentType: 'image/png',
      }),
    )

    await assertFails(storage.getFile(OWNER_IMAGE_PATH))
    await assertFails(storage.listFiles(`images/${OWNER_UID}`))
    await assertFails(
      storage.updateFile(OWNER_IMAGE_PATH, {
        size: 1 * 1024 * 1024,
        contentType: 'image/png',
      }),
    )
    await assertFails(storage.deleteFile(OWNER_IMAGE_PATH))
  })

  it('denies unauthenticated users from accessing images', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.storage().createFile(OWNER_IMAGE_PATH, {
        size: 512 * 1024,
        contentType: 'image/jpeg',
      })
    })

    const guestContext = testEnv.unauthenticatedContext()
    const storage = guestContext.storage()

    await assertFails(
      storage.createFile(`images/${OWNER_UID}/guest.png`, {
        size: 256 * 1024,
        contentType: 'image/png',
      }),
    )

    await assertFails(storage.getFile(OWNER_IMAGE_PATH))
    await assertFails(storage.listFiles(`images/${OWNER_UID}`))
    await assertFails(
      storage.updateFile(OWNER_IMAGE_PATH, {
        size: 256 * 1024,
        contentType: 'image/png',
      }),
    )
    await assertFails(storage.deleteFile(OWNER_IMAGE_PATH))
  })

  it('denies access to paths outside the images prefix', async () => {
    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    const storage = ownerContext.storage()

    await assertFails(
      storage.createFile(`documents/${OWNER_UID}/notes.txt`, {
        size: 64 * 1024,
        contentType: 'text/plain',
      }),
    )
  })
})
