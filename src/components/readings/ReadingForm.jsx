import { useState } from 'react'

function lastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// startStr is DD-MM-YYYY
function calcPeriodEnd(startStr) {
  const [, m, y] = startStr.split('-').map(Number)
  const endDay = lastDayOfMonth(y, m - 1)
  return `${String(endDay).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`
}

// DD-MM-YYYY → YYYY-MM-DD
function toIso(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('-')
  return `${y}-${m}-${d}`
}

// YYYY-MM-DD → DD-MM-YYYY
function toDdMmYyyy(isoStr) {
  const [y, m, d] = isoStr.split('-')
  return `${d}-${m}-${y}`
}

function todayStr() {
  const d = new Date()
  return `01-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

function formatDate(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('-')
  return `${d}.${m}.${y}`
}

function formatIso(isoStr) {
  const [y, m, d] = isoStr.split('-')
  return `${d}.${m}.${y}`
}

const DATE_RE = /^\d{2}-\d{2}-\d{4}$/

function sortItems(items) {
  return [...items].sort((a, b) => (a.tariff_type === b.tariff_type ? 0 : a.tariff_type === 'resource' ? -1 : 1))
}

export default function ReadingForm({ mode, periodStart, periodEnd, tariffs, previousMeterValues = {}, initialPayment = null, onSubmit, onCancel }) {
  const isInitial = mode === 'initial'
  const isEdit = mode === 'edit'

  const [startDate, setStartDate] = useState(() => {
    if (isEdit && initialPayment) return toDdMmYyyy(initialPayment.period_start)
    if (isInitial) return todayStr()
    return periodStart ?? ''
  })

  const [endDateInput, setEndDateInput] = useState(() => {
    if (isEdit && initialPayment) return toDdMmYyyy(initialPayment.period_end)
    return ''
  })

  const endDate = isEdit ? endDateInput : (isInitial ? startDate : (periodEnd ?? ''))
  const displayEndDate = isInitial ? calcPeriodEnd(startDate) : endDate

  const [lineItems, setLineItems] = useState(() => {
    if (isEdit && initialPayment) {
      return sortItems(initialPayment.payment_line_items ?? []).map((item) => ({
        tariff_id: item.id,
        tariff_name: item.tariff_name,
        tariff_type: item.tariff_type,
        unit: item.unit ?? null,
        quantity: String(parseFloat(item.quantity)),
        unit_price: String(parseFloat(item.unit_price)),
      }))
    }
    return sortItems(tariffs.map((t) => ({
      tariff_id: t.id,
      tariff_name: t.name,
      tariff_type: t.type,
      unit: t.unit ?? null,
      quantity: isInitial ? '0' : (t.type === 'service' ? '1' : ''),
      unit_price: String(t.price),
    })))
  })

  const [meterValues, setMeterValues] = useState(() => {
    if (isEdit && initialPayment) {
      const result = {}
      sortItems(initialPayment.payment_line_items ?? []).forEach((item, i) => {
        if (item.meter_value_current != null) {
          result[i] = String(parseFloat(item.meter_value_current))
        }
      })
      return result
    }
    return {}
  })

  const [meterErrors, setMeterErrors] = useState({})
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

  function handleMeterChange(index, value) {
    setMeterValues((prev) => ({ ...prev, [index]: value }))
    if (errors[`meter_${index}`]) setErrors((e) => { const n = { ...e }; delete n[`meter_${index}`]; return n })
    const item = lineItems[index]
    const prev = previousMeterValues[item.tariff_name]
    const current = parseFloat(value)

    if (value === '' || isNaN(current)) {
      setMeterErrors((e) => { const n = { ...e }; delete n[index]; return n })
      return
    }

    if (prev !== undefined && prev !== null && current < prev) {
      setMeterErrors((e) => ({ ...e, [index]: 'Поточне значення не може бути меншим за попереднє' }))
      setLineItems((items) => {
        const next = [...items]
        next[index] = { ...next[index], quantity: '' }
        return next
      })
    } else {
      setMeterErrors((e) => { const n = { ...e }; delete n[index]; return n })
      if (prev !== undefined && prev !== null) {
        const qty = (current - prev).toFixed(3)
        setLineItems((items) => {
          const next = [...items]
          next[index] = { ...next[index], quantity: qty }
          return next
        })
        setErrors((e) => { const n = { ...e }; delete n[`qty_${index}`]; return n })
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const newErrors = {}

    if (isInitial || isEdit) {
      if (!startDate) {
        newErrors.startDate = 'Дата початку обов\'язкова'
      } else if (!DATE_RE.test(startDate)) {
        newErrors.startDate = 'Формат: ДД-ММ-РРРР'
      }
    }

    if (isEdit) {
      if (!endDateInput) {
        newErrors.endDate = 'Дата закінчення обов\'язкова'
      } else if (!DATE_RE.test(endDateInput)) {
        newErrors.endDate = 'Формат: ДД-ММ-РРРР'
      }
    }

    lineItems.forEach((item, i) => {
      const qty = parseFloat(item.quantity)
      if (item.quantity === '' || isNaN(qty) || qty < 0) {
        newErrors[`qty_${i}`] = 'Кількість обов\'язкова'
      }
      if (isInitial && item.tariff_type === 'resource') {
        const mv = meterValues[i]
        if (mv === undefined || mv === '') {
          newErrors[`meter_${i}`] = 'Показник обов\'язковий'
        } else if (parseFloat(mv) < 0) {
          newErrors[`meter_${i}`] = 'Показник має бути >= 0'
        }
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
      period_start: (isInitial || isEdit) ? toIso(startDate) : periodStart,
      period_end: isEdit ? toIso(endDateInput) : (isInitial ? toIso(endDate) : periodEnd),
      line_items: lineItems.map((item, i) => ({
        tariff_name: item.tariff_name,
        tariff_type: item.tariff_type,
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        meter_value_current: meterValues[i] != null && meterValues[i] !== '' ? parseFloat(meterValues[i]) : null,
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

  const showNoTariffs = !isEdit && tariffs.length === 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isInitial || isEdit ? (
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="reading-start" className="block text-sm font-medium text-gray-700 mb-1">
              Дата початку <span className="text-red-500">*</span>
            </label>
            <input
              id="reading-start"
              type="text"
              placeholder="ДД-ММ-РРРР"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (errors.startDate) setErrors((p) => { const n = { ...p }; delete n.startDate; return n })
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
            {isInitial && startDate && (
              <p className="mt-1 text-xs text-gray-400">
                Кінець періоду: {formatDate(displayEndDate)}
              </p>
            )}
          </div>
          {isEdit && (
            <div>
              <label htmlFor="reading-end" className="block text-sm font-medium text-gray-700 mb-1">
                Дата закінчення <span className="text-red-500">*</span>
              </label>
              <input
                id="reading-end"
                type="text"
                placeholder="ДД-ММ-РРРР"
                value={endDateInput}
                onChange={(e) => {
                  setEndDateInput(e.target.value)
                  if (errors.endDate) setErrors((p) => { const n = { ...p }; delete n.endDate; return n })
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
          Період: <span className="font-medium">{formatIso(periodStart)} – {formatIso(periodEnd)}</span>
        </div>
      )}

      {showNoTariffs ? (
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
                {item.tariff_type === 'resource' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Показник лічильника</label>
                    {previousMeterValues[item.tariff_name] != null ? (
                      <p className="text-xs text-gray-400 mb-1">
                        Попередній показник: {Number(previousMeterValues[item.tariff_name]).toFixed(3)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mb-1">Перший показник</p>
                    )}
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={meterValues[i] ?? ''}
                      onChange={(e) => handleMeterChange(i, e.target.value)}
                      placeholder="0.000"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {(meterErrors[i] || errors[`meter_${i}`]) && (
                      <p className="mt-1 text-xs text-red-600">{meterErrors[i] || errors[`meter_${i}`]}</p>
                    )}
                  </div>
                )}
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
