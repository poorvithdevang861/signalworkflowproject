export function PrimaryButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button className="sw-btn" type="submit" disabled={loading}>
      {loading && <span className="sw-btn__spinner" aria-hidden />}
      {loading ? 'Please wait…' : label}
    </button>
  );
}
