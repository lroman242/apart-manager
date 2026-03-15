import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTariffs } from '../hooks/useTariffs'
import TariffList from '../components/tariffs/TariffList'
import TariffForm from '../components/tariffs/TariffForm'

export default function TariffsPage() {
  const { id: apartmentId } = useParams()
  const navigate = useNavigate()

  const [apartmentName, setApartmentName] = useState('')
  const [apartmentLoading, setApartmentLoading] = useState(true)

  const { tariffs, loading, error, createTariff, updateTariff, deleteTariff } = useTariffs(apartmentId)

  // formMode: null | { type: 'service' } | { type: 'resource' } | tariff object (editing)
  const [formMode, setFormMode] = useState(null)
  const [actionError, setActionError] = useState(null)

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
  }, [apartmentId])

  async function handleFormSubmit(values) {
    setActionError(null)
    try {
      if (formMode?.id) {
        await updateTariff(formMode.id, values)
      } else {
        await createTariff(values)
      }
      setFormMode(null)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleDelete(id) {
    setActionError(null)
    try {
      await deleteTariff(id)
    } catch (err) {
      setActionError(err.message)
    }
  }

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
        <span className="text-sm text-gray-400">— Тарифи</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {actionError}
          </div>
        )}

        {formMode ? (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {formMode.id
                ? (formMode.type === 'resource' ? 'Редагувати ресурс' : 'Редагувати послугу')
                : (formMode.type === 'resource' ? 'Додати ресурс' : 'Додати послугу')}
            </h2>
            <TariffForm
              initialValues={formMode}
              onSubmit={handleFormSubmit}
              onCancel={() => { setFormMode(null); setActionError(null) }}
            />
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-500 text-center py-8">Завантаження…</p>
        ) : error ? (
          <p className="text-sm text-red-600 text-center py-8">{error}</p>
        ) : (
          <TariffList
            tariffs={tariffs}
            onAddService={() => setFormMode({ type: 'service' })}
            onAddResource={() => setFormMode({ type: 'resource' })}
            onEdit={(tariff) => setFormMode(tariff)}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  )
}
