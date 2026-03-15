import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTariffs(apartmentId) {
  const [tariffs, setTariffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTariffs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tariffs')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTariffs(data)
      setError(null)
    }
    setLoading(false)
  }, [apartmentId])

  useEffect(() => {
    if (apartmentId) fetchTariffs()
  }, [fetchTariffs, apartmentId])

  async function createTariff({ name, type, price, unit }) {
    const { data, error } = await supabase.functions.invoke('tariffs-create', {
      body: { apartment_id: Number(apartmentId), name, type, price, unit: unit || null },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchTariffs()
  }

  async function updateTariff(id, { name, price, unit }) {
    const { data, error } = await supabase.functions.invoke('tariffs-update', {
      body: { id, name, price, unit: unit || null },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchTariffs()
  }

  async function deleteTariff(id) {
    const { data, error } = await supabase.functions.invoke('tariffs-delete', {
      body: { id },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchTariffs()
  }

  return {
    tariffs,
    loading,
    error,
    createTariff,
    updateTariff,
    deleteTariff,
  }
}
