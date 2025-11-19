"use client";

import { RetroPanel } from './RetroPanel';
import { RetroButton } from './RetroButton';

interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function RetroInput({ label, error, className = '', ...props }: RetroInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {label}
        </label>
      )}
      <RetroPanel variant="inset" className="p-0">
        <input
          className={`w-full px-3 py-2 bg-transparent border-0 outline-none ${className}`}
          style={{ fontFamily: 'Georgia, serif' }}
          {...props}
        />
      </RetroPanel>
      {error && (
        <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface RetroTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function RetroTextarea({ label, error, className = '', ...props }: RetroTextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {label}
        </label>
      )}
      <RetroPanel variant="inset" className="p-0">
        <textarea
          className={`w-full px-3 py-2 bg-transparent border-0 outline-none resize-none ${className}`}
          style={{ fontFamily: 'Georgia, serif' }}
          {...props}
        />
      </RetroPanel>
      {error && (
        <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface RetroSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function RetroSelect({ label, error, options, className = '', ...props }: RetroSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {label}
        </label>
      )}
      <RetroPanel variant="inset" className="p-0">
        <select
          className={`w-full px-3 py-2 bg-transparent border-0 outline-none ${className}`}
          style={{ fontFamily: 'Georgia, serif' }}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </RetroPanel>
      {error && (
        <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface RetroFileUploadProps {
  label?: string;
  error?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  value?: File | null;
  progress?: number;
}

export function RetroFileUpload({ 
  label, 
  error, 
  accept, 
  onChange, 
  value, 
  progress 
}: RetroFileUploadProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {label}
        </label>
      )}
      <RetroPanel variant="inset" className="p-0">
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 bg-transparent border-0 outline-none"
          style={{ fontFamily: 'Georgia, serif' }}
        />
      </RetroPanel>
      {value && (
        <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          Selected: {value.name} ({(value.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
      {progress !== undefined && progress > 0 && progress < 100 && (
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            {progress}%
          </p>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface RetroNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showButtons?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function RetroNumberInput({ 
  label, 
  error, 
  showButtons = true,
  onIncrement,
  onDecrement,
  className = '',
  ...props 
}: RetroNumberInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {label}
        </label>
      )}
      <RetroPanel variant="inset" className="p-0 flex">
        {showButtons && (
          <button
            type="button"
            onClick={onDecrement}
            className="px-3 py-2 border-r hover:bg-gray-100 transition-colors"
            style={{ borderColor: '#d1d5db' }}
          >
            -
          </button>
        )}
        <input
          type="number"
          className={`flex-1 px-3 py-2 bg-transparent border-0 outline-none text-center ${className}`}
          style={{ fontFamily: 'Georgia, serif' }}
          {...props}
        />
        {showButtons && (
          <button
            type="button"
            onClick={onIncrement}
            className="px-3 py-2 border-l hover:bg-gray-100 transition-colors"
            style={{ borderColor: '#d1d5db' }}
          >
            +
          </button>
        )}
      </RetroPanel>
      {error && (
        <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface RetroToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function RetroToggle({ label, checked, onChange, disabled }: RetroToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          w-12 h-6 rounded-full transition-colors relative
          ${checked ? 'bg-blue-500' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
            ${checked ? 'translate-x-7' : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <label 
          className="text-sm text-gray-700"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {label}
        </label>
      )}
    </div>
  );
}

