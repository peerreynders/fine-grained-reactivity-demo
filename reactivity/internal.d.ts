export type StatusEnum = {
  OK: 0;
  Pending: 1;
  Stale: 2;
};
export type Status = StatusEnum[keyof StatusEnum];

export type ObserverR = {
  name?: string;
  pure: boolean;
  status: Status;
  subjects: Set<SubjectR>;
};

type UpdateFn<T> = import('reactivity').UpdateFn<T>;

type ObserverV<T> = {
  value?: T;
  updateFn: UpdateFn<T>;
};

export type Observer<T> = ObserverR & ObserverV<T>;

export type SubjectR = {
  name?: string;
  observers: Set<ObserverR>;
};

type EqualFn<T> = import('reactivity').EqualFn<T>;

type SubjectV<T> = {
  value?: T;
  equalFn?: EqualFn<T>;
};

export type Subject<T> = SubjectR & SubjectV<T>;

export type MemoR = ObserverR & SubjectR;

export type Memo<T> = MemoR & ObserverV<T> & SubjectV<T>;
