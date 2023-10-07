import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

type Actions = Record<string, (...args: any[]) => any>;

export function useActions<T extends Actions>(actions: T): T {
  const dispatch = useDispatch();

  return useMemo(
    () =>
      Object.entries(actions).reduce((acc, [key, action]) => {
        const newAction = (...args: any[]) => dispatch(action(...args));
        acc[key as keyof T] = newAction as any;
        return acc;
      }, {} as T),
    [dispatch]
  );
}
