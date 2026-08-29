import { BackButton } from '../BackButton';
import { OtpInput } from '../OtpInput';
import { PrimaryButton } from '../PrimaryButton';

interface TwoFaVerifyStepProps {
  totpCode: string;
  loading: boolean;
  onTotpChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBack: () => void;
}

export function TwoFaVerifyStep({
  totpCode,
  loading,
  onTotpChange,
  onSubmit,
  onBack,
}: TwoFaVerifyStepProps) {
  return (
    <form className="sw-form" onSubmit={onSubmit}>
      <OtpInput value={totpCode} onChange={onTotpChange} />
      <PrimaryButton loading={loading} label="Verify" />
      <BackButton onClick={onBack} />
    </form>
  );
}
