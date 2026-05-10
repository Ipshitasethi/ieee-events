import React, { forwardRef } from 'react';

export const Input = forwardRef(({ className = '', type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-elevated-admin dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-accent-cyan ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const Label = forwardRef(({ className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-syne text-slate-700 dark:text-slate-300 ${className}`}
    {...props}
  />
));

Label.displayName = 'Label';
