import { useState } from 'react'

function lastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function calcPeriodEnd(startStr) {
  const [y, m] = startStr.split('-').map(Number)
  const endDay = lastDayOfMonth(y, m - 1)
  return `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatDate(isoStr) {
  const [y, m, d] = isoStr.split('-')
  return `${d}.${m}.${y}`
}

export default function ReadingForm({ mode, periodStart, periodEnd, tariffs, onSubmit, onCancel }) {
  const isInitial = mode === 'initial'

  const [startDate, setStartDate] = useState(() => {
    if (isInitial) return todayStr()
    return periodStart ?? ''
  })

  const endDate = isInitial ? calcPeriodEnd(startDate) : (periodEnd ?? '')

  const [lineItems, setLineItems] = useState(() =>
    tariffs.map((t) => ({
      tariff_id: t.id,
      tariff_name: t.name,
      tariff_type: t.type,
      unit: t.unit ?? null,
      quantity: t.type === 'service' ? '1' : '',
      unit_price: String(t.price),
    }))
  )

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function updateItem(index, field, value) {
    setLineItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    if (errors[`qty_${index}`] || errors[`price_${index}`]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[`qty_${index}`]
        delete next[`price_${index}`]
        return next
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const newErrors = {}

    if (isInitial && !startDate) {
      newErrors.startDate = 'Дата початку обов\'язкова'
    }

    lineItems.forEach((item, i) => {
      const qty = parseFloat(item.quantity)
      if (item.quantity === '' || isNaN(qty) || qty <= 0) {
        newErrors[`qty_${i}`] = 'Кількість обов\'язкова'
      }
      const price = parseFloat(item.unit_price)
      if (item.unit_price === '' || isNaN(price) || price < 0) {
        newErrors[`price_${i}`] = 'Ціна не може бути від\'ємною'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSubmitting(true)

    const payload = {
      period_start: isInitial ? startDate : periodStart,
      period_end: isInitial ? endDate : periodEnd,
      line_items: lineItems.map((item) => ({
        tariff_name: item.tariff_name,
        tariff_type: item.tariff_type,
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
      })),
    }

    await onSubmit(payload)
    setSubmitting(false)
  }

  const total = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isInitial ? (
        <div>
          <label htmlFor="reading-start" className="block text-sm font-medium text-gray-700 mb-1">
            Дата початку <span className="text-red-500">*</span>
          </label>
          <input
            id="reading-start"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (errors.startDate) setErrors((p) => { const n = { ...p }; delete n.startDate; return n })
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
          {startDate && (
            <p className="mt-1 text-xs text-gray-400">
              Кінець періоду: {formatDate(endDate)}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
          Період: <span className="font-medium">{formatDate(periodStart)} – {formatDate(periodEnd)}</span>
        </div>
      )}

      {tariffs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">Тарифів ще немає. Додайте тарифи спочатку.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">Тарифи</p>
          {lineItems.map((item, i) => {
            const qty = parseFloat(item.quantity) || 0
            const price = parseFloat(item.unit_price) || 0
            const subtotal = qty * price
            return (
              <div key={item.tariff_id} className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{item.tariff_name}</span>
                  <span className="text-xs text-gray-400">
                    {item.tariff_type === 'resource' ? 'Ресурс' : 'Послуга'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Кількість{item.tariff_type === 'resource' ? ` (${item.unit})` : ''} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      placeholder={item.tariff_type === 'resource' ? '0.000' : '1'}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors[`qty_${i}`] && <p className="mt-1 text-xs text-red-600">{errors[`qty_${i}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Ціна <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors[`price_${i}`] && <p className="mt-1 text-xs text-red-600">{errors[`price_${i}`]}</p>}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  Сума: <span className="font-medium text-gray-700">{subtotal.toFixed(2)}</span>
                </div>
              </div>
            )
          })}

          <div className="flex justify-end pt-1 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-800">
              Разом: {total.toFixed(2)}
            </span>
          </div>
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
          {submitting ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </form>
  )
}
