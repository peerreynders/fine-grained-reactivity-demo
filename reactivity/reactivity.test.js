import test from 'ava';
import { createSignal, createMemo, createEffect } from './reactivity.js';

test('A signal has a value', (t) => {
  const initialValue = 10;
  const [input, _setInput] = createSignal(initialValue);
  t.is(input(), initialValue);
});

test("A signal's value can be set", (t) => {
  const newValue = 20;
  const [input, setInput] = createSignal(4);
  setInput(newValue);
  t.is(input(), newValue);
});

test('A memo calculates an initial value', (t) => {
  const [input] = createSignal(1);
  const output = createMemo(() => input() + 1);
  t.is(output(), 2);
});

test('A memo takes signals in the correct order', (t) => {
  const [[one], [two]] = [createSignal(1), createSignal(2)];
  const output = createMemo(() => one() + two() * 10);
  t.is(output(), 21);
});

test("A memo's value updates when it's signal is changed", (t) => {
  const [input, setInput] = createSignal(1);
  const output = createMemo(() => input() + 1);
  setInput(3);
  t.is(output(), 4);
});

test('A memo can depend on other memos', (t) => {
  const [input, setInput] = createSignal(1);
  const timesTwo = createMemo(() => input() * 2);
  const timesThirty = createMemo(() => input() * 30);
  const sum = createMemo(() => timesTwo() + timesThirty());

  t.is(sum(), 32);
  setInput(3);
  t.is(sum(), 96);
});

test('A memo fires an effect', (t) => {
  const [input, setInput] = createSignal(1);
  const output = createMemo(() => input() + 1);
  let value = 0;
  createEffect(() => (value = output()));
  setInput(3);
  t.is(value, 4);
});

test("An effect fires only when the memo's value changes", (t) => {
  const [input, setInput] = createSignal(1);
  const output = createMemo(
    () => (input() < 3 ? 111 : 222),
    undefined,
    true // i.e. equality check - don't propagate if value doesn't change
  );
  let value;
  createEffect(() => (value = output()));
  value = undefined; // discard initial value from registration
  setInput(2);
  t.is(value, undefined);
  setInput(4);
  t.is(value, 222);
});

test('An effect does not report a stale value', (t) => {
  const [input, setInput] = createSignal(1);
  const output = createMemo(() => input() + 1);

  let value;
  createEffect(() => (value = output()));

  setInput(2);
  t.is(value, 3);

  setInput(3);
  t.is(value, 4);
});

test('Effects can fire from distinct sources', (t) => {
  const [input, setInput] = createSignal(1);
  const plus_one = createMemo(() => input() + 1);
  const minus_one = createMemo(() => input() - 1);

  let value1 = 0;
  createEffect(() => {
    value1 = plus_one();
  });
  let value2 = 0;
  createEffect(() => {
    value2 = minus_one();
  });

  setInput(10);
  t.is(value1, 11);
  t.is(value2, 9);
});

test("An effect fires even if the value it evaluates to doesn't change", (t) => {
  const [input, setInput] = createSignal(1);
  const output = createMemo(
    () => (input() < 3 ? 111 : 222),
    undefined,
    true // i.e. equality check - don't propagate if value doesn't change
  );

  /** @type string[] */
  const values = [];
  createEffect(() => {
    const _dontCare = output();
    values.push('cell changed');
  });
  values.pop(); // discard initial value from registration
  setInput(2);
  t.deepEqual(values, []);
  setInput(4);
  setInput(2);
  setInput(4);
  t.deepEqual(values, ['cell changed', 'cell changed', 'cell changed']);
});

test('Effects can be added and removed', (t) => {
  const [input, setInput] = createSignal(11);
  const output = createMemo(() => input() + 1);

  /** @type number[] */
  const values1 = [];
  const unsubscribe1 = createEffect(() => values1.push(output()));
  values1.pop(); // discard initial value from registration
  /** @type number[] */
  const values2 = [];
  createEffect(() => values2.push(output()));
  values2.pop(); // discard initial value ...

  setInput(31);

  unsubscribe1();

  /** @type number[] */
  const values3 = [];
  createEffect(() => values3.push(output()));
  values3.pop(); // discard initial value ...

  setInput(41);

  t.deepEqual(values1, [32]);
  t.deepEqual(values2, [32, 42]);
  t.deepEqual(values3, [42]);
});

test("Removing an effect multiple times doesn't interfere with other effects", (t) => {
  const [input, setInput] = createSignal(1);
  const output = createMemo(() => input() + 1);

  /** @type number[] */
  const values1 = [];
  const unsubscribe1 = createEffect(() => values1.push(output()));
  values1.pop(); // discard initial value from registration
  /** @type number[] */
  const values2 = [];
  createEffect(() => values2.push(output()));
  values2.pop(); // discard initial value ...

  unsubscribe1();
  unsubscribe1();
  unsubscribe1();

  setInput(2);

  t.deepEqual(values1, []);
  t.deepEqual(values2, [3]);
});

test('Effects should only be called once, even when multiple dependencies change', (t) => {
  const [input, setInput] = createSignal(1);
  const plusOne = createMemo(() => input() + 1);
  const minusOne1 = createMemo(() => input() - 1);
  const minusOne2 = createMemo(() => minusOne1() - 1);
  const output = createMemo(() => plusOne() * minusOne2());

  /** @type number[] */
  const values = [];
  createEffect(() => values.push(output()));
  values.pop(); // discard initial value from registration

  setInput(4);

  t.deepEqual(values, [10]);
});

test("Effect on a stable source doesn't fire - even when that source's sources vary", (t) => {
  const [input, setInput] = createSignal(1);
  const plusOne = createMemo(() => input() + 1);
  const minusOne = createMemo(() => input() - 1);
  const alwaysTwo = createMemo(
    () => plusOne() - minusOne(),
    undefined,
    true // i.e. equality check - don't propagate if value doesn't change
  );

  /** @type number[] */
  const values = [];
  createEffect(() => values.push(alwaysTwo()));
  values.pop(); // discard initial value from registration

  setInput(2);
  setInput(3);
  setInput(4);
  setInput(5);

  t.deepEqual(values, []);
});
