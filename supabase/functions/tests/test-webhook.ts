import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testWebhook() {
  const { data, error } = await supabase.functions.invoke('webhook-handler', {
    body: { 
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      webhookUrl: 'https://webhook.site/your-test-url',
      httpUserAgent: 'Test Script'
    }
  })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Response:', data)
}

testWebhook() 