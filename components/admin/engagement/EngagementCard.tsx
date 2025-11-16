"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  Star,
  StarOff,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Engagement } from "@/types/engagement";

interface EngagementCardProps {
  engagement: Engagement;
  onEdit: (engagement: Engagement) => void;
  onDelete: (id: string) => void;
  onUpdate: (engagement: Engagement) => void;
  className?: string;
}

const typeConfig = {
  webinar: { label: "Webinar", color: "bg-blue-100 text-blue-800" },
  workshop: { label: "Workshop", color: "bg-green-100 text-green-800" },
  training: { label: "Training", color: "bg-purple-100 text-purple-800" },
  coaching: { label: "Coaching", color: "bg-orange-100 text-orange-800" },
  consulting: { label: "Consulting", color: "bg-red-100 text-red-800" },
  speaking: { label: "Speaking", color: "bg-indigo-100 text-indigo-800" },
  course: { label: "Course", color: "bg-pink-100 text-pink-800" },
  event: { label: "Event", color: "bg-yellow-100 text-yellow-800" },
};

const statusConfig = {
  upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-800" },
  ongoing: { label: "Ongoing", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export function EngagementCard({
  engagement,
  onEdit,
  onDelete,
  onUpdate,
  className,
}: EngagementCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);

  const hasImages = engagement.images && engagement.images.length > 0;
  const currentImage = hasImages ? engagement.images[currentImageIndex] : null;

  const typeInfo = typeConfig[engagement.type] || {
    label: engagement.type,
    color: "bg-gray-100 text-gray-800",
  };
  const statusInfo = statusConfig[engagement.status] || {
    label: engagement.status,
    color: "bg-gray-100 text-gray-800",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePreviousImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? engagement.images?.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) =>
        prev === engagement.images?.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const handleToggleFeatured = async () => {
    setIsTogglingFeatured(true);
    try {
      const updatedEngagement = {
        ...engagement,
        is_featured: !engagement.is_featured,
      };

      const response = await fetch(`/api/admin/engagements/${engagement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isFeatured: !engagement.is_featured,
        }),
      });

      if (response.ok) {
        onUpdate(updatedEngagement);
        toast.success(
          engagement.is_featured
            ? "Removed from featured"
            : "Added to featured",
        );
      } else {
        toast.error("Failed to update featured status");
      }
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Failed to update featured status");
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/engagements/${engagement.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(engagement.id);
        toast.success("Engagement deleted successfully");
      } else {
        toast.error("Failed to delete engagement");
      }
    } catch (error) {
      console.error("Error deleting engagement:", error);
      toast.error("Failed to delete engagement");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-shadow ${className}`}>
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {currentImage ? (
          <div className="relative w-full h-full">
            <Image
              src={currentImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Image Navigation */}
            {engagement.images?.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            {engagement.images?.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1}/{engagement.images?.length}
              </div>
            )}

            {/* Featured Badge */}
            {engagement.is_featured && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-yellow-400 text-yellow-900">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Actions Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/80 hover:bg-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(engagement)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggleFeatured}
                disabled={isTogglingFeatured}
              >
                {engagement.is_featured ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from Featured
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to Featured
                  </>
                )}
              </DropdownMenuItem>
              {engagement.booking_url && (
                <DropdownMenuItem asChild>
                  <a
                    href={engagement.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Booking Page
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the engagement "{engagement.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <CardHeader className="pb-3">
        <div className="space-y-2">
          {/* Title and Status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
              {engagement.title}
            </h3>
            <Badge className={statusInfo.color} variant="secondary">
              {statusInfo.label}
            </Badge>
          </div>

          {/* Type and Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeInfo.color} variant="secondary">
              {typeInfo.label}
            </Badge>
            {engagement.is_virtual && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Virtual
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {engagement.description}
        </p>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {engagement.date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(engagement.date)}</span>
            </div>
          )}

          {engagement.duration && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{engagement.duration}</span>
            </div>
          )}

          {engagement.location && !engagement.is_virtual && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{engagement.location}</span>
            </div>
          )}

          {engagement.max_attendees && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Max {engagement.max_attendees} attendees</span>
            </div>
          )}

          {engagement.price !== null && engagement.price !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>
                {engagement.price === 0
                  ? "Free"
                  : `$${engagement.price.toFixed(2)}`}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {engagement.tags && engagement.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {engagement.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {engagement.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{engagement.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(engagement)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {engagement.booking_url && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={engagement.booking_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
