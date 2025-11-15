"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { contactFormSchema } from "@/lib/validations";
import type { ContactFormData, ContactFormResponse } from "@/types/contact";

export function useContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ContactFormResponse | null>(null);
  const [progress, setProgress] = useState(0);

  const submitForm = async (data: ContactFormData, files?: File[]) => {
    setIsLoading(true);
    setResponse(null);
    setProgress(0);

    try {
      const supabase = createClient();

      // Step 1: Validate form data
      const validatedData = contactFormSchema.parse(data);
      setProgress(25);

      // Step 2: Insert contact message
      const { data: messageData, error: messageError } = await supabase
        .from("contact_messages")
        .insert({
          full_name: validatedData.fullName,
          email: validatedData.email,
          purpose: validatedData.purpose,
          message: validatedData.message,
          status: "unread",
        })
        .select()
        .single();

      if (messageError) {
        throw new Error("Failed to save message");
      }

      setProgress(50);

      // Step 3: Upload files if provided
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file, index) => {
          const filePath = `contact-attachments/${messageData.id}/${Date.now()}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from("contact-attachments")
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(`Failed to upload file: ${file.name}`);
          }

          // Save file record to database
          const { error: recordError } = await supabase
            .from("contact_attachments")
            .insert({
              message_id: messageData.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
            });

          if (recordError) {
            throw new Error(`Failed to save file record: ${file.name}`);
          }

          setProgress(50 + ((index + 1) / files.length) * 40);
        });

        await Promise.all(uploadPromises);
      }

      setProgress(100);

      const successResponse: ContactFormResponse = {
        success: true,
        message: "Your message has been sent successfully!",
        data: messageData,
      };

      setResponse(successResponse);
    } catch (error) {
      const errorResponse: ContactFormResponse = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
      setResponse(errorResponse);
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const reset = () => {
    setResponse(null);
    setProgress(0);
  };

  return {
    submitForm,
    isLoading,
    response,
    progress,
    reset,
  };
}
