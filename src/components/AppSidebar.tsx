"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOut, MessageSquare, PenSquareIcon, User } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";
import { UserProfileDialog } from "./userProfile/UserProfileDialog";
import { FeedbackDialog } from "./dialogs/FeedbackDialog";
import { ConfirmLogoutDialog } from "./dialogs/ConfirmLogoutDialog";
import { useFeedback } from "@/lib/use-feedback";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

const MenuOptions = [{ title: "New Chat", icon: PenSquareIcon, path: "/" }];

export default function AppSidebar() {
  const { user, isUpdatingUserProfile, updateUser } = useUser();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showLogoutConfirmDialog, setShowLogoutConfirmDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const { handleFeedbackSubmit } = useFeedback();

  // Function to handle logout confirmation
  const handleLogoutConfirmation = () => {
    setShowLogoutConfirmDialog(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/");
    setIsLoggingOut(false);
  };

  // Function to perform the actual logout
  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogout(); // Call the original logout function from useAuth
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirmDialog(false); // Close dialog after logout attempt
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="flex flex-row items-center justify-center p-4 select-none">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
            Reseach-o-Bot
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarContent>
              <SidebarMenu>
                {MenuOptions.map((option) => (
                  <SidebarMenuItem key={option.title}>
                    <SidebarMenuButton asChild className="py-5 px-2">
                      <Link href={option.path}>
                        <div className="flex text-base font-semibold items-center gap-2">
                          <option.icon className="size-5" />
                          {option.title}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex flex-row items-center gap-2 h-12 px-2"
              >
                <div className="flex items-center justify-center">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={user.avatarUrl || ""}
                      alt={user.name || user?.email}
                    />
                    <AvatarFallback className="text-lg">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                        {user.name ? (
                          user.name.charAt(0).toUpperCase()
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col w-full items-start justify-start">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card/70 backdrop-blur-sm px-3"
            >
              <DropdownMenuItem
                onClick={() => setShowUserProfile(true)}
                className="focus:bg-accent/30"
              >
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowFeedbackDialog(true)}
                className="focus:bg-accent/30"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogoutConfirmation}
                className="focus:bg-accent/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <UserProfileDialog
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
        user={user}
        updateUser={updateUser}
        isUpdatingUserProfile={isUpdatingUserProfile}
      />

      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        onSubmit={handleFeedbackSubmit}
      />

      {/*<ConfirmDeleteDialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
          onConfirm={() => deleteMessagesMutation.mutate(messagesToDelete)}
          isLoading={deleteMessagesMutation.isPending}
          messageCount={messagesToDelete.length}
        />*/}

      <ConfirmLogoutDialog
        open={showLogoutConfirmDialog}
        onOpenChange={setShowLogoutConfirmDialog}
        onConfirm={performLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
