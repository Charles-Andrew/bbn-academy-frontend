import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Mail, Phone, Calendar, Star, ArrowRight } from "lucide-react"
import Link from "next/link"

const services = [
  {
    title: "Book Writing Consultation",
    description: "One-on-one guidance to help structure and develop your book idea",
    price: "$150",
    duration: "2 hours",
    features: [
      "Detailed manuscript review",
      "Chapter-by-chapter planning",
      "Writing strategy development",
      "Q&A session",
      "Follow-up email support"
    ],
    popular: true,
    cta: "Book Consultation"
  },
  {
    title: "Manuscript Review",
    description: "Comprehensive review of your completed manuscript with actionable feedback",
    price: "$500",
    duration: "5-7 days",
    features: [
      "Complete manuscript analysis",
      "Structural feedback",
      "Character development notes",
      "Pacing and flow assessment",
      "Written feedback report",
      "30-minute follow-up call"
    ],
    popular: false,
    cta: "Get Review"
  },
  {
    title: "Book Coaching Package",
    description: "Ongoing support throughout your entire writing journey",
    price: "$1,200",
    duration: "3 months",
    features: [
      "Weekly coaching sessions (1 hour each)",
      "Chapter reviews and feedback",
      "Accountability and deadlines",
      "Writing techniques and tips",
      "Publishing guidance",
      "Email support between sessions"
    ],
    popular: false,
    cta: "Start Coaching"
  },
  {
    title: "Author Workshop",
    description: "Group workshops on various aspects of writing and publishing",
    price: "$75",
    duration: "2 hours",
    features: [
      "Interactive workshop sessions",
      "Group discussions",
      "Practical writing exercises",
      "Networking opportunities",
      "Resource materials",
      "Recording of session"
    ],
    popular: false,
    cta: "Join Workshop"
  }
]

const faqs = [
  {
    question: "How do I book a consultation?",
    answer: "You can book a consultation by clicking the 'Book Consultation' button and filling out the contact form. I'll get back to you within 24 hours to schedule a time that works for both of us."
  },
  {
    question: "What format do manuscript reviews take?",
    answer: "Manuscript reviews include a detailed written feedback report covering plot, character development, pacing, and overall structure. You'll also receive a 30-minute follow-up call to discuss the feedback."
  },
  {
    question: "Do you work with first-time authors?",
    answer: "Absolutely! I love working with first-time authors and have extensive experience helping new writers navigate the challenges of completing their first book."
  },
  {
    question: "What genres do you specialize in?",
    answer: "I work with most fiction genres and non-fiction memoirs. If you're unsure whether your project fits my expertise, feel free to reach out for a brief chat."
  },
  {
    question: "How long does the coaching package last?",
    answer: "The coaching package runs for 3 months with weekly 1-hour sessions. This timeframe provides enough time to make significant progress on your manuscript while maintaining momentum."
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer: "I offer a satisfaction guarantee. If you're not completely satisfied with any service, let me know within the first session and I'll provide a full refund."
  }
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Writing Services & <span className="text-primary">Consultations</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Professional guidance to help you bring your story to life. From initial ideas to finished manuscript, I'm here to support your writing journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="#services">View Services</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Writing Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're just starting out or need professional feedback on your manuscript, there's a service that fits your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className={`relative ${service.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                  <CardDescription className="text-base mb-4">
                    {service.description}
                  </CardDescription>
                  <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-6">
                    {service.price}
                    <span className="text-base font-normal text-muted-foreground">
                      {service.title.includes("Package") ? " total" : ""}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 text-left">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link href="#contact">{service.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground mb-16">
            Getting started is simple. Here's how we'll work together.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Reach Out</h3>
              <p className="text-muted-foreground">
                Contact me with your project details and goals. We'll discuss what you're looking to achieve.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Book Your Session</h3>
              <p className="text-muted-foreground">
                Choose the service that fits your needs and schedule a time that works for you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Transform Your Writing</h3>
              <p className="text-muted-foreground">
                Get personalized guidance and feedback to help you become the writer you want to be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Writers Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Real experiences from authors I've worked with.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The consultation completely transformed my approach to writing. I finally have a clear structure and the confidence to finish my novel."
                </p>
                <div>
                  <p className="font-semibold">Sarah M.</p>
                  <p className="text-sm text-muted-foreground">First-time Author</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The manuscript review was incredibly thorough and insightful. The feedback helped me strengthen my story in ways I hadn't considered."
                </p>
                <div>
                  <p className="font-semibold">Michael R.</p>
                  <p className="text-sm text-muted-foreground">Fiction Writer</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The coaching package kept me accountable and motivated. I wrote more in three months than I had in the previous three years!"
                </p>
                <div>
                  <p className="font-semibold">Jennifer L.</p>
                  <p className="text-sm text-muted-foreground">Non-fiction Author</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Got questions? Here are answers to common ones.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Writing Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Let's work together to bring your story to life. Contact me today to get started.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2"
              asChild
            >
              <Link href="/contact">
                <Mail className="w-5 h-5" />
                Send Message
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="mailto:consultations@starbooks.com">
                <Mail className="w-5 h-5" />
                Email Directly
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              consultations@starbooks.com
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              (555) 123-4567
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mon-Fri: 9am-6pm EST
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}