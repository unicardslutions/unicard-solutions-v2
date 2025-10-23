import { Button } from "@/components/ui/button";
import { LogOut, School } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/unicard-logo.png";

export const SchoolHeader = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/school/login");
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="UniCard" className="h-8" />
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">School Dashboard</h1>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};
