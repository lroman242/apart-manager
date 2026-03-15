import { useState } from 'react'

export default function TariffForm({ initialValues = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initialValues.name ?? '')
  const [price, setPrice] = useState(initialValues.price != null ? String(initialValues.price) : '')
  const [unit, setUnit] = useState(initialValues.unit ?? '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const type = initialValues.type
  const isResource = type === 'resource'
  const isEditing = Boolean(initialValues.id)

  async function handleSubmit(e) {
    e.preventDefault()
    const newErrors = {}

    if (!name.trim()) newErrors.name = "Назва обов'язкова"

    const parsedPrice = parseFloat(price)
    if (price === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      newErrors.price = 'Ціна повинна бути невід\'ємним числом'
    }

    if (isResource && !unit.trim()) {
      newErrors.unit = 'Одиниця виміру обов\'язкова'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    await onSubmit({
      name: name.trim(),
      type,
      price: parsedPrice,
      unit: isResource ? unit.trim() : null,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="tariff-name" className="block text-sm font-medium text-gray-700 mb-1">
          Назва <span className="text-red-500">*</span>
        </label>
        <input
          id="tariff-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: null })) }}
          placeholder={isResource ? 'напр. Електроенергія' : 'напр. Інтернет'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="tariff-price" className="block text-sm font-medium text-gray-700 mb-1">
          {isResource ? 'Ціна за одиницю' : 'Ціна'} <span className="text-red-500">*</span>
        </label>
        <input
          id="tariff-price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => { setPrice(e.target.value); if (errors.price) setErrors(p => ({ ...p, price: null })) }}
          placeholder="0.00"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
      </div>

      {isResource && (
        <div>
          <label htmlFor="tariff-unit" className="block text-sm font-medium text-gray-700 mb-1">
            Одиниця виміру <span className="text-red-500">*</span>
          </label>
          <input
            id="tariff-unit"
            type="text"
            value={unit}
            onChange={(e) => { setUnit(e.target.value); if (errors.unit) setErrors(p => ({ ...p, unit: null })) }}
            placeholder="напр. кВт·год, м³"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.unit && <p className="mt-1 text-xs text-red-600">{errors.unit}</p>}
        </div>
      )}

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
          {submitting ? 'Збереження…' : isEditing ? 'Зберегти зміни' : 'Додати'}
        </button>
      </div>
    </form>
  )
}
