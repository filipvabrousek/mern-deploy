import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { decrementTimer, resetTimer } from './timerSlicer';

export const useExamTimer = (isRunning, onExpire) => {
  const dispatch = useDispatch();
  const timeLefta = useSelector(state => state.timer.timeLeft);
  const intervalRef = useRef(null);

  // Start the interval
  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      dispatch(decrementTimer());
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reset = () => {
    dispatch(resetTimer());
    stop();
  };

  // Watch isRunning
  useEffect(() => {
    if (isRunning) start();
    else stop();
    return () => stop();
  }, [isRunning]);

  // Watch timeLefta to trigger onExpire
  useEffect(() => {
    if (timeLefta === 0 && typeof onExpire === 'function') {
      onExpire();
    }
  }, [timeLefta, onExpire]);

  return { timeLefta, start, stop, reset };
};
