import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";
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

    // TODO: Replace with actual Supabase integration when ready
    // For now, just log the data and return success
    console.log("Contact form submission received:", {
      ...validatedData,
      attachments: validatedData.attachments?.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    });

    // TODO: Add email notification here
    // TODO: Add Supabase database insertion here
    // TODO: Add file upload to Supabase Storage here

    await logger.logSuccess(
      "contact_form_processed",
      {
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
