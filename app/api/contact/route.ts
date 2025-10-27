import { NextRequest, NextResponse } from 'next/server'
import { contactFormSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the form data
    const validatedData = contactFormSchema.parse(body)

    // TODO: Replace with actual Supabase integration when ready
    // For now, just log the data and return success
    console.log('Contact form submission received:', {
      ...validatedData,
      attachments: validatedData.attachments?.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    })

    // TODO: Add email notification here
    // TODO: Add Supabase database insertion here
    // TODO: Add file upload to Supabase Storage here

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully! We\'ll get back to you soon.'
    })
  } catch (error) {
    console.error('Contact form error:', error)

    return NextResponse.json({
      success: false,
      message: 'Failed to submit contact form. Please try again.'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Contact API endpoint is ready'
  })
}