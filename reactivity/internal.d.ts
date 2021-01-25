type StatusEnum = {
  OK: 0;
  Pending: 1;
  Stale: 2;
};
type Status = StatusEnum[keyof StatusEnum];

/**
   Type for the closure's value equality predicate.

   @typeParam T - Type of the values being compared for
   equality.

   @remarks
   Conceptually this function should be equivalent
   to: `lhs === rhs`

   @param lhs   - left hand side value
   @param rhs   - right hand side value
   @returns     - `true` if values are considered
   equal; `false` otherwise.
*/
type EqualFn<T> = (lhs: T, rhs: T) => boolean;
type GetterFn<T> = () => T;
type SetterFn<T> = (value: T) => T;
type UnsubscribeFn = () => void;
type UpdateFn<T> = (value?: T) => T;

export type SignalPair<T> = [GetterFn<T>, SetterFn<T>];

type Options = {
  name: string;
};

type ObserverR = {
  name?: string;
  pure: boolean;
  status: Status;
  subjects: Set<SubjectR>;
};

type ObserverV<T> = {
  value?: T;
  updateFn: UpdateFn<T>;
};

type Observer<T> = ObserverR & ObserverV<T>;

type SubjectR = {
  name?: string;
  observers: Set<ObserverR>;
};

type SubjectV<T> = {
  value?: T;
  equalFn?: EqualFn<T>;
};

type Subject<T> = SubjectR & SubjectV<T>;

type MemoR = ObserverR & SubjectR;

type Memo<T> = MemoR & ObserverV<T> & SubjectV<T>;
