// @ts-ignore: Deno module
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    
    const data = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      httpUserAgent: body.httpUserAgent,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      httpMethod: req.method,
      headers: Object.fromEntries(req.headers.entries())
    }

    console.log('Received webhook data:', data)

    const webhookUrl = body.webhookUrl
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': data.httpUserAgent || 'Supabase Edge Function'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})
