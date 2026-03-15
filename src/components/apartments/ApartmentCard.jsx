export default function ApartmentCard({ apartment, onEdit, onDelete, onToggleHold, onTariffs }) {
  const isOnHold = apartment.status === 'on_hold'

  const createdAt = new Date(apartment.created_at).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={`bg-white border rounded-xl p-4 flex flex-col gap-3 transition-opacity ${isOnHold ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-800">{apartment.name}</span>
          {apartment.address && (
            <span className="text-sm text-gray-500">{apartment.address}</span>
          )}
          <span className="text-xs text-gray-400">Додано {createdAt}</span>
        </div>


        {isOnHold && (
          <span className="shrink-0 inline-block bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
            Призупинено
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(apartment)}
          className="text-sm px-3 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          Редагувати
        </button>

        <button
          onClick={() => onTariffs(apartment)}
          className="text-sm px-3 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          Тарифи
        </button>

        <button
          onClick={() => onToggleHold(apartment)}
          className="text-sm px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {isOnHold ? 'Зняти призупинення' : 'Призупинити'}
        </button>

        <button
          onClick={() => onDelete(apartment)}
          className="text-sm px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors ml-auto"
        >
          Видалити
        </button>
      </div>
    </div>
  )
}
