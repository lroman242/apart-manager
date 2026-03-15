import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApartments } from '../hooks/useApartments'
import ApartmentList from '../components/apartments/ApartmentList'
import ApartmentForm from '../components/apartments/ApartmentForm'
import DeleteConfirmDialog from '../components/apartments/DeleteConfirmDialog'

// Form mode: null | 'create' | { ...apartment } (editing)
export default function ApartmentsPage() {
  const navigate = useNavigate()
  const { apartments, loading, error, createApartment, updateApartment, deleteApartment, setHold, removeHold } =
    useApartments()

  const [formMode, setFormMode] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionError, setActionError] = useState(null)

  async function handleFormSubmit(values) {
    setActionError(null)
    try {
      if (formMode === 'create') {
        await createApartment(values)
      } else {
        await updateApartment(formMode.id, values)
      }
      setFormMode(null)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleDeleteConfirm() {
    setActionError(null)
    try {
      await deleteApartment(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleToggleHold(apartment) {
    setActionError(null)
    try {
      if (apartment.status === 'on_hold') {
        await removeHold(apartment.id)
      } else {
        await setHold(apartment.id)
      }
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">Apart Manager</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Вийти
        </button>
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
              {formMode === 'create' ? 'Додати квартиру' : 'Редагувати квартиру'}
            </h2>
            <ApartmentForm
              initialValues={formMode === 'create' ? {} : formMode}
              onSubmit={handleFormSubmit}
              onCancel={() => setFormMode(null)}
            />
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-500 text-center py-8">Завантаження…</p>
        ) : error ? (
          <p className="text-sm text-red-600 text-center py-8">{error}</p>
        ) : (
          <ApartmentList
            apartments={apartments}
            onAdd={() => setFormMode('create')}
            onEdit={(apt) => setFormMode(apt)}
            onDelete={(apt) => setDeleteTarget(apt)}
            onToggleHold={handleToggleHold}
            onTariffs={(apt) => navigate(`/apartments/${apt.id}/tariffs`)}
          />
        )}
      </main>

      {deleteTarget && (
        <DeleteConfirmDialog
          apartmentName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
