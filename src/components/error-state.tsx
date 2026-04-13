"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="grid place-items-center gap-4 p-10 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="grid gap-2">
          <p className="text-lg font-semibold">{title}</p>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        {onRetry ? (
          <Button onClick={onRetry} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
