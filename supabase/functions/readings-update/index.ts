import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    )

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: "invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { payment_id, period_start, period_end, line_items } = body as {
      payment_id: unknown
      period_start: unknown
      period_end: unknown
      line_items: unknown
    }

    if (!payment_id || typeof payment_id !== "number" || !Number.isInteger(payment_id) || payment_id <= 0) {
      return new Response(JSON.stringify({ error: "payment_id must be a positive integer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!period_start || typeof period_start !== "string" || !dateRegex.test(period_start)) {
      return new Response(JSON.stringify({ error: "period_start must be a valid date (YYYY-MM-DD)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!period_end || typeof period_end !== "string" || !dateRegex.test(period_end) || period_end < period_start) {
      return new Response(JSON.stringify({ error: "period_end must be a valid date on or after period_start" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const items = (Array.isArray(line_items) ? line_items : []) as Record<string, unknown>[]
    for (const item of items) {
      if (!item.tariff_name || typeof item.tariff_name !== "string" || !item.tariff_name.trim()) {
        return new Response(JSON.stringify({ error: "tariff_name is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      if (item.tariff_type !== "service" && item.tariff_type !== "resource") {
        return new Response(JSON.stringify({ error: "tariff_type must be service or resource" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      if (typeof item.quantity !== "number" || item.quantity < 0) {
        return new Response(JSON.stringify({ error: "quantity must be >= 0" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      if (typeof item.unit_price !== "number" || item.unit_price < 0) {
        return new Response(JSON.stringify({ error: "unit_price must be >= 0" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      if (item.tariff_type === "resource" && (!item.unit || typeof item.unit !== "string" || !item.unit.trim())) {
        return new Response(JSON.stringify({ error: "unit is required for resource tariffs" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      if (item.meter_value_current !== undefined && item.meter_value_current !== null) {
        if (typeof item.meter_value_current !== "number" || item.meter_value_current < 0) {
          return new Response(JSON.stringify({ error: "meter_value_current must be >= 0" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          })
        }
      }
    }

    const { data: payment, error: updateError } = await supabase
      .from("utility_payments")
      .update({ period_start, period_end })
      .eq("id", payment_id)
      .select()
      .single()

    if (updateError || !payment) {
      return new Response(JSON.stringify({ error: updateError?.message ?? "internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { error: deleteError } = await supabase
      .from("payment_line_items")
      .delete()
      .eq("payment_id", payment_id)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let lineItemRows: Record<string, unknown>[] = []
    if (items.length > 0) {
      const lineItemData = items.map((item) => ({
        payment_id: payment.id,
        tariff_name: String(item.tariff_name),
        tariff_type: String(item.tariff_type),
        unit: item.unit ? String(item.unit) : null,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        subtotal: Math.round(Number(item.quantity) * Number(item.unit_price) * 100) / 100,
        meter_value_current: (typeof item.meter_value_current === "number" && item.meter_value_current >= 0)
          ? item.meter_value_current
          : null,
      }))

      const { data: insertedItems, error: lineError } = await supabase
        .from("payment_line_items")
        .insert(lineItemData)
        .select()

      if (lineError) {
        return new Response(JSON.stringify({ error: lineError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      lineItemRows = insertedItems ?? []
    }

    return new Response(JSON.stringify({ ...payment, line_items: lineItemRows }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
