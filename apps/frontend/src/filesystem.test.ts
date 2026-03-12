import { expect, test } from 'vitest';
import { getFileExtension } from './filesystem';

test('file extension is extracted', () => {
    expect(getFileExtension('ab.txt')).toBe('txt');
});

