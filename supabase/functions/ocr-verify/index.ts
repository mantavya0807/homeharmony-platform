// supabase/functions/ocr-verify/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface OCRRequestBody {
  propertyId: string;
  verificationUrl: string;
  fileType: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { propertyId, verificationUrl, fileType } = await req.json() as OCRRequestBody;

    // Validate input
    if (!propertyId || !verificationUrl || !fileType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ocrApiKey = Deno.env.get("OCR_API_KEY");
    if (!ocrApiKey) {
      return new Response(
        JSON.stringify({ error: "OCR API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Decode the URL if it's already encoded
    const decodedUrl = decodeURIComponent(verificationUrl);

    // Construct OCR API URL with additional parameters for better results
    const ocrEndpoint = `https://api.ocr.space/parse/imageurl?apikey=${ocrApiKey}&url=${encodeURIComponent(decodedUrl)}&filetype=${fileType}&language=eng&detectOrientation=true&scale=true&OCREngine=2`;

    console.log("Calling OCR API with endpoint:", ocrEndpoint);

    const ocrResponse = await fetch(ocrEndpoint);
    if (!ocrResponse.ok) {
      throw new Error(`OCR API response not ok: ${ocrResponse.status}`);
    }

    const ocrResult = await ocrResponse.json();
    console.log("OCR Raw Result:", ocrResult);

    if (ocrResult.IsErroredOnProcessing) {
      return new Response(
        JSON.stringify({
          error: ocrResult.ErrorMessage || "OCR processing failed",
          details: ocrResult.ErrorDetails
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if we have any parsed results
    if (!ocrResult.ParsedResults || ocrResult.ParsedResults.length === 0) {
      return new Response(
        JSON.stringify({ error: "No text could be extracted from the image" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const isVerified = ocrResult.OCRExitCode === "1" && 
                      ocrResult.ParsedResults.some(result => result.ParsedText.trim().length > 0);

    // Update property verification status
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        is_verified: isVerified,
        verification_document_url: decodedUrl,
        verified_at: isVerified ? new Date().toISOString() : null,
      })
      .eq("id", propertyId);

    if (updateError) {
      throw new Error(`Failed to update property: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_verified: isVerified,
        parsed_text: ocrResult.ParsedResults[0]?.ParsedText || ""
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error in OCR function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});