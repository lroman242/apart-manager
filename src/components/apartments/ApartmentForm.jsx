import { useState } from 'react'

export default function ApartmentForm({ initialValues = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initialValues.name ?? '')
  const [address, setAddress] = useState(initialValues.address ?? '')
  const [nameError, setNameError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name.trim()) {
      setNameError("Назва обов'язкова")
      return
    }

    setNameError(null)
    setSubmitting(true)
    await onSubmit({ name: name.trim(), address: address.trim() || null })
    setSubmitting(false)
  }

  const isEditing = Boolean(initialValues.id)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="apt-name" className="block text-sm font-medium text-gray-700 mb-1">
          Назва <span className="text-red-500">*</span>
        </label>
        <input
          id="apt-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(null)
          }}
          placeholder="напр. Кв. 3Б"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
      </div>

      <div>
        <label htmlFor="apt-address" className="block text-sm font-medium text-gray-700 mb-1">
          Адреса <span className="text-gray-400 font-normal">(необов'язково)</span>
        </label>
        <input
          id="apt-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="напр. вул. Головна 12, кв. 3Б"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Збереження…' : isEditing ? 'Зберегти зміни' : 'Додати квартиру'}
        </button>
      </div>
    </form>
  )
}
