"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function ToastExample() {
  const {
    success,
    error,
    info,
    warning,
    default: showDefault,
    promise,
  } = useToast();

  const handleSuccess = () => {
    success("Book has been added to your library!", {
      description: "You can now access it from your dashboard.",
    });
  };

  const handleError = () => {
    error("Failed to save changes", {
      description: "Please check your internet connection and try again.",
    });
  };

  const handleInfo = () => {
    info("New feature available", {
      description: "You can now organize your books into custom collections.",
      action: {
        label: "Learn More",
        onClick: () => console.log("Learn more clicked"),
      },
    });
  };

  const handleWarning = () => {
    warning("Storage space running low", {
      description: "You have used 80% of your available storage.",
    });
  };

  const handleDefault = () => {
    showDefault("Simple notification message");
  };

  const handlePromise = () => {
    promise(
      new Promise<{ title: string }>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.5) {
            resolve({ title: "The Great Adventure" });
          } else {
            reject(new Error("Network error"));
          }
        }, 2000);
      }),
      {
        loading: "Uploading book...",
        success: (data) => `"${data.title}" has been uploaded successfully!`,
        error: "Failed to upload book. Please try again.",
      },
    );
  };

  const handleDismissible = () => {
    const _toastId = success("This toast can be dismissed", {
      description: "Click the × button or call the dismiss function.",
    });

    // Auto dismiss after 5 seconds for demo purposes
    setTimeout(() => {
      // This would be called from outside if needed
      // toast.dismiss(toastId);
    }, 5000);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Toast Examples</h3>
        <p className="text-sm text-muted-foreground">
          Click the buttons to see different toast types in action
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button onClick={handleSuccess} variant="default">
          Success Toast
        </Button>

        <Button onClick={handleError} variant="destructive">
          Error Toast
        </Button>

        <Button onClick={handleInfo} variant="secondary">
          Info Toast
        </Button>

        <Button onClick={handleWarning} variant="outline">
          Warning Toast
        </Button>

        <Button onClick={handleDefault} variant="outline">
          Default Toast
        </Button>

        <Button onClick={handlePromise} variant="outline">
          Promise Toast
        </Button>

        <Button
          onClick={handleDismissible}
          variant="ghost"
          className="sm:col-span-2"
        >
          Dismissible Toast
        </Button>
      </div>

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          Toasts are positioned in the upper-right corner and will auto-dismiss
          after a few seconds. They support dark/light themes and include proper
          accessibility features.
        </p>
      </div>
    </Card>
  );
}
