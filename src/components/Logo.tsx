export function Logo({ className = 'h-8' }: { className?: string }) {
  return (
    <>
      <img src="/logo.png" alt="שדר" className={`${className} dark:hidden`} />
      <img src="/logo-sheder-white.png" alt="שדר" className={`${className} hidden dark:block`} />
    </>
  );
}
