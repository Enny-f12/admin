"use client";

import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { decrement, increment, incrementByAmount } from '@/lib/slices/counterSlice';

const Page = () => {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState(2);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Redux Counter Example</h1>

      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => dispatch(decrement())}
          className="rounded border px-3 py-2"
        >
          -
        </button>
        <span className="text-xl font-medium">{count}</span>
        <button
          type="button"
          onClick={() => dispatch(increment())}
          className="rounded border px-3 py-2"
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="rounded border px-3 py-2 w-full sm:w-24"
        />
        <button
          type="button"
          onClick={() => dispatch(incrementByAmount(amount))}
          className="rounded border px-3 py-2"
        >
          Add amount
        </button>
      </div>
    </div>
  );
};

export default Page;