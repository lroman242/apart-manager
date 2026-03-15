export default function TariffCard({ tariff, onEdit, onDelete }) {
  const isResource = tariff.type === 'resource'

  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-800">{tariff.name}</span>
          <span className="text-sm text-gray-600">
            {isResource
              ? `${Number(tariff.price).toFixed(2)} / ${tariff.unit}`
              : `${Number(tariff.price).toFixed(2)} грн`}
          </span>
        </div>
        <span className={`shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
          isResource
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {isResource ? 'Ресурс' : 'Послуга'}
        </span>
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(tariff)}
          className="text-sm text-indigo-600 hover:underline"
        >
          Редагувати
        </button>
        <button
          onClick={() => onDelete(tariff.id)}
          className="text-sm text-red-500 hover:underline ml-auto"
        >
          Видалити
        </button>
      </div>
    </div>
  )
}
