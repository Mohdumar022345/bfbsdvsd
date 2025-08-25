import AppSidebar from "@/components/AppSidebar";
import LandingPage from "@/components/landingPage/LandingPage";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth";
import { UserProvider } from "@/context/UserContext";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LandingPage />
      </div>
    );
  }

  return (
    <SidebarProvider className="h-screen w-screen">
      <UserProvider initialUser={user}>
        <AppSidebar />
        {children}
      </UserProvider>
    </SidebarProvider>
  );
}
