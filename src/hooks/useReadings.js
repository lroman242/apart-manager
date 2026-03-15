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

  async function updatePayment(paymentId, payload) {
    const { data, error: err } = await supabase.functions.invoke('readings-update', {
      body: { payment_id: Number(paymentId), ...payload },
    })
    if (err) throw new Error(err.message)
    if (data?.error) throw new Error(data.error)
    await fetchPayments()
  }

  return { payments, loading, error, createPayment, updatePayment }
}

export async function fetchPreviousMeterValues(apartmentId) {
  const { data, error } = await supabase
    .from('payment_line_items')
    .select('tariff_name, meter_value_current, utility_payments!inner(apartment_id, period_start)')
    .eq('utility_payments.apartment_id', apartmentId)
    .not('meter_value_current', 'is', null)

  if (error || !data) return {}

  const sorted = [...data].sort((a, b) => {
    const aDate = a.utility_payments?.period_start ?? ''
    const bDate = b.utility_payments?.period_start ?? ''
    return bDate.localeCompare(aDate)
  })

  const result = {}
  for (const row of sorted) {
    if (!(row.tariff_name in result)) {
      result[row.tariff_name] = row.meter_value_current
    }
  }
  return result
}
