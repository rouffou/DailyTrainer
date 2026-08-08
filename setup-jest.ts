import 'jest-preset-angular/setup-env/zoneless';

// jsdom (jest's test DOM) doesn't implement fetch, the Streams API, or MessagePort, but
// @angular/fire/auth needs all three just to load its Node platform module — without this
// every spec that transitively imports AuthService fails at import time chasing one missing
// global after another ("fetch is not defined", then "ReadableStream", then "MessagePort").
//
// Uses require() instead of `import` on purpose: TypeScript hoists `import` statements to the
// top of the compiled file regardless of source order, so these polyfills would still run
// after undici's own module-level code has already read the globals it needs. require() runs
// exactly where it's written.
if (typeof globalThis.MessagePort === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- see comment above: order-sensitive
  const { MessagePort } = require('node:worker_threads');
  Object.assign(globalThis, { MessagePort });
}
if (typeof globalThis.ReadableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- see comment above: order-sensitive
  const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');
  Object.assign(globalThis, { ReadableStream, WritableStream, TransformStream });
}
if (typeof globalThis.fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- see comment above: order-sensitive
  const { fetch, Headers, Request, Response } = require('undici');
  Object.assign(globalThis, { fetch, Headers, Request, Response });
}
