import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Supabase admin client with service role key for elevated operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl ||
  !supabaseServiceKey ||
  supabaseServiceKey === "your_supabase_service_role_key"
) {
  throw new Error(
    "Supabase admin client is missing valid SUPABASE_SERVICE_ROLE_KEY. Please set the actual service role key in your environment variables.",
  );
}

export const supabaseAdmin = createSupabaseClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export interface ContactMessageData {
  full_name: string;
  email: string;
  purpose: string;
  message: string;
}

export interface AttachmentData {
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
}

/**
 * Insert a new contact message into the database
 */
export async function insertContactMessage(
  data: ContactMessageData,
): Promise<{ id: string; error?: string }> {
  try {
    const { data: result, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        full_name: data.full_name,
        email: data.email,
        purpose: data.purpose,
        message: data.message,
        status: "unread",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting contact message:", error);
      return { id: "", error: error.message };
    }

    return { id: result.id };
  } catch (error) {
    console.error("Unexpected error inserting contact message:", error);
    return {
      id: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFileToSupabase(
  file: File,
  messageId: string,
): Promise<{ path: string; error?: string }> {
  try {
    // Create a unique file name to avoid conflicts
    const _fileExt = file.name.split(".").pop();
    const fileName = `${messageId}/${Date.now()}-${file.name}`;
    const filePath = `contact-attachments/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("contact-attachments")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading file to Supabase:", error);
      return { path: "", error: error.message };
    }

    return { path: data.path };
  } catch (error) {
    console.error("Unexpected error uploading file:", error);
    return {
      path: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Insert attachment metadata into the database
 */
export async function insertAttachmentMetadata(
  data: AttachmentData,
): Promise<{ id: string; error?: string }> {
  try {
    const { data: result, error } = await supabaseAdmin
      .from("contact_attachments")
      .insert({
        message_id: data.message_id,
        file_name: data.file_name,
        file_path: data.file_path,
        file_size: data.file_size,
        file_type: data.file_type,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting attachment metadata:", error);
      return { id: "", error: error.message };
    }

    return { id: result.id };
  } catch (error) {
    console.error("Unexpected error inserting attachment metadata:", error);
    return {
      id: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process complete contact form submission with file attachments
 */
export async function processContactSubmission(
  formData: ContactMessageData,
  files: File[] = [],
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // First, insert the contact message
    const messageResult = await insertContactMessage(formData);

    if (messageResult.error || !messageResult.id) {
      return { success: false, error: messageResult.error };
    }

    const messageId = messageResult.id;

    // Process file attachments if any
    if (files.length > 0) {
      for (const file of files) {
        // Upload file to Supabase Storage
        const uploadResult = await uploadFileToSupabase(file, messageId);

        if (uploadResult.error) {
          console.error(
            `Failed to upload file ${file.name}:`,
            uploadResult.error,
          );
          // Continue with other files even if one fails
          continue;
        }

        // Insert attachment metadata
        const attachmentResult = await insertAttachmentMetadata({
          message_id: messageId,
          file_name: file.name,
          file_path: uploadResult.path,
          file_size: file.size,
          file_type: file.type,
        });

        if (attachmentResult.error) {
          console.error(
            `Failed to save metadata for ${file.name}:`,
            attachmentResult.error,
          );
          // Continue with other files even if metadata fails
        }
      }
    }

    return { success: true, messageId };
  } catch (error) {
    console.error("Unexpected error processing contact submission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
