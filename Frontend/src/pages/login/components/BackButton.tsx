export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="sw-back" type="button" onClick={onClick}>
      ← Back
    </button>
  );
}
