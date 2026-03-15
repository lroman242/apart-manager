import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const VALID_STATUSES = ["active", "on_hold"]

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

  let body: { id?: unknown; status?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const id = typeof body.id === "number" ? body.id : null
  if (!id) {
    return new Response(
      JSON.stringify({ error: "id is required" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const status = typeof body.status === "string" ? body.status : ""
  if (!VALID_STATUSES.includes(status)) {
    return new Response(
      JSON.stringify({ error: "status must be active or on_hold" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  const { data, error } = await supabase
    .from("apartments")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return new Response(
        JSON.stringify({ error: "Not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      )
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  if (!data) {
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  )
})
