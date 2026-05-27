/* MAIN */

type Primitive = null | boolean | number | string;

type Results = Partial<{
  [key: string]: Results | Primitive
}>;

/* EXPORT */

export type {Primitive, Results};
