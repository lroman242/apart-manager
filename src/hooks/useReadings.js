import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useReadings(apartmentId) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('utility_payments')
      .select('*, payment_line_items(*)')
      .eq('apartment_id', apartmentId)
      .order('period_start', { ascending: false })
    if (err) {
      setError(err.message)
    } else {
      setPayments(data)
    }
    setLoading(false)
  }, [apartmentId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  async function createPayment(payload) {
    const { data, error: err } = await supabase.functions.invoke('readings-create', {
      body: { apartment_id: Number(apartmentId), ...payload },
    })
    if (err) throw new Error(err.message)
    if (data?.error) throw new Error(data.error)
    await fetchPayments()
  }

  return { payments, loading, error, createPayment }
}
