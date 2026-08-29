export function StepIntro({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sw-login__intro">
      {eyebrow && <p className="sw-login__eyebrow">{eyebrow}</p>}
      <h1 className="sw-login__title">{title}</h1>
      {subtitle && <p className="sw-login__subtitle">{subtitle}</p>}
    </header>
  );
}
