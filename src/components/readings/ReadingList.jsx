import ReadingCard from './ReadingCard'

export default function ReadingList({ payments, onAdd, onAddFirst, onEdit }) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <span className="text-4xl">📋</span>
        <p className="text-gray-600 font-medium">Показників ще немає</p>
        <button
          onClick={onAddFirst}
          className="mt-2 text-sm text-indigo-600 hover:underline"
        >
          Додати перший запис →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Додати показники
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {payments.map((p, i) => (
          <ReadingCard key={p.id} payment={p} paymentIndex={i} allPayments={payments} isLatest={i === 0} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}
