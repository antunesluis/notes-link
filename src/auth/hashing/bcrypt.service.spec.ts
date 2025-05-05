/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { BcryptService } from './bcrypt.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('BcryptService', () => {
  let service: BcryptService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BcryptService();
  });

  describe('hash', () => {
    it('should generate a salt and hash the password', async () => {
      const password = 'testPassword123';
      const salt = 'generatedSalt';
      const hash = 'hashedPassword';

      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue(salt);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hash);

      const result = await service.hash(password);

      expect(bcrypt.genSalt).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hash);
    });

    it('should throw error when hashing fails', async () => {
      const password = 'testPassword123';
      const error = new Error('Hashing failed');
      jest.spyOn(bcrypt, 'genSalt').mockRejectedValue(error);

      const result = service.hash(password);

      await expect(result).rejects.toThrow(error);
    });
  });

  describe('compare', () => {
    it('should compare plain text with hash', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword';
      const isValid = true;
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(isValid);

      const result = await service.compare(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(isValid);
    });

    it('should return false when comparison fails', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPassword';
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.compare(password, hash);

      expect(result).toBe(false);
    });

    it('should throw error when comparison throws', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword';
      const error = new Error('Comparison failed');
      jest.spyOn(bcrypt, 'compare').mockRejectedValue(error);

      const result = service.compare(password, hash);

      await expect(result).rejects.toThrow(error);
    });
  });

  describe('integration', () => {
    it('should hash and then compare successfully', async () => {
      const password = 'testPassword123';
      const salt = 'generatedSalt';
      const hash = 'hashedPassword';

      // Mock hash process
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue(salt);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hash);

      // Mock compare to return true when comparing the same password
      jest.spyOn(bcrypt, 'compare').mockImplementation((plain, hashed) => {
        return plain === password && hashed === hash;
      });

      const hashed = await service.hash(password);
      const comparison = await service.compare(password, hashed);

      expect(comparison).toBe(true);
    });
  });
});
