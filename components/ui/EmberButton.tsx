import React from "react";

interface EmberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  rounded?: "xl" | "full" | "2xl";
}

export function EmberButton({
  children,
  className = "",
  size = "md",
  rounded = "xl",
  ...props
}: EmberButtonProps) {
  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs",
    md: "py-2.5 px-4 text-[11px] sm:text-xs",
    lg: "py-3 px-6 text-sm",
  };

  const roundedClasses = {
    xl: "rounded-xl",
    full: "rounded-full",
    "2xl": "rounded-2xl",
  };

  return (
    <button
      type={props.type || "button"}
      {...props}
      className={`font-bold bg-ember/10 hover:bg-ember/20 text-ember-dark border border-ember/20 transition cursor-pointer ${sizeClasses[size]} ${roundedClasses[rounded]} ${className}`}
    >
      {children}
    </button>
  );
}

export { EmberButton as WarningButton };
