/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ParseIntIdPipe } from './parse-int-id.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

describe('ParseIntIdPipe', () => {
  let pipe: ParseIntIdPipe;
  const metadata: ArgumentMetadata = { type: 'param', data: 'id' };

  beforeEach(() => {
    pipe = new ParseIntIdPipe();
  });

  it('should return value as is if metadata type is not param', () => {
    const nonParamMetadata: ArgumentMetadata = { type: 'body', data: 'id' };
    const value = 'test';
    const result = pipe.transform(value, nonParamMetadata);
    expect(result).toBe(value);
  });

  it('should return value as is if metadata data is not id', () => {
    const otherDataMetadata: ArgumentMetadata = {
      type: 'param',
      data: 'userId',
    };
    const value = 'test';
    const result = pipe.transform(value, otherDataMetadata);
    expect(result).toBe(value);
  });

  it('should convert valid ID string to number', () => {
    const result = pipe.transform('123', metadata);
    expect(result).toBe(123);
  });

  it('should throw for non-numeric ID', () => {
    expect(() => pipe.transform('abc', metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform('abc', metadata)).toThrow(
      'ID must be a positive numeric string',
    );
  });

  it('should throw for negative ID', () => {
    expect(() => pipe.transform('-5', metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform('-5', metadata)).toThrow(
      'ID must be a positive number',
    );
  });

  it('should throw for zero ID', () => {
    expect(() => pipe.transform('0', metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform('0', metadata)).toThrow(
      'ID must be a positive number',
    );
  });
});
