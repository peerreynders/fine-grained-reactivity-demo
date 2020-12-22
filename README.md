# Fine-Grained Reactivity Demo

TypeScript demo of fine-grained reactivity programming.
* The Inspiration: [Finding Fine-Grained Reactive Programming](https://levelup.gitconnected.com/finding-fine-grained-reactive-programming-89741994ddee#4543) - How It Works (... but what does that look like in detail?)
* The Opportunity: A preexisting exercise-centric test specification - [Implement a basic reactive system](https://github.com/exercism/problem-specifications/blob/master/exercises/react/canonical-data.json) (... I wish this was phrased in terms of fine-grained reactive programming).
* The Motivation: [The exercise](https://exercism.io/tracks/javascript/exercises/react) hasn't been implemented for the TypeScript track (... hmmm ...).
* The Source: [`solid/src/reactive/signal.ts`](https://github.com/ryansolid/solid/blob/master/packages/solid/src/reactive/signal.ts) and [Reactivity](https://github.com/ryansolid/solid/blob/master/documentation/reactivity.md#user-content-computations).
* The Result: This repository.

```ShellSession
$ npm run test

> fine-grained-reactivity-demo@1.0.0 test
> npm run lint:types && ava --config ava.config.js

> fine-grained-reactivity-demo@1.0.0 lint:types
> tsc --noEmit -p .

  ✔ A signal has a value
  ✔ A signal's value can be set
  ✔ A memo calculates an initial value
  ✔ A memo takes signals in the correct order
  ✔ A memo's value updates when it's signal is changed
  ✔ A memo can depend on other memos
  ✔ A memo fires an effect
  ✔ An effect fires only when the memo's value changes
  ✔ An effect does not report a stale value
  ✔ Effects can fire from distinct sources
  ✔ An effect fires even if the value it evaluates to doesn't change
  ✔ Effects can be added and removed
  ✔ Removing an effect multiple times doesn't interfere with other effects
  ✔ Effects should only be called once, even when multiple dependencies change
  ✔ Effect on a stable source doesn't fire - even when that source's sources vary
  ─

  15 tests passed
$ 
```
