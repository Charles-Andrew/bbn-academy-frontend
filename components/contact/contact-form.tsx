"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type ContactFormData, contactFormSchema } from "@/lib/validations";
import type { ContactPurpose } from "@/types/contact";
import { CONTACT_PURPOSES } from "@/types/contact";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [attachments, setAttachments] = useState<File[]>([]);
  const { success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      purpose: CONTACT_PURPOSES[0],
      message: "",
      attachments: [],
    },
  });

  const selectedPurpose = watch("purpose");

  const handleFilesChange = (files: File[]) => {
    setAttachments(files);
    setValue("attachments", files);
    if (files.length > 0) {
      clearErrors("attachments");
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Submit the form data to the API
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit contact form");
      }

      // Show success toast
      success("Message sent successfully!", {
        description:
          "Thank you for reaching out. I'll get back to you within 24-48 hours.",
      });

      // Reset form
      reset();
      setAttachments([]);
      setSubmitStatus("success");
    } catch (err) {
      console.error("Contact form error:", err);
      setSubmitStatus("error");

      // Show error toast
      error("Failed to send message", {
        description:
          err instanceof Error
            ? err.message
            : "Please try again or email us directly at hello@bbnacademy.com",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Have a question about my books, writing services, or want to
            collaborate? I'd love to hear from you!
          </p>
        </div>
      </section>

      <div className="py-16 px-4 bg-gradient-to-b from-background to-secondary/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email
                </CardTitle>
                <CardDescription>Send me a message anytime</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">hello@bbnacademy.com</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Phone
                </CardTitle>
                <CardDescription>Available for consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">(555) 123-4567</p>
                <p className="text-sm text-muted-foreground">
                  Mon-Fri: 9am-6pm EST
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </CardTitle>
                <CardDescription>Visit our academy</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Alim St. Kidapawan City, North Cotabato, Philippines
                </p>
                <p className="text-sm text-muted-foreground">
                  Available for virtual meetings worldwide
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send Me a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and I'll get back to you as soon as
                  possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        {...register("fullName")}
                        className={errors.fullName ? "border-destructive" : ""}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register("email")}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Select
                      value={selectedPurpose}
                      onValueChange={(value) =>
                        setValue("purpose", value as ContactPurpose)
                      }
                    >
                      <SelectTrigger
                        className={errors.purpose ? "border-destructive" : ""}
                      >
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
                      <p className="text-sm text-destructive">
                        {errors.purpose.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder="Tell me about your project, questions, or ideas..."
                      {...register("message")}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">
                        {errors.message.message}
                      </p>
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
                      <p className="text-sm text-destructive">
                        {errors.attachments.message}
                      </p>
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
      <section className="py-20 px-4 bg-gradient-to-t from-primary/10 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Connected
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get updates on new books, writing tips, and special offers.
          </p>

          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Handle newsletter signup
                  console.log("Newsletter signup - frontend only for now");
                }}
              >
                <Input type="email" placeholder="Enter your email" required />
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
    </>
  );
}
