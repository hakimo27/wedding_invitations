import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FloatingPetals } from "@/components/FloatingPetals";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          if (data.token) {
            localStorage.setItem("wedding_admin_token", data.token);
            setLocation("/admin");
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ошибка входа",
            description: "Неверный пароль",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <FloatingPetals />
      <Card className="w-full max-w-md relative z-10 glass-card animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-primary font-serif">Панель управления</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/50 border-accent/50 focus-visible:ring-accent"
                data-testid="input-admin-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white"
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
