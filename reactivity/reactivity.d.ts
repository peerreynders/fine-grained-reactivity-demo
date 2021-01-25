import type {
  GetterFn,
  EqualFn,
  SetterFn,
  UnsubscribeFn,
  UpdateFn,
  Options,
  SignalPair,
} from './internal';

/**
 * Creates a signal closure. The value is accessed
 * via the accessor and changed via the
 * mutator returned as part an `SignalPair<T>`.
 *
T * @typeParam T   - Type of the closure's value.
 *                By extension the type of the return
 *                value of the accessor and the type
 *                of the mutator's single argument.
 *
 * @param value   - Signal closure's initial value.
 * @param equal   - By default the current and previous
 *                values are not compared so invoking
 *                the mutator with identical values
 *                will trigger updates on any
 *                subscribers. When `true` is
 *                specified the
 *                {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality | strict equality operator}
 *                is used to compare values and
 *                mutations with unchanging values
 *                **are** suppressed.
 *                When `T` is a structural type
 *                it is necessary to provide a
 *                `(a: T, b: T) => boolean` comparison
 *                predicate instead.
 * @param options - Holder object for relevant options.
 *                Assigning a `name` to a subject can
 *                be useful during debugging.
 * @returns       - A `SignalPair<T>`. The 1st
 *                element is the accessor (getter
 *                function), the 2nd element is
 *                the mutator (setter function).
 */
export function createSignal<T>(
  value: T,
  equal?: boolean | EqualFn<T>,
  options?: Options
): SignalPair<T>;

/**
 * Creates a memo (derived) closure with the
 * supplied function which computes the current value
 * of the closure.
 *
 * @typeParam T   - Type of the closure's value.
 *                By extension the type of the value
 *                returned by the update function and
 *                of the value
 *                accepted by the function.
 *
 * @param updateFn - Update function. This function
 *                 references one or more accessors of
 *                 other subjects. It **should not**
 *                 perform side effects. It is expected
 *                 to return a value which will be the
 *                 value of the closure until the next
 *                 update. The closure's value is
 *                 supplied to this update function
 *                 on the next update.
 * @param value    - Initial value that is passed to
 *                 `updateFn` when it executes for the
 *                 first time.
 * @param equal    - By default the current and previous
 *                 values are not compared so updates
 *                 will be triggered even if the value
 *                 doesn't _change_. When `true` is
 *                 specified the
 *                 {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality | strict equality operator}
 *                 is used to compare values and updates
 *                 with identical values **are**
 *                 suppressed. When `T` is a structural
 *                 type it is necessary to provide a
 *                 `(a: T, b: T) => boolean` comparison
 *                 predicate instead.
 * @param options  - Holder object for relevant options.
 *                 Assigning a `name` to a subject can
 *                 be useful during debugging.
 * @returns        - The accessor to the closure's
 *                 value (getter function). Retrieves
 *                 the closure's current value. Used by
 *                 observers (or more accurately their
 *                 update function) to obtain the
 *                 value (and to subscribe for
 *                 updates).
 */
export function createMemo<T>(
  updateFn: UpdateFn<T>,
  value?: T,
  equal?: boolean | EqualFn<T>,
  options?: Options
): GetterFn<T>;

/**
 * Creates an effect closure with the supplied
 * function which is expected to perform side effects.
 *
 * @typeParam T    - Type of the closure's value.
 *                 By extension the type of the value
 *                 returned by the effect function
 *                 and of the value accepted by the
 *                 function.
 *
 * @param updateFn - Effect function. This function
 *                 references one or more accessors of
 *                 subjects. It may perform side effects.
 *                 It will also be passed the
 *                 value that it returned the last time it
 *                 was invoked.
 * @param value    - Initial value that is passed to
 *                 `updateFn` when it executes for
 *                  the first time.
 * @returns        - The `unsubscribe` function. Once
 *                 invoked the effect closure will
 *                 stop receiving updates from the
 *                 subjects it subscribed to.
 */
export function createEffect<T>(
  updateFn: UpdateFn<T>,
  value?: T
): UnsubscribeFn;
