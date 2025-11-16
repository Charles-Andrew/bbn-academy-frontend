import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
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
import { getEngagementTypes, getUpcomingEngagements } from "@/data/engagements";

export default function EngagementsPage() {
  const upcomingEngagements = getUpcomingEngagements();
  const engagementTypes = getEngagementTypes();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Speaking &amp;
              <span className="text-primary"> Engagements</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join me for workshops, keynote speeches, and consulting sessions
              designed to inspire growth and drive meaningful change.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {engagementTypes.map((type) => (
                <Badge key={type} variant="secondary" className="capitalize">
                  {type}s
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't miss these opportunities to learn and connect
            </p>
          </div>

          {upcomingEngagements.length > 0 ? (
            <MotionStaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {upcomingEngagements.map((engagement) => (
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
                        {engagement.is_virtual ? (
                          <Badge variant="secondary">
                            <Video className="h-3 w-3 mr-1" />
                            Virtual
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            In-Person
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                        {engagement.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {engagement.description}
                      </p>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {engagement.date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(engagement.date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {engagement.duration}
                        </div>
                        {engagement.location && !engagement.is_virtual && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {engagement.location}
                          </div>
                        )}
                        {engagement.max_attendees && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Limited to {engagement.max_attendees} attendees
                          </div>
                        )}
                      </div>

                      {engagement.price && (
                        <div className="text-lg font-semibold text-primary">
                          ${engagement.price}
                        </div>
                      )}

                      <div className="pt-4">
                        {engagement.booking_url ? (
                          <Button size="sm" asChild className="w-full">
                            <Link href={engagement.booking_url} target="_blank">
                              Register Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full"
                          >
                            <Link href="/contact">
                              Inquire About This Event
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </MotionStaggerChildren>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                No upcoming events scheduled at the moment.
              </p>
              <Button asChild>
                <Link href="/contact">Request a Custom Engagement</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Services Types Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <MotionFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Engagement Types
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the format that best fits your needs and audience
            </p>
          </MotionFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Workshops
                </h3>
                <p className="text-muted-foreground mb-4">
                  Hands-on learning experiences with practical exercises and
                  real-world applications.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/engagements?type=workshop">View Workshops</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Speaking
                </h3>
                <p className="text-muted-foreground mb-4">
                  Inspiring keynote presentations and talks for conferences,
                  corporate events, and meetings.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/engagements?type=speaking">
                    View Speaking Events
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Consultation
                </h3>
                <p className="text-muted-foreground mb-4">
                  One-on-one strategic sessions to address specific challenges
                  and opportunities.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/engagements?type=consultation">
                    Book Consultation
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-t from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <MotionFadeIn className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Custom Engagement?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Looking for something specific? I'd be happy to discuss custom
              workshops, training programs, or speaking engagements tailored to
              your organization's needs.
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">
                Get in Touch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </MotionFadeIn>
        </div>
      </section>
    </MainLayout>
  );
}
