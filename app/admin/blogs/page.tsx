import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function BlogsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Blog Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your blog posts and content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Blog Management Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Full CRUD operations for blog posts will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}