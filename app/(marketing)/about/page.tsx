import { MainLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Award, Mail, Twitter, Linkedin, Github, Calendar, MapPin, Quote } from 'lucide-react'
import Link from 'next/link'

const milestones = [
  {
    year: '2020',
    title: 'Writing Journey Begins',
    description: 'Started writing my first novel, exploring the intersection of technology and human experience.',
  },
  {
    year: '2022',
    title: 'First Publication',
    description: 'Published "The Digital Renaissance," which became a bestseller in the technology writing category.',
  },
  {
    year: '2023',
    title: 'Diverse Portfolio',
    description: 'Expanded into science fiction and philosophical writing, reaching over 5,000 readers worldwide.',
  },
  {
    year: '2024',
    title: 'Community Building',
    description: 'Launched writing workshops and mentoring programs, helping aspiring authors find their voice.',
  },
]

const achievements = [
  {
    icon: BookOpen,
    title: '6+ Books Published',
    description: 'Across multiple genres and formats',
  },
  {
    icon: Users,
    title: '10K+ Readers',
    description: 'Happy readers around the world',
  },
  {
    icon: Award,
    title: 'Literary Awards',
    description: 'Multiple writing and innovation awards',
  },
  {
    icon: Mail,
    title: 'Speaking Engagements',
    description: 'Keynote speaker at tech conferences',
  },
]

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative inline-block mb-8">
              {/* Author Photo Container */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-1">
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {/* Placeholder for author photo - replace with actual image */}
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-primary/30" />
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full opacity-60"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary rounded-full opacity-40"></div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              About the Author
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Exploring the boundaries between technology, philosophy, and human experience through
              storytelling and thought-provoking narratives.
            </p>
          </div>
        </div>
      </section>

      {/* Author Bio */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Sarah Chen</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  I'm a writer, technologist, and philosopher who believes in the power of stories
                  to bridge the gap between human experience and technological advancement. My work explores
                  how emerging technologies are reshaping our understanding of consciousness, creativity,
                  and what it means to be human in the digital age.
                </p>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  With a background in computer science and literature, I bring a unique perspective to
                  contemporary issues. My books have been translated into 12 languages and have won
                  numerous awards for their innovative approach to complex topics.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    San Francisco, CA
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Writing since 2020
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button size="sm" asChild>
                    <Link href="/contact">Get in Touch</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/services">Writing Services</Link>
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <Quote className="h-8 w-8 text-primary" />
                <blockquote className="text-lg italic text-muted-foreground">
                  "Writing is not just about telling stories—it's about exploring the fundamental questions
                  of what it means to be alive in an increasingly complex world. Through fiction and
                  non-fiction, I seek to illuminate the human condition at the intersection of
                  technology and consciousness."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section id="journey" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">My Writing Journey</h2>
              <p className="text-muted-foreground">
                Key milestones and achievements in my literary career
              </p>
            </div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <Badge variant="secondary" className="mb-2">
                      {milestone.year}
                    </Badge>
                    {index < milestones.length - 1 && (
                      <div className="w-px h-16 bg-border"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Achievements & Impact</h2>
            <p className="text-muted-foreground">
              Numbers that represent my journey and the community I've built
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <achievement.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section id="social" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Connect With Me</h2>
            <p className="text-muted-foreground mb-8">
              Join the conversation and stay updated on new releases, events, and writing insights.
            </p>

            <div className="flex justify-center gap-4">
              <Button variant="outline" size="lg" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}