import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all settings or specific setting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    const supabase = await createClient();

    if (key) {
      // Fetch specific setting
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("setting_key", key)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Setting not found" },
            { status: 404 },
          );
        }
        return NextResponse.json(
          { error: "Failed to fetch setting" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data,
      });
    } else {
      // Fetch all settings
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("setting_key");

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch settings" },
          { status: 500 },
        );
      }

      // Convert to key-value object for easier usage
      const settingsObject: Record<string, string | number | boolean> = {};
      data?.forEach((setting) => {
        settingsObject[setting.setting_key] = setting.setting_value;
      });

      return NextResponse.json({
        success: true,
        data: settingsObject,
        raw: data, // Include raw data for detailed usage
      });
    }
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT/PATCH - Update setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value } = body;

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { error: "setting_key and setting_value are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .upsert({
        setting_key,
        setting_value,
      })
      .select()
      .single();

    if (error) {
      console.error("Settings update error:", error);
      return NextResponse.json(
        { error: "Failed to update setting" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Setting updated successfully",
      data,
    });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update multiple settings at once
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "settings object is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const updatePromises = [];

    for (const [key, value] of Object.entries(settings)) {
      updatePromises.push(
        supabase.from("site_settings").upsert({
          setting_key: key,
          setting_value: value,
        }),
      );
    }

    const results = await Promise.all(updatePromises);
    const errors = results.filter((result) => result.error);

    if (errors.length > 0) {
      console.error("Batch update errors:", errors);
      return NextResponse.json(
        { error: "Failed to update some settings" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      updatedCount: Object.keys(settings).length,
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
