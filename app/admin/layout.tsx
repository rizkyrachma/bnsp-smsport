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
    <div className="min-h-screen bg-carbon text-white flex flex-col lg:flex-row font-sans selection:bg-iris selection:text-white">
      <AdminSidebar />
      <div className="flex-grow min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
