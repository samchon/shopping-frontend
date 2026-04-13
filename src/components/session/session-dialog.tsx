"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  useActivateCitizen,
  useJoinMember,
  useLoginMember,
} from "@/lib/shopping/hooks";
import type { SessionView } from "@/lib/shopping/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const citizenSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  mobile: z
    .string()
    .min(8, "Enter a valid mobile number.")
    .regex(/^[0-9]+$/, "Numbers only."),
});

const joinSchema = z.object({
  nickname: z.string().min(2, "Nickname is too short."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Use at least 6 characters."),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

function FormMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function SessionDialog({
  session,
  trigger,
}: {
  session: SessionView;
  trigger: React.ReactNode;
}) {
  const activateCitizen = useActivateCitizen();
  const joinMember = useJoinMember();
  const loginMember = useLoginMember();

  const citizenForm = useForm<z.infer<typeof citizenSchema>>({
    resolver: zodResolver(citizenSchema),
    defaultValues: {
      name: session.citizen?.name ?? "",
      mobile: session.citizen?.mobile ?? "",
    },
  });

  const joinForm = useForm<z.infer<typeof joinSchema>>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      nickname: session.member?.nickname ?? "",
      email: session.member?.email ?? "",
      password: "",
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: session.member?.email ?? "",
      password: "",
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Session</DialogTitle>
          <DialogDescription>
            The shopping SDK is connection-based, so this storefront creates a customer
            session automatically and lets you upgrade it with identity or membership.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 rounded-3xl border border-border/70 bg-muted/40 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Channel</p>
              <p className="text-base font-semibold">{session.channel.name}</p>
            </div>
            <div className="rounded-full bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
              {session.channel.code}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-card px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">Membership</p>
              <p className="mt-1 text-sm font-semibold">
                {session.member ? session.member.nickname : "Guest checkout"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.member?.email ?? "No member email linked yet."}
              </p>
            </div>
            <div className="rounded-2xl bg-card px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">Citizen status</p>
              <p className="mt-1 text-sm font-semibold">
                {session.citizen ? session.citizen.name : "Verification needed for payment"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.citizen?.mobile ?? "Activate real-name verification before publish."}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="citizen" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="citizen">Verify Identity</TabsTrigger>
            <TabsTrigger value="join">Join</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>

          <TabsContent value="citizen">
            <form
              className="grid gap-4"
              onSubmit={citizenForm.handleSubmit(async (values) => {
                try {
                  await activateCitizen.mutateAsync(values);
                  toast.success("Identity verified.");
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Identity verification failed.",
                  );
                }
              })}
            >
              <div className="grid gap-2">
                <Label htmlFor="citizen-name">Name</Label>
                <Input id="citizen-name" {...citizenForm.register("name")} />
                <FormMessage message={citizenForm.formState.errors.name?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="citizen-mobile">Mobile</Label>
                <Input id="citizen-mobile" {...citizenForm.register("mobile")} />
                <FormMessage message={citizenForm.formState.errors.mobile?.message} />
              </div>
              <Button type="submit" disabled={activateCitizen.isPending}>
                {activateCitizen.isPending ? "Verifying..." : "Save identity"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <form
              className="grid gap-4"
              onSubmit={joinForm.handleSubmit(async (values) => {
                try {
                  await joinMember.mutateAsync({
                    ...values,
                    citizen: session.citizen,
                  });
                  toast.success("Membership created.");
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Membership signup failed.",
                  );
                }
              })}
            >
              <div className="grid gap-2">
                <Label htmlFor="join-nickname">Nickname</Label>
                <Input id="join-nickname" {...joinForm.register("nickname")} />
                <FormMessage message={joinForm.formState.errors.nickname?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-email">Email</Label>
                <Input id="join-email" {...joinForm.register("email")} />
                <FormMessage message={joinForm.formState.errors.email?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-password">Password</Label>
                <Input
                  id="join-password"
                  type="password"
                  {...joinForm.register("password")}
                />
                <FormMessage message={joinForm.formState.errors.password?.message} />
              </div>
              <Button type="submit" disabled={joinMember.isPending}>
                {joinMember.isPending ? "Creating..." : "Create member account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="login">
            <form
              className="grid gap-4"
              onSubmit={loginForm.handleSubmit(async (values) => {
                try {
                  await loginMember.mutateAsync(values);
                  toast.success("Logged in.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Login failed.");
                }
              })}
            >
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" {...loginForm.register("email")} />
                <FormMessage message={loginForm.formState.errors.email?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  {...loginForm.register("password")}
                />
                <FormMessage message={loginForm.formState.errors.password?.message} />
              </div>
              <Button type="submit" disabled={loginMember.isPending}>
                {loginMember.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
