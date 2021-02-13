
# Fine-Grained Reactivity Demo

A typed ECMAScript<sup>[1](#originally-ts)</sup> demo of fine-grained reactive programming.
* The Inspiration: [Finding Fine-Grained Reactive Programming](https://indepth.dev/posts/1269/finding-fine-grained-reactive-programming#how-it-works) (or on [gitconnected.com](https://levelup.gitconnected.com/finding-fine-grained-reactive-programming-89741994ddee?source=friends_link&sk=31c66a70c1dce7dd5f3f4229423ad127#4543)) - How It Works (... but what does that look like in detail?) - 2021-02-09: [A Hands-on Introduction to Fine-Grained Reactivity](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf).
* The Opportunity: A pre-existing exercise-centric test specification - [Implement a basic reactive system](https://github.com/exercism/problem-specifications/blob/master/exercises/react/canonical-data.json) (... I wish this was phrased in terms of fine-grained reactive programming).
* The Motivation: The [exercise](https://exercism.io/tracks/javascript/exercises/react) hasn't been implemented for the TypeScript track (... hmmm ...).
* The Sources: [`solid/src/reactive/signal.ts`](https://github.com/ryansolid/solid/blob/master/packages/solid/src/reactive/signal.ts) and [Reactivity](https://github.com/ryansolid/solid/blob/master/documentation/reactivity.md#user-content-computations).
* The Result: The [React Exercise](https://github.com/exercism/typescript/tree/main/exercises/practice/react) ([PR](https://github.com/exercism/typescript/pull/373)) on the [exercism.io TypeScript track](https://exercism.io/tracks/typescript/exercises/react) and this repository (the core is found in [`reactivity/reactivity.js`](reactivity/reactivity.js)).

```ShellSession
$ cd fine-grained-reactivity-demo
$ npm i
added 411 packages from 225 contributors and audited 412 packages in 3.726s
found 0 vulnerabilities

$ npm run lint
> npm run lint:types && npm run lint:es
> cd ./reactivity && npm run lint:types
> ../node_modules/.bin/tsc
> eslint ./reactivity

$ npm run test
> cd ./reactivity && npm run test
> ../node_modules/.bin/ava --config ava.config.js
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
<a name="originally-ts">1</a>: Originally authored in TypeScript. After this [tweet](https://twitter.com/Rich_Harris/status/1350436286948122625) this repository was converted to typed ECMAScript.
