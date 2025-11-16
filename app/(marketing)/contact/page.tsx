import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { MainLayout } from "@/components/layout";

export const metadata: Metadata = {
  title: "Contact BBN Academy | Get in Touch",
  description:
    "Have questions about books, writing services, or collaborations? Contact BBN Academy. Available for consultations, workshops, and speaking engagements.",
  openGraph: {
    title: "Contact BBN Academy | Get in Touch",
    description:
      "Have questions about books, writing services, or collaborations? Contact BBN Academy. Available for consultations, workshops, and speaking engagements.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <MainLayout>
      <ContactForm />
    </MainLayout>
  );
}
