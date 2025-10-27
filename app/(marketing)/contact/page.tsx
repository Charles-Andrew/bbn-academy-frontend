"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/ui/file-upload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { contactFormSchema, type ContactFormData } from '@/lib/validations'
import { CONTACT_PURPOSES } from '@/types/contact'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [attachments, setAttachments] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
    reset,
    watch
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      purpose: CONTACT_PURPOSES[0],
      message: '',
      attachments: []
    }
  })

  const selectedPurpose = watch('purpose')

  const handleFilesChange = (files: File[]) => {
    setAttachments(files)
    setValue('attachments', files)
    if (files.length > 0) {
      clearErrors('attachments')
    }
  }

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // For now, we'll just log the data since we're not connecting to backend yet
      console.log('Contact form submission:', {
        ...data,
        attachments: data.attachments?.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })) || []
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSubmitStatus('success')
      reset()
      setAttachments([])
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Have a question about my books, writing services, or want to collaborate?
            I'd love to hear from you!
          </p>
        </div>
      </section>

      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email
                </CardTitle>
                <CardDescription>
                  Send me a message anytime
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">hello@starbooks.com</p>
                <p className="text-sm text-muted-foreground">consultations@starbooks.com</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Phone
                </CardTitle>
                <CardDescription>
                  Available for consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">(555) 123-4567</p>
                <p className="text-sm text-muted-foreground">Mon-Fri: 9am-6pm EST</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </CardTitle>
                <CardDescription>
                  Based in San Francisco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">San Francisco, CA</p>
                <p className="text-sm text-muted-foreground">Available for virtual meetings worldwide</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Response Time
                </CardTitle>
                <CardDescription>
                  When you can expect to hear back
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>General Inquiries:</span>
                    <span className="text-muted-foreground">24-48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Bookings:</span>
                    <span className="text-muted-foreground">48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collaboration:</span>
                    <span className="text-muted-foreground">3-5 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send Me a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and I'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Message sent successfully!</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Thank you for reaching out. I'll get back to you within 24-48 hours.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Something went wrong</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Please try again or email me directly at hello@starbooks.com
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        {...register('fullName')}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register('email')}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Select
                      value={selectedPurpose}
                      onValueChange={(value) => setValue('purpose', value as any)}
                    >
                      <SelectTrigger className={errors.purpose ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_PURPOSES.map((purpose) => (
                          <SelectItem key={purpose} value={purpose}>
                            {purpose}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purpose && (
                      <p className="text-sm text-destructive">{errors.purpose.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder="Tell me about your project, questions, or ideas..."
                      {...register('message')}
                      className={errors.message ? 'border-destructive' : ''}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Attachments (Optional)</Label>
                    <FileUpload
                      value={attachments}
                      onFilesChange={handleFilesChange}
                      maxFiles={5}
                      maxSize={5 * 1024 * 1024} // 5MB per file
                    />
                    {errors.attachments && (
                      <p className="text-sm text-destructive">{errors.attachments.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Connected
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get updates on new books, writing tips, and special offers.
          </p>

          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault()
                // Handle newsletter signup
                console.log('Newsletter signup - frontend only for now')
              }}>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  required
                />
                <Button type="submit" className="w-full">
                  Subscribe to Newsletter
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-4">
                Join 1,000+ readers and writers. Unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}