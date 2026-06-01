import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addToast, type ToastType } from '../store/slices/toastSlice';

export function useToast() {
  const dispatch = useDispatch();

  const show = useCallback(
    (message: string, type: ToastType = 'success') => {
      dispatch(addToast({ message, type }));
    },
    [dispatch],
  );

  return {
    show,
    success: useCallback((message = 'Success') => show(message, 'success'), [show]),
    error: useCallback((message = 'Something went wrong') => show(message, 'error'), [show]),
    info: useCallback((message: string) => show(message, 'info'), [show]),
  };
}
