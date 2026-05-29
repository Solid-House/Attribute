const test = require('node:test')
const assert = require('node:assert/strict')

const { createApiKeyStore } = require('../out-test/apiKeyStore.js')

// In-memory settings store mirroring the JSON file store in index.ts.
function makeSettings(initial = {}) {
  const data = { ...initial }
  return {
    data,
    read() {
      return { ...data }
    },
    write(key, value) {
      data[key] = value
    },
    delete(key) {
      delete data[key]
    }
  }
}

test('load deletes the stored key and returns undefined when decrypt throws', () => {
  const settings = makeSettings({ 'gemini-api-key': 'corrupt-base64' })
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: () => {
      throw new Error('not used')
    },
    decryptString: () => {
      throw new Error('decrypt failed')
    }
  }
  const store = createApiKeyStore(safeStorage, settings)

  const result = store.load()

  assert.equal(result, undefined, 'should not return a plaintext fallback')
  assert.equal(
    Object.prototype.hasOwnProperty.call(settings.data, 'gemini-api-key'),
    false,
    'unreadable key should be deleted from settings'
  )
})

test('load returns undefined and save writes nothing when encryption is unavailable', () => {
  const settings = makeSettings({ 'gemini-api-key': 'some-stored-value' })
  let encryptCalls = 0
  const writes = []
  const safeStorage = {
    isEncryptionAvailable: () => false,
    encryptString: (s) => {
      encryptCalls++
      return Buffer.from(s, 'utf-8')
    },
    decryptString: () => {
      throw new Error('should not be called')
    }
  }
  // Wrap settings to record writes for the save assertion.
  const recordingSettings = {
    read: settings.read,
    write: (key, value) => {
      writes.push([key, value])
      settings.write(key, value)
    },
    delete: settings.delete
  }
  const store = createApiKeyStore(safeStorage, recordingSettings)

  assert.equal(store.load(), undefined, 'should not load a stored key without encryption')

  store.save('my-secret-key')
  assert.equal(encryptCalls, 0, 'should not attempt to encrypt without encryption available')
  assert.equal(writes.length, 0, 'save should write nothing when encryption is unavailable')
})

test('round-trips the key when encryption is available', () => {
  const settings = makeSettings()
  // Reversible "encryption" stand-in: prefix + base64 of the plaintext.
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from('ENC:' + s, 'utf-8'),
    decryptString: (buf) => {
      const s = buf.toString('utf-8')
      if (!s.startsWith('ENC:')) throw new Error('bad ciphertext')
      return s.slice(4)
    }
  }
  const store = createApiKeyStore(safeStorage, settings)

  store.save('AIza-secret-123')

  // Stored value is encrypted (base64), not the plaintext.
  const stored = settings.data['gemini-api-key']
  assert.equal(typeof stored, 'string')
  assert.ok(!stored.includes('AIza-secret-123'), 'plaintext must not be persisted')

  assert.equal(store.load(), 'AIza-secret-123', 'should decrypt back to the original key')
})

test('save removes any legacy plaintext key', () => {
  const settings = makeSettings({ 'gemini-api-key-plain': 'old-plaintext' })
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from('ENC:' + s, 'utf-8'),
    decryptString: (buf) => buf.toString('utf-8').slice(4)
  }
  const store = createApiKeyStore(safeStorage, settings)

  store.save('new-key')

  assert.equal(
    Object.prototype.hasOwnProperty.call(settings.data, 'gemini-api-key-plain'),
    false,
    'legacy plaintext key should be deleted on save'
  )
})

test('remove deletes the stored key', () => {
  const settings = makeSettings({ 'gemini-api-key': 'whatever' })
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from(s, 'utf-8'),
    decryptString: (buf) => buf.toString('utf-8')
  }
  const store = createApiKeyStore(safeStorage, settings)

  store.remove()

  assert.equal(
    Object.prototype.hasOwnProperty.call(settings.data, 'gemini-api-key'),
    false,
    'remove should delete the stored key'
  )
})

test('load returns undefined when nothing is stored', () => {
  const settings = makeSettings()
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from(s, 'utf-8'),
    decryptString: (buf) => buf.toString('utf-8')
  }
  const store = createApiKeyStore(safeStorage, settings)

  assert.equal(store.load(), undefined)
})
