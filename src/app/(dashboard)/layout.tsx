import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <input type="checkbox" id="mobile-menu" className="peer hidden" />
      <div className="flex h-screen bg-slate-50 relative overflow-hidden">
        {/* Sidebar Overlay for Mobile */}
        <label 
          htmlFor="mobile-menu" 
          className="fixed inset-0 bg-slate-900/50 z-40 hidden peer-checked:block lg:peer-checked:hidden lg:hidden" 
        />

        {/* Sidebar Container */}
        <div className="fixed inset-y-0 left-0 z-50 transform -translate-x-full peer-checked:translate-x-0 lg:static lg:translate-x-0 transition-transform duration-200 ease-in-out flex">
          <Sidebar userRole={session.user.role as Role} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header userName={session.user.name} userRole={session.user.role as Role} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
