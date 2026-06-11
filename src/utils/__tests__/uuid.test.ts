/// <reference types="jest" />
import { generateUuid } from '../uuid';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateUuid', () => {
  it('should return a valid v4 UUID string', () => {
    const uuid = generateUuid();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('should return different UUIDs on consecutive calls', () => {
    const uuid1 = generateUuid();
    const uuid2 = generateUuid();
    expect(uuid1).not.toBe(uuid2);
    expect(uuid1).toMatch(UUID_V4_REGEX);
    expect(uuid2).toMatch(UUID_V4_REGEX);
  });

  it('should generate 100 unique UUIDs', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const uuid = generateUuid();
      expect(uuid).toMatch(UUID_V4_REGEX);
      uuids.add(uuid);
    }
    expect(uuids.size).toBe(100);
  });
});
