import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const VALID_TYPES = ["service", "resource"]

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  )

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  let body: { apartment_id?: unknown; name?: unknown; type?: unknown; price?: unknown; unit?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const apartment_id = typeof body.apartment_id === "number" && body.apartment_id > 0
    ? body.apartment_id
    : null
  if (!apartment_id) {
    return new Response(
      JSON.stringify({ error: "apartment_id is required" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) {
    return new Response(
      JSON.stringify({ error: "name is required" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const type = typeof body.type === "string" ? body.type : ""
  if (!VALID_TYPES.includes(type)) {
    return new Response(
      JSON.stringify({ error: "type must be service or resource" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const price = typeof body.price === "number" && body.price >= 0 ? body.price : null
  if (price === null) {
    return new Response(
      JSON.stringify({ error: "price must be a non-negative number" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const unit = typeof body.unit === "string" ? body.unit.trim() : null
  if (type === "resource" && !unit) {
    return new Response(
      JSON.stringify({ error: "unit is required for resources" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const { data, error } = await supabase
    .from("tariffs")
    .insert({ apartment_id, name, type, price, unit: type === "resource" ? unit : null })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify(data),
    { status: 201, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  )
})
