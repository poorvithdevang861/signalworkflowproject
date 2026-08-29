import type { FormEvent, RefObject } from 'react';
import { AuthField } from '../AuthField';
import { PrimaryButton } from '../PrimaryButton';

interface TwoFaSetupStepProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  totpCode: string;
  loading: boolean;
  onTotpChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function TwoFaSetupStep({
  canvasRef,
  totpCode,
  loading,
  onTotpChange,
  onSubmit,
}: TwoFaSetupStepProps) {
  return (
    <form className="sw-form" onSubmit={onSubmit}>
      <div className="sw-qr">
        <canvas ref={canvasRef} />
      </div>
      <AuthField
        id="totp-setup"
        label="Code"
        value={totpCode}
        onChange={value => onTotpChange(value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        autoComplete="one-time-code"
      />
      <PrimaryButton loading={loading} label="Verify" />
    </form>
  );
}
