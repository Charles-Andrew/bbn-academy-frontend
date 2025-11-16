# Toast System Usage Guide

This guide shows how to use the toast notification system implemented with Sonner and shadcn/ui.

## Setup

The toast system is already configured in your app:

1. **Toaster Component**: Added to `app/layout.tsx`
2. **Position**: Upper-right corner of the screen
3. **Theme**: Automatically adapts to dark/light mode
4. **Auto-dismiss**: Toasts automatically disappear after a few seconds

## Usage Methods

### Method 1: Using the Hook (Recommended)

```tsx
"use client";

import { useToast } from "@/hooks/use-toast";

export function MyComponent() {
  const { success, error, info, warning, default: showDefault } = useToast();

  const handleSave = () => {
    try {
      // Your save logic here
      success("Changes saved successfully!", {
        description: "Your changes have been applied.",
      });
    } catch (err) {
      error("Failed to save changes", {
        description: "Please try again later.",
      });
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Method 2: Direct Import

```tsx
import { toastSuccess, toastError, toastInfo } from "@/hooks/use-toast";

// Usage
toastSuccess("Book added to library");
toastError("Something went wrong");
toastInfo("New feature available");
```

### Method 3: Direct Sonner Import

```tsx
import { toast } from "sonner";

toast("Default message");
toast.success("Success message");
toast.error("Error message");
toast.info("Info message");
toast.warning("Warning message");
```

## Toast Types

### Success Toast
```tsx
success("Operation completed!", {
  description: "Your changes have been saved.",
});
```

### Error Toast
```tsx
error("Failed to upload file", {
  description: "Please check your internet connection.",
});
```

### Info Toast
```tsx
info("New update available", {
  description: "Version 2.0 is ready to install.",
  action: {
    label: "Update Now",
    onClick: () => handleUpdate(),
  },
});
```

### Warning Toast
```tsx
warning("Storage space running low", {
  description: "You have used 80% of your available storage.",
});
```

### Default Toast
```tsx
showDefault("Simple notification message");
```

## Advanced Usage

### Promise Toasts
```tsx
const handleUpload = () => {
  promise(
    uploadFile(file),
    {
      loading: "Uploading file...",
      success: (data) => `File "${data.name}" uploaded successfully!`,
      error: "Failed to upload file. Please try again.",
    }
  );
};
```

### Dismissible Toasts
```tsx
const showToast = () => {
  const toastId = success("This can be dismissed manually", {
    description: "Click the × button to dismiss.",
  });

  // Dismiss programmatically if needed
  // dismiss(toastId);
};
```

### Custom Duration
```tsx
success("This will stay longer", {
  duration: 10000, // 10 seconds
});
```

## Common Use Cases

### Form Submission
```tsx
const handleSubmit = async (formData: FormData) => {
  promise(
    submitForm(formData),
    {
      loading: "Submitting form...",
      success: "Form submitted successfully!",
      error: "Failed to submit form. Please check your inputs.",
    }
  );
};
```

### API Operations
```tsx
const handleDelete = async (id: string) => {
  try {
    await deleteItem(id);
    success("Item deleted successfully");
  } catch (error) {
    error("Failed to delete item", {
      description: error.message,
    });
  }
};
```

### File Operations
```tsx
const handleFileUpload = async (file: File) => {
  info(`Starting upload for "${file.name}"...`);

  try {
    const result = await uploadFile(file);
    success(`"${file.name}" uploaded successfully!`, {
      description: `File size: ${result.size} bytes`,
    });
  } catch (error) {
    error(`Failed to upload "${file.name}"`, {
      description: error.message,
    });
  }
};
```

## Styling and Customization

The toast system uses Tailwind CSS classes and automatically adapts to your theme:

- **Background**: Uses your app's background color
- **Text**: Uses your app's foreground color
- **Border**: Uses your app's border color
- **Shadow**: Subtle shadow for better visibility
- **Animation**: Smooth slide-in/out animations

## Accessibility

- Toasts are announced to screen readers
- Dismissible with keyboard (Escape key)
- Focus management for interactive elements
- Proper ARIA labels and roles

## Testing

You can see the toast system in action by using the `ToastExample` component:

```tsx
import { ToastExample } from "@/components/ui/toast-example";

// Add this to any page to see all toast types
<ToastExample />
```

## Best Practices

1. **Be Specific**: Use descriptive messages that explain what happened
2. **Include Context**: Add descriptions when the message alone isn't enough
3. **Provide Actions**: Include action buttons when users can take next steps
4. **Handle Errors Gracefully**: Always provide helpful error messages
5. **Use Appropriate Types**:
   - `success` for completed operations
   - `error` for failed operations
   - `warning` for potential issues
   - `info` for neutral information
   - `default` for simple notifications

## Troubleshooting

- **Toasts not showing**: Ensure the `Toaster` component is in your layout
- **Wrong position**: Check the `position="top-right"` prop in the Toaster component
- **Theme issues**: Verify your theme provider is properly configured
- **Promise toasts**: Make sure you're returning a proper Promise object