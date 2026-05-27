
/* IMPORT */

import type {Primitive} from './types.ts';

/* MAIN */


const isString = ( value: unknown ): value is string => {
  return typeof value === 'string';
};

const stripComments = ( value: Primitive ): Primitive => {
  if ( !isString ( value ) || !value.length ) return value;
  const comment1Index = value.indexOf ( '#' );
  const comment2Index = value.indexOf ( ';' );
  const commentIndex = ( comment1Index >= 0 ) ? ( comment2Index >= 0 ? Math.min ( comment1Index, comment2Index ) : comment1Index ) : comment2Index;
  if ( commentIndex < 0 ) return value;
  value = value.slice ( 0, commentIndex ).trimEnd ();
  return value;
};

/* EXPORT */

export {stripComments};
