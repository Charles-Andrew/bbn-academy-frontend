import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";
import { processContactSubmission } from "@/lib/supabase/admin";
import { contactFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json();

    // Validate the form data
    const validatedData = contactFormSchema.parse(body);

    // Log contact form submission
    await logger.logContactFormSubmission(
      {
        fullName: validatedData.fullName,
        email: validatedData.email,
        purpose: validatedData.purpose,
        message: validatedData.message,
      },
      request,
    );

    // Log file attachments if any
    if (validatedData.attachments && validatedData.attachments.length > 0) {
      for (const file of validatedData.attachments) {
        await logger.logFileUpload(
          file.name,
          file.size,
          file.type,
          "contact_attachment",
          { id: "anonymous", email: validatedData.email },
          request,
        );
      }
    }

    // Process contact form submission with Supabase integration
    const submissionResult = await processContactSubmission(
      {
        full_name: validatedData.fullName,
        email: validatedData.email,
        purpose: validatedData.purpose,
        message: validatedData.message,
      },
      validatedData.attachments || [],
    );

    if (!submissionResult.success) {
      throw new Error(
        `Failed to save contact submission: ${submissionResult.error}`,
      );
    }

    console.log("Contact form submission saved successfully:", {
      messageId: submissionResult.messageId,
      email: validatedData.email,
      purpose: validatedData.purpose,
      hasAttachments: (validatedData.attachments?.length || 0) > 0,
      attachmentCount: validatedData.attachments?.length || 0,
    });

    await logger.logSuccess(
      "contact_form_processed",
      {
        message_id: submissionResult.messageId,
        email: validatedData.email,
        purpose: validatedData.purpose,
        has_attachments:
          validatedData.attachments && validatedData.attachments.length > 0,
        attachment_count: validatedData.attachments?.length || 0,
        info: `Contact form submitted by ${validatedData.fullName} for ${validatedData.purpose}`,
      },
      { id: "anonymous", email: validatedData.email },
      request,
    );

    return NextResponse.json({
      success: true,
      message:
        "Contact form submitted successfully! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    await logger.logError(
      "contact_form_failed",
      error instanceof Error ? error : "Unknown error",
      {
        request_body: body,
        error_details: error instanceof Error ? error.stack : undefined,
      },
      undefined,
      request,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit contact form. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Contact API endpoint is ready",
  });
}
