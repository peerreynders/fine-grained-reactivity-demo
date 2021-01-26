//
//  Heavily inspired by signal.ts from [https://github.com/ryansolid/solid]
//  and by extension S.js [https://github.com/adamhaile/S]
//
// See:
// https://indepth.dev/posts/1269/finding-fine-grained-reactive-programming#how-it-works
// https://levelup.gitconnected.com/finding-fine-grained-reactive-programming-89741994ddee?source=friends_link&sk=31c66a70c1dce7dd5f3f4229423ad127#4543
//
/**
   @template T
   @typedef { import('reactivity').EqualFn<T>} EqualFn<T>
*/
/** @typedef { import('reactivity').UnsubscribeFn } UnsubscribeFn */

/** @typedef { import('./internal').SubjectR } SubjectR */
/** @typedef { import('./internal').ObserverR } ObserverR */
/** @typedef { import('./internal').MemoR } MemoR */
/**
   @template T
   @typedef { import('./internal').Observer<T> } Observer<T>
*/
/**
   @template T
   @typedef { import('./internal').Subject<T> } Subject<T>
*/
/**
   @template T
   @typedef { import('./internal').Memo<T> } Memo<T>
*/

/** @type { import('./internal').StatusEnum } */
const Status = Object.freeze({
  OK: 0,
  Pending: 1,
  Stale: 2,
});

/**
   @param { ObserverR  } observer
   @return { observer is MemoR }
*/
function isObserverRMemoR(observer) {
  // prettier-ignore
  const memo = /** @type MemoR */ (observer);
  return memo.observers !== undefined;
}

/**
   @template T
   @param { Subject<T> } subject
   @return { subject is Memo<T> }
*/
function isSubjectMemo(subject) {
  // prettier-ignore
  const memo = /** @type Memo<T> */ (/** @type unknown */ (subject));
  return memo.subjects !== undefined;
}

/**
   @template T
   @param { Observer<T> } observer
   @return { observer is Memo<T> }
*/
function isObserverMemo(observer) {
  // prettier-ignore
  const memo = /** @type Memo<T> */ (/** @type unknown */ (observer));
  return memo.observers !== undefined;
}

/**
   @template T
   @type { <T>(lhs: T, rhs: T) => boolean }
*/
const defaultEqual = (lhs, rhs) => lhs === rhs;

/**
   @template T
   @param { boolean | EqualFn<T> | undefined } equal
   @return { EqualFn<T> | undefined }
*/
function selectEqualFn(equal) {
  if (typeof equal === 'function') return equal;

  if (equal === true) return defaultEqual;

  return undefined;
}

// module context values
/** @type ObserverR */
let activeObserver;
/** @type { ObserverR[] | undefined } */
let updateQueue;
/** @type { ObserverR[] | undefined } */
let effectsQueue;

/**
   @param { SubjectR } subject
   @param { ObserverR } observer
   @return void
*/
function link(subject, observer) {
  observer.subjects.add(subject);
  subject.observers.add(observer);
}

/**
   @param { ObserverR } observer
   @return void
*/
function unsubscribe(observer) {
  observer.subjects.forEach((subject) => subject.observers.delete(observer));
}

/**
   @param { ObserverR | undefined } observer
   @return { UnsubscribeFn }
*/
function makeUnsubscribe(observer) {
  return () => {
    if (!observer) return;
    const o = observer;
    observer = undefined;

    unsubscribe(o);
  };
}

/**
   @param { ObserverR } observer
   @return void
*/
function prepareForUpdate(observer) {
  if (isObserverRMemoR(observer) && observer.status !== Status.Pending) {
    markDeepObservers(observer);
  }
  observer.status = Status.Stale;

  // prettier-ignore
  if (observer.pure) (/** @type { ObserverR[] }  */(updateQueue)).push(observer);
  else (/** @type { ObserverR[] } */(effectsQueue)).push(observer);
}

/**
   @param { ObserverR } observer
   @return void
*/
function markDeep(observer) {
  if (observer.status === Status.OK) {
    observer.status = Status.Pending;
    if (isObserverRMemoR(observer)) markDeepObservers(observer);
  }
}

/**
   @param { SubjectR } subject
   @return void
*/
function markDeepObservers(subject) {
  subject.observers.forEach(markDeep);
}

/**
   @param { () => void } prepareUpdates
   @return void
*/
function runUpdates(prepareUpdates) {
  if (updateQueue) return prepareUpdates();

  /** @type ObserverR[] */
  const updates = [];
  updateQueue = updates;

  const [effects, delayEffects] = effectsQueue
    ? [effectsQueue, true]
    : [[], false];
  effectsQueue = effects;

  prepareUpdates();
  updateQueued(updates);
  updateQueue = undefined;

  if (delayEffects) return;

  updateQueued(effects);
  effectsQueue = undefined;
}

/**
   @param { ObserverR[] } queued
   @return void
*/
function updateQueued(queued) {
  for (let i = 0; i < queued.length; i++)
    // prettier-ignore
    updateViaStatus(/** @type Observer<unknown> */(queued[i]), true);
}

/**
   @template T
   @param { Observer<T> } observer
   @param { boolean } saveQueue
   @return void
*/
function updateViaStatus(observer, saveQueue = false) {
  switch (observer.status) {
    case Status.Pending: {
      if (saveQueue !== true) {
        updateDeepStaleSubjects(observer);
      } else {
        const prevUpdate = updateQueue;
        updateQueue = undefined;
        updateDeepStaleSubjects(observer);
        updateQueue = prevUpdate;
      }
      break;
    }
    case Status.Stale:
      updateObserver(observer);
      break;
  }
}

/**
   @template T
   @param { Subject<T> } subject
   @return void
*/
function updateDeep(subject) {
  if (isSubjectMemo(subject)) updateViaStatus(subject);
}

/**
   @template T
   @param { Observer<T> } observer
   @return void
*/
function updateDeepStaleSubjects(observer) {
  observer.subjects.forEach(updateDeep);
}

/**
   @template T
   @param { Observer<T> } observer
   @return void
*/
function updateObserver(observer) {
  unsubscribe(observer);
  const prevObserver = activeObserver;
  activeObserver = observer;

  observer.status = Status.OK;
  const nextValue = observer.updateFn(observer.value);
  if (isObserverMemo(observer)) writeSubject(observer, nextValue);
  else observer.value = nextValue;

  activeObserver = prevObserver;
}

/**
   @template T
   @param {  Subject<T> } subject
   @return void
*/
function readSubject(subject) {
  if (isSubjectMemo(subject) && subject.status !== Status.OK) {
    const updates = updateQueue;
    updateQueue = undefined;
    updateViaStatus(subject);
    updateQueue = updates;
  }
  if (activeObserver) link(subject, activeObserver);

  // prettier-ignore
  return /** @type { !T } */(subject.value);
}

/**
   @template T
   @param { Subject<T> } subject
   @param { T } value
   @return T
*/
function writeSubject(subject, value) {
  if (subject.equalFn && subject.value && subject.equalFn(subject.value, value))
    return value;

  subject.value = value;

  if (subject.observers.size) {
    runUpdates(() => subject.observers.forEach(prepareForUpdate));
  }

  return subject.value;
}

/**
   @template T
   @type { import('reactivity').createSignal<T> }
*/
function createSignal(value, equal, options) {
  /** @type  Subject<T> */
  const subject = {
    name: options?.name,
    observers: new Set(),
    value,
    equalFn: selectEqualFn(equal),
  };

  return [() => readSubject(subject), (value) => writeSubject(subject, value)];
}

/**
   @template T
   @type { import('reactivity').createMemo<T> }
*/
function createMemo(updateFn, value, equal, options) {
  /** @type Memo<T> */
  const memo = {
    name: options?.name,
    observers: new Set(),
    value,
    equalFn: selectEqualFn(equal),
    updateFn,
    status: Status.Stale,
    pure: true,
    subjects: new Set(),
  };
  updateObserver(memo);
  return () => readSubject(memo);
}

/**
   @template T
   @type { import('reactivity').createEffect<T> }
*/
function createEffect(updateFn, value) {
  /** @type Observer<T> */
  const o = {
    value,
    updateFn,
    status: Status.Stale,
    pure: false,
    subjects: new Set(),
  };

  if (effectsQueue) effectsQueue.push(o);
  else updateObserver(o);

  return makeUnsubscribe(o);
}

export { createSignal, createMemo, createEffect };

// -------------------------------------------------------
//
// A `Subject<T>` provides its output value **to**
// its dependents (`Observer<T>`s).
//
// An `Observer<T>` gets its input values **from**
// its dependencies (`Subject<T>`s).
//
// A `Memo<T>` merges the _aspects_ of
// both `Observer<T>` and `Subject<T>`.
// Of the three types `Memo<T>` is the most _general_.
// So while `Memo<T>` is composed of both
// `Subject<T>` and `Observer<T>`, both
// `Subject<T>`, `Observer<T>` could be viewed as
// _constrained_ versions of `Memo<T>` (as
// opposed to _specialized_ versions).
//
// Each type is further split into its _value_ aspect
// (e.g. `ObserverV<T>`) and _relation_ (or _rest_)
// aspect (e.g. `ObserverR`). This tactic helps to
// avoid using generic type references with an
// explicit _any_ type parameter in the update
// routing logic which has no actual dependency
// on the type `T` being managed by the
// `Subject<T>`/ `Observer<T>`/`Memo<T>`
// instance.
//
// The existence of the value aspect is only
// acknowledged in `updateQueued()` where the
// `ObserverR` type is asserted to be an
// `Observer<unknown>` which from this point on is
// then handled by generic functions.
//
// So `createSignal<T>()` internally creates a
// `Subject<T>`, `createEffect<T>()` an `Observer<T>`, and
// `createMemo<T>()` a `Memo<T>`.
//
// `createSignal<T>()` returns two functions in a
// `SignalPair<T>` tuple, a `GetterFn<T>` accessor
// and a `SetterFn<T>` mutator. The mutator triggers
// the update of all the `Subject<T>`'s dependents
// while the accessor returns the `Subject<T>`'s
// current value.
//
// The accessor also has the hidden responsibility
// of subscribing the `Observer<T>` that is accessing
// the `Subject<T>`. The `Observer<T>` shares its
// reference via the module's `activeObserver` context
// value. The `Subject<T>` stores that dependency in
// its `observers` property.
//
// `createMemo<T>()` only returns a `GetterFn<T>`
// accessor to obtain the internal `Memo<T>`'s
// current value. The primary argument to
// `createMemo<T>()` is `fn: UpdateFn<T>` - the
// function responsible for deriving the
// `Memo<T>`'s value from its dependencies
// (and the `Memo<T>`'s own previous value). This
// function is invoked whenever at least one of the
// `Memo<T>`'s dependencies has an updated value.
// The function is run before `createMemo<T>()`
// exits via `updateObserver<T>()` so that
// * the `Memo<T>` can calculate its current value
// * the `Memo<T>` subscribes to all its
//   relevant dependencies.
//
// To that end `updateObserver<T>()` sets the
// module's `activeObserver` context value before
// invoking `fn: UpdateFn<T>` so that all the
// `Subject<T>`'s being accessed can register the
// subscription of the `Observer<T>` (or `Memo<T>`).
//
// (Note that `updateObserver<T>()` unsubscribes the
// `Observer<T>` (or `Memo<T>`) first - this is
// essential later so that the `Observer<T>` isn't
// updated for  irrelevant dependencies - e.g. an
// input accessor that is guarded by an `if` condition
// that currently evaluates to `false`.)
//
// `createEffect<T>()` returns an `UnsubscribeFn`
// function that deactivates the callback when invoked.
// There is no `GetterFn<T>` because the callbacks
// act by _side effect_ - i.e. changing values that
// exist in their enclosing scope (closure:
// https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch7.md
// ). Internally a callback is based on a `Observer<T>`.
// The primary argument to
// `createEffect<T>()` is `fn: UpdateFn<T>` - the
// function is responsible for accessing the `Subject<T>`
// dependencies (and thereby subscribing to them)
// and implementing the side effect(s). This
// function is called whenever at least one of the
// `Observer<T>`'s dependencies has an updated value.
// `updateObserver<T>()` is only invoked if currently no
// update is in progress - otherwise the callback is
// queued for later invocation.
//
// All three `create*` functions take a `value: T`
// argument - required for `createSignal<T>()`,
// optional for the others. For `createSignal<T>()`
// this is the initial value - for the others it is the
// argument that is passed to the `fn: UpdateFn<T>`
// the first time it executes.
//
// `createSignal<T>()` and `createMemo<T>()` have
// an (optional) ` equal?: boolean | EqualFn<T>`
// argument. Given the generic implementation of the
// capabilities, by default `Subject<T>`s don't
// limit updates to occasions when their `value`
// _changes_ - as there is no standardized way
// to check for equality of `T` in TypeScript
// (compared to for example Rust):
// https://doc.rust-lang.org/std/cmp/trait.PartialEq.html
// https://doc.rust-lang.org/std/cmp/trait.Eq.html
//
// A value of `true` directs the use of the default
// equality function `defaultEqual` which will work
// for primitive types and references. Otherwise a
// custom equality predicate must be provided
// if updates for identical values of `T` are to
// be suppressed.
//
// `createEffect<T>` doesn't have this argument.
// Therefore it is necessary to configure the
// `Subject<T>`s it depends on to suppress updates
// on identical values.
//
// `createSignal<T>()` and `createMemo<T>()` have
// an optional `Options` value that may carry a
// `name` property. This can come in handy for
// debugging.
//
// The core capability is driven by the
// `writeSubject<T>` function which is invoked whenever
// an input is set with its `SetterFn<T>` or a
// `Memo<T>` has its `value` set by a dependency.
// The update of dependents is suppressed for identical
// values provided the `Subject<T>` is configured
// accordingly. Otherwise all the observers are
// prepared for update before the actual updates are
// made.
//
// `prepareForUpdate()` first marks the dependents of a
// `Memo<T>` as `Status.Pending` _in depth_. The
// observer itself is marked as `Status.Stale` before
// being pushed onto `updateQueue` or `effectsQueue`.
//
// * `Status.Pending` - an `Observer<T>` has this
//   status when one of its dependencies _descendents_
//   is marked as `Status.Stale`. It acts as a
//   pre-`Status.Stale` status. The `Observer<T>`
//   instance is "out-of-sync" but not yet ready
//   for update (so it isn't on `updateQueue`).
// * `Status.Stale` - an `Observer<T>` enters this
//   state when at least one of its direct
//   dependencies has been updated. The `Observer<T>`
//   instance is on `updateQueue`.
//
// `runUpdates` coordinates the current wave of updates.
// The passed `prepareUpdate` function is invoked if an
// update wave is already underway. Otherwise an empty
// `updateQueue` is set up. If effects are already
// being queued this particular `runUpdates` invocation
// won't be processing effects
// (`delayEffects = true`) - otherwise an empty
// `effectsQueue` is set up.
//
// Finally the passed `prepareUpdates` function is
// invoked causing "memos" to be queued up on
// `updateQueue` and "effects" to be queued up on
// `effectsQueue`. The `updateQueue` is processed
// with the `updateQueued()` function.
//
// Effects are only processed if this is the
// top-level invocation of `runUpdates()` - this
// ensures that effects are updated as late as
// possible to avoid unnecessary, multiple
// updates.
//
// Updates routed through `updateViaStatus` by
// `updateQueued` start a nested (deep) update wave
// for an `Observer<T>` in the `Status.Pending`
// status - i.e. there are dependencies in need of
// update before the `Observer<T>` can perform
// a meaningful update of itself. `Observer<T>`'s
// in the `Status.Stale` status can immediately update
// themselves via their `fn: UpdateFn<T>`.
//
// `readSubject<T>()` will issue a nested update wave
// if it discovers that its `Subject<T>` is currently
// **not** in `Status.OK` status as it needs those
// updates to complete before an up-to-date `value`
// can be returned.
//
// References:
//
// Enums
// https://www.typescriptlang.org/docs/handbook/enums.html
//
// Type Aliases
// https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-aliases
//
// Function Types
// https://www.typescriptlang.org/docs/handbook/functions.html#function-types
//
// Generics
// https://www.typescriptlang.org/docs/handbook/generics.html
//
// Optional and Default Types
// https://www.typescriptlang.org/docs/handbook/functions.html#optional-and-default-parameters
//
// Tuple
// https://www.typescriptlang.org/docs/handbook/basic-types.html#tuple
//
// Optional Properties
// https://www.typescriptlang.org/docs/handbook/interfaces.html#optional-properties
//
// Set
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
//
// Intersection Types
// https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types
//
// User-Defined Type Guards
// https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
//
// Type Assertions
// https://www.typescriptlang.org/docs/handbook/basic-types.html#type-assertions
//
// Union Types
// https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-types
//
// typeof
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
//
// Unknown
// https://www.typescriptlang.org/docs/handbook/basic-types.html#unknown
//
// Non-null assertion operator
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator
//
// Optional chaining (?.)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
//
// -------------------------------------------------------
