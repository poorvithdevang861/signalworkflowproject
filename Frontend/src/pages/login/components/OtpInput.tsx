export function OtpInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}) {
  return (
    <input
      id="otp-input"
      className={`sw-otp${error ? ' sw-otp--error' : ''}`}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      placeholder="••••••"
      onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
      autoFocus
    />
  );
}
