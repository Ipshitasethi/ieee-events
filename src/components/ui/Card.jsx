import React from 'react';

export function Card({ className = '', children, glow = false, ...props }) {
  const adminStyles = "bg-surface-admin border border-slate-800 rounded-xl";
  const publicStyles = "bg-white border border-slate-200 rounded-xl shadow-sm";
  const glowStyles = glow ? "glow-border glow-top" : "";

  return (
    <div 
      className={`${adminStyles} ${glowStyles} ${className} public-theme:bg-white`} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }) {
  return <h3 className={`text-lg font-semibold font-syne leading-none tracking-tight ${className}`} {...props}>{children}</h3>;
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>;
}
