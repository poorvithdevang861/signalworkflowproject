import { BackButton } from '../BackButton';
import { OtpInput } from '../OtpInput';
import { PrimaryButton } from '../PrimaryButton';

interface OtpStepProps {
  otp: string;
  loading: boolean;
  countdown: number;
  onOtpChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}

export function OtpStep({
  otp,
  loading,
  countdown,
  onOtpChange,
  onSubmit,
  onResend,
  onBack,
}: OtpStepProps) {
  return (
    <form className="sw-form" onSubmit={onSubmit}>
      <OtpInput value={otp} onChange={onOtpChange} />
      <PrimaryButton loading={loading} label="Verify" />
      <div className="sw-center">
        <button
          className="sw-link"
          type="button"
          onClick={onResend}
          disabled={countdown > 0 || loading}
        >
          {countdown > 0 ? `Resend (${countdown}s)` : 'Resend'}
        </button>
      </div>
      <BackButton onClick={onBack} />
    </form>
  );
}
