import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Products Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your digital products, courses, and physical items
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Products Management Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Full CRUD operations for products will be available in the next
              update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
