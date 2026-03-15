import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useReadings, fetchPreviousMeterValues } from '../hooks/useReadings'
import ReadingForm from '../components/readings/ReadingForm'
import ReadingList from '../components/readings/ReadingList'

export default function ReadingsPage() {
  const { id: apartmentId } = useParams()
  const navigate = useNavigate()

  const [apartmentName, setApartmentName] = useState('')
  const [apartmentLoading, setApartmentLoading] = useState(true)
  const [tariffs, setTariffs] = useState([])
  const [formMode, setFormMode] = useState(null) // null | 'initial' | 'monthly' | 'edit'
  const [editPayment, setEditPayment] = useState(null)
  const [previousMeterValues, setPreviousMeterValues] = useState({})
  const [actionError, setActionError] = useState(null)

  const { payments, loading, error, createPayment, updatePayment } = useReadings(apartmentId)

  useEffect(() => {
    supabase
      .from('apartments')
      .select('id, name')
      .eq('id', apartmentId)
      .single()
      .then(({ data }) => {
        if (data) setApartmentName(data.name)
        setApartmentLoading(false)
      })

    supabase
      .from('tariffs')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setTariffs(data)
      })
  }, [apartmentId])

  async function openForm(mode) {
    const values = await fetchPreviousMeterValues(apartmentId)
    setPreviousMeterValues(values)
    setFormMode(mode)
  }

  async function openEditForm(payment) {
    // Previous meter values for edit = meter values from the payment before this one
    const prevPayment = payments[payments.indexOf(payment) + 1]
    const prevValues = {}
    for (const item of prevPayment?.payment_line_items ?? []) {
      if (item.meter_value_current != null) {
        prevValues[item.tariff_name] = item.meter_value_current
      }
    }
    setPreviousMeterValues(prevValues)
    setEditPayment(payment)
    setFormMode('edit')
  }

  function getNextPeriod(lastPeriodEnd) {
    const [y, m, d] = lastPeriodEnd.split('-').map(Number)
    const nextEnd = new Date(y, m, d)
    const fmt = (dt) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    return { periodStart: lastPeriodEnd, periodEnd: fmt(nextEnd) }
  }

  async function handleCreate(payload) {
    setActionError(null)
    try {
      await createPayment(payload)
      setFormMode(null)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleUpdate(payload) {
    setActionError(null)
    try {
      await updatePayment(editPayment.id, payload)
      setFormMode(null)
      setEditPayment(null)
    } catch (err) {
      setActionError(err.message)
    }
  }

  function handleCancel() {
    setFormMode(null)
    setEditPayment(null)
    setActionError(null)
  }

  const formTitle = formMode === 'initial'
    ? 'Перший запис показників'
    : formMode === 'edit'
      ? 'Редагувати показники'
      : 'Додати показники'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Назад
        </button>
        <span className="font-semibold text-gray-800">
          {apartmentLoading ? '…' : apartmentName}
        </span>
        <span className="text-sm text-gray-400">— Показники</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {actionError}
          </div>
        )}

        {formMode ? (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">{formTitle}</h2>
            <ReadingForm
              mode={formMode}
              periodStart={formMode === 'monthly' ? getNextPeriod(payments[0]?.period_end).periodStart : undefined}
              periodEnd={formMode === 'monthly' ? getNextPeriod(payments[0]?.period_end).periodEnd : undefined}
              tariffs={tariffs}
              previousMeterValues={previousMeterValues}
              initialPayment={formMode === 'edit' ? editPayment : null}
              onSubmit={formMode === 'edit' ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-500 text-center py-8">Завантаження…</p>
        ) : error ? (
          <p className="text-sm text-red-600 text-center py-8">{error}</p>
        ) : (
          <ReadingList
            payments={payments}
            onAdd={() => openForm('monthly')}
            onAddFirst={() => openForm('initial')}
            onEdit={openEditForm}
          />
        )}
      </main>
    </div>
  )
}
