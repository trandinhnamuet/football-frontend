import AdminSidebar from '../components/AdminSidebar';

// Wraps every /admin route with the quick-jump sidebar. The pages keep their own
// <AdminGuard>, so the sidebar tracks auth on its own and renders nothing until
// the admin is logged in.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-content">{children}</div>
    </div>
  );
}
