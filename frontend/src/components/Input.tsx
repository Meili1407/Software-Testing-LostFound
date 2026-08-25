import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  children?: never;
}

export function Input({ label, id, ...rest }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} {...rest} />
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function TextArea({ label, id, ...rest }: TextAreaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <textarea id={inputId} {...rest} />
    </div>
  );
}

interface SelectProps {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: ReactNode;
}

export function Select({ label, id, value, onChange, required, children }: SelectProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <select id={inputId} value={value} required={required} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}
