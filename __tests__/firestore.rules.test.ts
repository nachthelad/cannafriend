import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '../test-utils/in-memory-firestore-emulator'

const PROJECT_ID = 'cannafriend-test'
const OWNER_UID = 'user123'
const OTHER_UID = 'user456'

let testEnv: RulesTestEnvironment

describe('Firestore security rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf8'),
      },
    })
  })

  afterEach(async () => {
    await testEnv.clearFirestore()
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('allows users to read and write their own user document', async () => {
    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    const ownerDoc = ownerContext.firestore().collection('users').doc(OWNER_UID)

    await assertSucceeds(ownerDoc.set({ displayName: 'Alice' }))
    await assertSucceeds(ownerDoc.get())

    const otherContext = testEnv.authenticatedContext(OTHER_UID)
    const otherDoc = otherContext.firestore().collection('users').doc(OWNER_UID)

    await assertFails(otherDoc.set({ displayName: 'Mallory' }))
    await assertFails(otherDoc.get())
  })

  it('enforces ownership on nested plant subcollections', async () => {
    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    const ownerPlant = ownerContext
      .firestore()
      .collection('users')
      .doc(OWNER_UID)
      .collection('plants')
      .doc('plantA')

    await assertSucceeds(ownerPlant.set({ strain: 'OG Kush' }))
    await assertSucceeds(ownerPlant.collection('logs').doc('log1').set({ note: 'Watered', timestamp: 1 }))
    await assertSucceeds(
      ownerPlant.collection('environment').doc('env1').set({ humidity: 60, temperature: 22 }),
    )

    const otherContext = testEnv.authenticatedContext(OTHER_UID)
    const otherPlant = otherContext
      .firestore()
      .collection('users')
      .doc(OWNER_UID)
      .collection('plants')
      .doc('plantA')

    await assertFails(otherPlant.set({ strain: 'Blue Dream' }))
    await assertFails(otherPlant.collection('logs').doc('log1').set({ note: 'Tampered', timestamp: 2 }))
    await assertFails(otherPlant.collection('environment').doc('env1').set({ humidity: 40, temperature: 18 }))
  })

  it('prevents other users from accessing archived data', async () => {
    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    const ownerArchive = ownerContext.firestore().collection('archived_users').doc(OWNER_UID)

    await assertSucceeds(ownerArchive.set({ archivedAt: Date.now() }))
    await assertSucceeds(ownerArchive.collection('plants').doc('plantA').set({ strain: 'Mimosa' }))
    await assertSucceeds(ownerArchive.collection('reminders').doc('reminder1').set({ note: 'Water plants' }))

    const otherContext = testEnv.authenticatedContext(OTHER_UID)
    const otherArchive = otherContext.firestore().collection('archived_users').doc(OWNER_UID)

    await assertFails(otherArchive.set({ archivedAt: Date.now() }))
    await assertFails(otherArchive.collection('plants').doc('plantA').set({ strain: 'Pineapple Express' }))
    await assertFails(otherArchive.collection('reminders').doc('reminder1').set({ note: 'Ignore plants' }))
  })

  it('allows collection group log reads only for the owning user', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('users')
        .doc(OWNER_UID)
        .collection('plants')
        .doc('plantA')
        .collection('logs')
        .doc('log1')
        .set({ userId: OWNER_UID, note: 'Watered' })
    })

    const ownerContext = testEnv.authenticatedContext(OWNER_UID)
    await assertSucceeds(
      ownerContext.firestore().collectionGroup('logs').where('userId', '==', OWNER_UID).get(),
    )

    const otherContext = testEnv.authenticatedContext(OTHER_UID)
    await assertFails(otherContext.firestore().collectionGroup('logs').where('userId', '==', OWNER_UID).get())
    await assertFails(
      otherContext
        .firestore()
        .collection('users')
        .doc(OWNER_UID)
        .collection('plants')
        .doc('plantA')
        .collection('logs')
        .doc('log1')
        .get(),
    )
  })
})
