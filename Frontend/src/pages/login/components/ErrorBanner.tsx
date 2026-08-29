export function ErrorBanner({ message }: { message: string }) {
  return <div className="sw-error" role="alert">{message}</div>;
}
