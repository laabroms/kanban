'use client';

import { useState, useRef, useEffect } from 'react';

interface LoginPageProps {
  onSuccess: () => void;
  needsSetup?: boolean;
}

export function LoginPage({ onSuccess, needsSetup }: LoginPageProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInput = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newCode.every(d => d)) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (passcode: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: passcode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid passcode');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        onSuccess();
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            {needsSetup ? 'Create Admin Passcode' : 'Enter Passcode'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {needsSetup 
              ? 'Set up a 6-digit admin passcode to secure your board'
              : 'Enter your 6-digit passcode to continue'
            }
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={loading}
              autoComplete="off"
              className={`
                w-12 h-14 text-center text-2xl font-mono
                bg-zinc-900 border-2 rounded-lg
                text-zinc-100 
                focus:outline-none focus:border-blue-500
                disabled:opacity-50
                ${error ? 'border-red-500' : 'border-zinc-700'}
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {loading && (
          <p className="text-zinc-500 text-sm text-center">Verifying...</p>
        )}

        {needsSetup && (
          <p className="text-yellow-500/80 text-xs text-center mt-6">
            ⚠️ This passcode will have admin access. Remember it!
          </p>
        )}
      </div>
    </div>
  );
}
