import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useApartments() {
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchApartments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setApartments(data)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchApartments()
  }, [fetchApartments])

  async function createApartment({ name, address }) {
    const { data, error } = await supabase.functions.invoke('apartments-create', {
      body: { name, address: address || null },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchApartments()
  }

  async function updateApartment(id, { name, address }) {
    const { data, error } = await supabase.functions.invoke('apartments-update', {
      body: { id, name, address: address || null },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchApartments()
  }

  async function deleteApartment(id) {
    const { data, error } = await supabase.functions.invoke('apartments-delete', {
      body: { id },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchApartments()
  }

  async function setHold(id) {
    const { data, error } = await supabase.functions.invoke('apartments-set-status', {
      body: { id, status: 'on_hold' },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchApartments()
  }

  async function removeHold(id) {
    const { data, error } = await supabase.functions.invoke('apartments-set-status', {
      body: { id, status: 'active' },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await fetchApartments()
  }

  return {
    apartments,
    loading,
    error,
    createApartment,
    updateApartment,
    deleteApartment,
    setHold,
    removeHold,
  }
}
