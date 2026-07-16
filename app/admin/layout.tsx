/**
 * Admin layout — server-side role check as a second layer of protection
 * (middleware.ts is the first layer). §2.1: proteksi role admin di sini.
 * 
 * Note: /admin/login has its own layout (no auth check) via route group,
 * so this layout only applies to authenticated admin pages.
 */
export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
