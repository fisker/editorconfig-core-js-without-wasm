/* IMPORT */

import {stripComments} from './utils.ts';
import type {Primitive, Results} from './types.ts';

/* MAIN */

//TODO: Maybe make this a special-case of a spec-compliant configurable TOML parser
//TODO: Maybe write this a bit more low-level, for a bit better performance, potentially

const parse = ( input: string ): Results => {

  /* CONSTANTS */

  const COMMENT1 = 35; // #
  const COMMENT2 = 59; // ;
  const SECTION_START = 91; // [
  const SECTION_END = 93; // ]

  /* PARSING */

  const results: Results = {};
  const lines = input.split ( /\r?\n|\r/g );

  let section = results;

  for ( let i = 0, l = lines.length; i < l; i++ ) {

    const line = lines[i].trim ();

    if ( !line.length ) continue; // Empty line

    const firstChar = line.charCodeAt ( 0 );

    if ( firstChar === COMMENT1 || firstChar === COMMENT2 ) continue; // Comment line

    const lastChar = line.charCodeAt ( line.length - 1 );

    if ( firstChar === SECTION_START ) { // Section start

      if ( lastChar === SECTION_END ) { // Section end

        const key = line.slice ( 1, -1 );

        // @ts-ignore
        section = results[key] =
          Object.prototype.hasOwnProperty.call(results, key) && typeof results[key] !== 'string' ?
          Object.assign({}, results[key]):
          {};

        continue;

      } else {

        throw new Error ( `Unexpected unclosed section at line ${i + 1}` );

      }

    }

    const delimiterIndex = line.indexOf ( '=' );

    if ( delimiterIndex >= 0 ) { // Key-value pair

      let key: Primitive = line.slice ( 0, delimiterIndex ).trim ();
      let value: Primitive = line.slice ( delimiterIndex + 1 ).trim ();

      value = stripComments ( value );

      section[`${key}`] = value;

      continue;

    }

    throw new Error ( `Unexpected characters at line ${i + 1}` );

  }

  return results;

};

/* EXPORT */

export default parse;
export type {Results};
