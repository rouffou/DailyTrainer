import { HttpsError } from 'firebase-functions/v2/https';

import { extractQuery } from './searchFood';

describe('extractQuery', () => {
  it('returns the query when it is a non-empty string', () => {
    expect(extractQuery({ query: 'bacon aldi' })).toBe('bacon aldi');
  });

  it('throws HttpsError("invalid-argument") when query is missing', () => {
    expect(() => extractQuery({})).toThrow(HttpsError);
  });

  it('throws HttpsError("invalid-argument") when query is an empty string', () => {
    expect(() => extractQuery({ query: '   ' })).toThrow(HttpsError);
  });

  it('throws HttpsError("invalid-argument") when query is not a string', () => {
    expect(() => extractQuery({ query: 42 })).toThrow(HttpsError);
  });

  it('throws HttpsError("invalid-argument") when data is null', () => {
    expect(() => extractQuery(null)).toThrow(HttpsError);
  });
});
