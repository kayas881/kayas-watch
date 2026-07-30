import LoginForm from "./LoginForm";
import { Activity } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-background)]">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />

      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl mb-6 glow-primary">
          <Activity className="w-6 h-6 text-violet-500" />
        </div>
        
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome Back</h1>
        <p className="text-zinc-400 text-sm mb-8">Sign in to Kayas Watch dashboard</p>

        <div className="w-full glass p-8 rounded-2xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
