import { useAppDispatch } from './reduxHooks';
import { addToast } from '../store/slices/toastSlice';

export const useToast = () => {
  const dispatch = useAppDispatch();

  const success = (message: string) => {
    dispatch(addToast({ message, type: 'success' }));
  };

  const error = (message: string) => {
    dispatch(
      addToast({ 
        message: typeof message === 'string' ? message : 'Something went wrong', 
        type: 'error' 
      })
    );
  };

  const info = (message: string) => {
    dispatch(addToast({ message, type: 'info' }));
  };

  const warning = (message: string) => {
    dispatch(addToast({ message, type: 'warning' }));
  };

  return { success, error, info, warning };
};
