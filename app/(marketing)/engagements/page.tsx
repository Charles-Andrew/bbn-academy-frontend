import {
  ArrowRight,
  Calendar,
  MapPin,
  Building,
  Users,
  Video,
  BookOpen,
  MessageSquare,
  Star,
} from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MotionFadeIn,
  MotionStaggerChildren,
} from "@/components/ui/motion-fade-in";
import { getAllEngagements, getEngagementTypes } from "@/data/engagements";

export default async function EngagementsPage() {
  const engagements = await getAllEngagements();
  const engagementTypes = await getEngagementTypes();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Recent
              <span className="text-primary"> Engagements</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore recent workshops, speaking engagements, and consulting projects
              that have made a meaningful impact across organizations and communities.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {engagementTypes.map((type) => (
                <Badge key={type} variant="secondary" className="capitalize">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Engagements Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Featured Engagements
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Highlights from recent workshops, speaking engagements, and consulting projects
            </p>
          </div>

          {engagements.length > 0 ? (
            <MotionStaggerChildren>
              {/* Featured engagements first */}
              <div className="space-y-8 md:space-y-12">
                {engagements.filter(e => e.featured).map((engagement) => (
                  <Card
                    key={engagement.id}
                    className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-lg"
                  >
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image Section */}
                    <div className="relative h-64 lg:h-full min-h-[400px] bg-gradient-to-br from-primary/10 to-secondary/10">
                      {engagement.images && engagement.images.length > 0 ? (
                        <>
                          <img
                            src={engagement.images[0]}
                            alt={engagement.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                          <div className="text-center text-primary/60">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                              {engagement.type === 'workshop' && <Users className="h-8 w-8 text-primary/80" />}
                              {engagement.type === 'speaking' && <MessageSquare className="h-8 w-8 text-primary/80" />}
                              {engagement.type === 'consultation' && <BookOpen className="h-8 w-8 text-primary/80" />}
                              {!['workshop', 'speaking', 'consultation'].includes(engagement.type) && <Video className="h-8 w-8 text-primary/80" />}
                            </div>
                            <p className="text-sm font-medium text-primary/80">Engagement Image</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-8 lg:p-10 flex flex-col justify-between">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="capitalize text-sm font-medium px-3 py-1">
                              {engagement.type}
                            </Badge>
                            {engagement.featured && (
                              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            {engagement.type === 'workshop' && <Users className="h-6 w-6 text-primary" />}
                            {engagement.type === 'speaking' && <MessageSquare className="h-6 w-6 text-primary" />}
                            {engagement.type === 'consultation' && <BookOpen className="h-6 w-6 text-primary" />}
                            {!['workshop', 'speaking', 'consultation'].includes(engagement.type) && <Video className="h-6 w-6 text-primary" />}
                          </div>
                        </div>

                        {/* Title and Description */}
                        <div className="space-y-4">
                          <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                            {engagement.title}
                          </h3>
                          <p className="text-muted-foreground text-lg leading-relaxed">
                            {engagement.description}
                          </p>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          {engagement.date && (
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                              <span className="text-foreground font-medium">
                                {new Date(engagement.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}

                          {engagement.location && (
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                              <span className="text-foreground font-medium">{engagement.location}</span>
                            </div>
                          )}

                          {engagement.organization && (
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <Building className="h-5 w-5 text-primary flex-shrink-0" />
                              <span className="text-foreground font-medium">{engagement.organization}</span>
                            </div>
                          )}
                        </div>

                        
                      </div>
                    </div>
                  </div>
                </Card>
                ))}
              </div>

              {/* Other engagements in grid */}
              {engagements.filter(e => !e.featured).length > 0 && (
                <div className="mt-12 md:mt-16">
                  <h3 className="text-2xl font-semibold mb-6">More Engagements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {engagements.filter(e => !e.featured).map((engagement) => (
                      <Card
                        key={engagement.id}
                        className="group hover:shadow-lg transition-all duration-300"
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="capitalize">
                                {engagement.type}
                              </Badge>
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                {engagement.type === 'workshop' && <Users className="h-4 w-4 text-primary" />}
                                {engagement.type === 'speaking' && <MessageSquare className="h-4 w-4 text-primary" />}
                                {engagement.type === 'consultation' && <BookOpen className="h-4 w-4 text-primary" />}
                                {!['workshop', 'speaking', 'consultation'].includes(engagement.type) && <Video className="h-4 w-4 text-primary" />}
                              </div>
                            </div>

                            <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                              {engagement.title}
                            </h3>

                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {engagement.description}
                            </p>

                            <div className="space-y-2 text-sm text-muted-foreground">
                              {engagement.date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(engagement.date).toLocaleDateString()}</span>
                                </div>
                              )}

                              {engagement.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{engagement.location}</span>
                                </div>
                              )}

                              {engagement.organization && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-3 w-3" />
                                  <span>{engagement.organization}</span>
                                </div>
                              )}
                            </div>

                            {engagement.images && engagement.images.length > 0 && (
                              <div className="h-32 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg overflow-hidden">
                                <img
                                  src={engagement.images[0]}
                                  alt={engagement.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </MotionStaggerChildren>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                No engagements to showcase at the moment.
              </p>
              <Button asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Engagement Types Overview */}
      {engagementTypes.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <MotionFadeIn className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Engagement Types
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Different formats for sharing knowledge and driving organizational impact
              </p>
            </MotionFadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {engagementTypes.map((type) => {
                const typeEngagements = engagements.filter(e => e.type === type);
                const getIcon = (type: string) => {
                  switch (type.toLowerCase()) {
                    case 'workshop':
                      return <Users className="h-8 w-8 text-primary" />;
                    case 'speaking':
                      return <MessageSquare className="h-8 w-8 text-primary" />;
                    case 'consultation':
                      return <BookOpen className="h-8 w-8 text-primary" />;
                    default:
                      return <Video className="h-8 w-8 text-primary" />;
                  }
                };

                const getDescription = (type: string) => {
                  switch (type.toLowerCase()) {
                    case 'workshop':
                      return "Hands-on training sessions with practical exercises and collaborative learning experiences.";
                    case 'speaking':
                      return "Keynote presentations and talks at conferences, corporate events, and industry gatherings.";
                    case 'consultation':
                      return "Strategic advisory partnerships and organizational development projects.";
                    default:
                      return "Professional engagements designed to drive meaningful impact.";
                  }
                };

                return (
                  <Card key={type} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        {getIcon(type)}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2 capitalize">
                        {type}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {getDescription(type)}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {typeEngagements.length} {typeEngagements.length === 1 ? 'engagement' : 'engagements'} completed
                      </p>
                      <Button variant="outline" asChild>
                        <Link href={`#${encodeURIComponent(type)}`} scroll={false}>
                          View {type.charAt(0).toUpperCase() + type.slice(1)} Engagements
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-t from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <MotionFadeIn className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to Collaborate?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Interested in hosting a workshop, scheduling a speaking engagement,
              or exploring consulting opportunities for your organization?
              Let's discuss how we can create meaningful impact together.
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">
                Start the Conversation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </MotionFadeIn>
        </div>
      </section>
    </MainLayout>
  );
}
