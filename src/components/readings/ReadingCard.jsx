export default function ReadingCard({ payment }) {
  const items = payment.payment_line_items ?? []

  const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0)

  function fmtDate(isoStr) {
    const [y, m, d] = isoStr.split('-')
    return `${d}.${m}.${y}`
  }

  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800">
          {fmtDate(payment.period_start)} – {fmtDate(payment.period_end)}
        </span>
        <span className="text-sm font-semibold text-indigo-600">
          {total.toFixed(2)} грн
        </span>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {item.tariff_name}
                {item.tariff_type === 'resource' && (
                  <span className="text-gray-400 ml-1">{item.quantity} {item.unit}</span>
                )}
                {item.tariff_type === 'service' && item.quantity !== '1.000' && (
                  <span className="text-gray-400 ml-1">× {parseFloat(item.quantity)}</span>
                )}
              </span>
              <span className="text-gray-500 text-xs">
                {parseFloat(item.unit_price).toFixed(2)} × {parseFloat(item.quantity)} = <span className="text-gray-700 font-medium">{parseFloat(item.subtotal).toFixed(2)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400">Тарифів не було</p>
      )}
    </div>
  )
}
