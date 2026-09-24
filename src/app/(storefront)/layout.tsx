import ClientLayoutWrapper from '@/components/common/ClientLayoutWrapper';

/** Storefront chrome: intro screen, navbar, footer and the global auth modal. */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16 md:pb-0">
      <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
    </div>
  );
}
