import { AppNavbar } from '@/components/AppNavbar';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Navigation */}

      <AppNavbar />

      {/* Content */}

      <main className="relative mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">

        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">

          {children}

        </div>

      </main>
    </>
  );
}
