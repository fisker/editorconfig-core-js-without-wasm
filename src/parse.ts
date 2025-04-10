import parseIni, {type Results} from 'ini-simple-parser';
import type {Buffer} from 'node:buffer';

export type SectionName = string | null;
export interface SectionBody {
  [key: string]: string;
}
export type ParseStringResult = [SectionName, SectionBody][];

/**
 * Parses a string.  If possible, you should always use ParseBuffer instead,
 * since this function does a UTF16-to-UTF8 conversion first.
 *
 * @param data String to parse.
 * @returns Parsed contents.  Will be truncated if there was a parse error.
 */
export function parseString(data: string): ParseStringResult {
  const root: SectionBody = {};
  const result: ParseStringResult = [[null, root]];

  let parsed: Results | undefined = undefined;
  try {
    parsed = parseIni(data);
  } catch {
    return result;
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (value && typeof value === 'object') {
      result.push([key, value as SectionBody]);
    } else {
      root[key] = value as string;
    }
  }

  return result;
}

/**
 * Parse a buffer using the faster one-ini WASM approach into something
 * relatively easy to deal with in JS.
 *
 * @param data UTF8-encoded bytes.
 * @returns Parsed contents.  Will be truncated if there was a parse error.
 */
export function parseBuffer(data: Buffer): ParseStringResult {
  return parseString(data.toString());
}
