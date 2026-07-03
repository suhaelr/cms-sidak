import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const { action, type, records } = await req.json()

    if (action === 'clear') {
      const { error } = await supabase.from('regions').delete().not('id', 'is', null)
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'import') {
      const parentTypeMap: Record<string, string> = {
        city: 'province',
        district: 'city',
        village: 'district',
      }

      let parentMap: Record<number, string> = {}

      if (type !== 'province') {
        const parentType = parentTypeMap[type]
        // Fetch all parents in batches to handle >1000 records
        let allParents: any[] = []
        let from = 0
        const batchSize = 1000
        while (true) {
          const { data, error } = await supabase
            .from('regions')
            .select('id, legacy_id')
            .eq('type', parentType)
            .not('legacy_id', 'is', null)
            .range(from, from + batchSize - 1)
          if (error) throw error
          if (!data || data.length === 0) break
          allParents = allParents.concat(data)
          if (data.length < batchSize) break
          from += batchSize
        }
        parentMap = Object.fromEntries(allParents.map((p: any) => [p.legacy_id, p.id]))
      }

      const BATCH_SIZE = 500
      let inserted = 0

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE)
        const rows = batch.map((r: any) => ({
          name: r.name,
          type,
          legacy_id: r.legacy_id,
          parent_id: type !== 'province' ? parentMap[r.legacy_parent_id] || null : null,
        }))

        const { error } = await supabase.from('regions').insert(rows)
        if (error) {
          return new Response(
            JSON.stringify({ ok: false, error: error.message, inserted }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        inserted += batch.length
      }

      return new Response(JSON.stringify({ ok: true, inserted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
