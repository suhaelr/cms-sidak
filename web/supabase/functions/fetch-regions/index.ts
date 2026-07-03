import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api'

async function fetchJSON(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
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
    const body = await req.json()
    const { step, province_id } = body

    // Clear villages only
    if (step === 'clear_villages') {
      const { error } = await supabase.from('regions').delete().eq('type', 'village')
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 1: Clear all regions and import provinces
    if (step === 'provinces') {
      await supabase.from('regions').delete().not('id', 'is', null)

      const provinces = await fetchJSON(`${BASE_URL}/provinces.json`)
      const rows = provinces.map((p: any) => ({
        name: p.name,
        type: 'province',
        legacy_id: parseInt(p.id),
      }))

      const { error } = await supabase.from('regions').insert(rows)
      if (error) throw error

      return new Response(JSON.stringify({ ok: true, inserted: rows.length, next: 'cities' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 2: Import cities/regencies
    if (step === 'cities') {
      const { data: dbProvinces } = await supabase
        .from('regions').select('id, legacy_id').eq('type', 'province')
      const parentMap: Record<number, string> = {}
      for (const p of dbProvinces || []) {
        if (p.legacy_id) parentMap[p.legacy_id] = p.id
      }

      const provinces = await fetchJSON(`${BASE_URL}/provinces.json`)
      let allCities: any[] = []
      for (const prov of provinces) {
        const cities = await fetchJSON(`${BASE_URL}/regencies/${prov.id}.json`)
        allCities = allCities.concat(cities.map((c: any) => ({
          name: c.name,
          type: 'city',
          legacy_id: parseInt(c.id),
          parent_id: parentMap[parseInt(c.province_id)] || null,
        })))
      }

      const BATCH = 500
      let inserted = 0
      for (let i = 0; i < allCities.length; i += BATCH) {
        const batch = allCities.slice(i, i + BATCH)
        const { error } = await supabase.from('regions').insert(batch)
        if (error) throw error
        inserted += batch.length
      }

      return new Response(JSON.stringify({ ok: true, inserted, next: 'districts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 3: Import districts
    if (step === 'districts') {
      const { data: dbCities } = await supabase
        .from('regions').select('id, legacy_id').eq('type', 'city')
      const parentMap: Record<number, string> = {}
      for (const c of dbCities || []) {
        if (c.legacy_id) parentMap[c.legacy_id] = c.id
      }

      const provinces = await fetchJSON(`${BASE_URL}/provinces.json`)
      let allDistricts: any[] = []

      for (const prov of provinces) {
        const cities = await fetchJSON(`${BASE_URL}/regencies/${prov.id}.json`)
        for (const city of cities) {
          try {
            const districts = await fetchJSON(`${BASE_URL}/districts/${city.id}.json`)
            for (const d of districts) {
              allDistricts.push({
                name: d.name,
                type: 'district',
                legacy_id: parseInt(d.id),
                parent_id: parentMap[parseInt(d.regency_id)] || null,
              })
            }
          } catch (e) {
            console.warn(`Skip districts for ${city.id}: ${e}`)
          }
        }
      }

      const BATCH = 500
      let inserted = 0
      for (let i = 0; i < allDistricts.length; i += BATCH) {
        const batch = allDistricts.slice(i, i + BATCH)
        const { error } = await supabase.from('regions').insert(batch)
        if (error) throw error
        inserted += batch.length
      }

      return new Response(JSON.stringify({ ok: true, inserted, next: 'villages' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 4: Import villages for a specific province
    if (step === 'villages') {
      if (!province_id) {
        const provinces = await fetchJSON(`${BASE_URL}/provinces.json`)
        return new Response(JSON.stringify({ 
          ok: true, 
          provinces: provinces.map((p: any) => ({ id: p.id, name: p.name })),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Build parent map for districts - fetch in batches to handle >1000 rows
      const parentMap: Record<number, string> = {}
      let from = 0
      const batchSize = 1000
      while (true) {
        const { data, error } = await supabase
          .from('regions')
          .select('id, legacy_id')
          .eq('type', 'district')
          .not('legacy_id', 'is', null)
          .range(from, from + batchSize - 1)
        if (error) throw error
        if (!data || data.length === 0) break
        for (const d of data) {
          if (d.legacy_id) parentMap[d.legacy_id] = d.id
        }
        if (data.length < batchSize) break
        from += batchSize
      }

      const cities = await fetchJSON(`${BASE_URL}/regencies/${province_id}.json`)
      let allVillages: any[] = []

      for (const city of cities) {
        try {
          const districts = await fetchJSON(`${BASE_URL}/districts/${city.id}.json`)
          for (const district of districts) {
            try {
              const villages = await fetchJSON(`${BASE_URL}/villages/${district.id}.json`)
              for (const v of villages) {
                allVillages.push({
                  name: v.name,
                  type: 'village',
                  legacy_id: parseInt(v.id),
                  parent_id: parentMap[parseInt(v.district_id)] || null,
                })
              }
            } catch (e) {
              console.warn(`Skip villages for district ${district.id}: ${e}`)
            }
          }
        } catch (e) {
          console.warn(`Skip city ${city.id}: ${e}`)
        }
      }

      // Insert in batches
      const BATCH = 500
      let inserted = 0
      for (let i = 0; i < allVillages.length; i += BATCH) {
        const batch = allVillages.slice(i, i + BATCH)
        const { error } = await supabase.from('regions').insert(batch)
        if (error) {
          console.error(`Batch insert error at ${i}: ${error.message}`)
          throw error
        }
        inserted += batch.length
      }

      return new Response(JSON.stringify({ ok: true, inserted, province_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown step' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})