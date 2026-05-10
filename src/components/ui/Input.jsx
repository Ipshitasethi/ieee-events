import React, { forwardRef } from 'react';

export const Input = forwardRef(({ className = '', type = 'text', variant = 'admin', ...props }, ref) => {
  const baseStyles = "flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all";
  const variants = {
    admin: "border-slate-700 bg-elevated-admin text-slate-200 placeholder:text-slate-500 focus:ring-accent-cyan",
    public: "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-accent-blue"
  };

  return (
    <input
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const Label = forwardRef(({ className = '', variant = 'admin', ...props }, ref) => {
  const variants = {
    admin: "text-slate-300",
    public: "text-slate-700"
  };
  return (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-syne ${variants[variant]} ${className}`}
      {...props}
    />
  );
});

Label.displayName = 'Label';
