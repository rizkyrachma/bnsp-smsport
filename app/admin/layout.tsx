import AdminSidebar from "./_components/AdminSidebar";

/**
 * Admin layout — wraps authenticated admin pages with the AdminSidebar & Dark Theme container.
 * Note: AdminSidebar automatically hides itself when rendered on /admin/login.
 */
export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-mist text-carbon flex flex-col lg:flex-row font-sans selection:bg-lavender selection:text-white">
      <AdminSidebar />
      <div className="flex-grow min-w-0 flex flex-col overflow-x-hidden">{children}</div>
    </div>
  );
}
