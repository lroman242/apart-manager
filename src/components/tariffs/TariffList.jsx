import TariffCard from './TariffCard'

export default function TariffList({ tariffs, onAddService, onAddResource, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
          Тарифи
          {tariffs.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({tariffs.length})</span>
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onAddService}
            className="bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Послуга
          </button>
          <button
            onClick={onAddResource}
            className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Ресурс
          </button>
        </div>
      </div>

      {tariffs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <span className="text-4xl">📋</span>
          <p className="text-gray-600 font-medium">Тарифів ще немає</p>
          <p className="text-sm text-gray-400">Додайте послугу або ресурс для цієї квартири.</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={onAddService}
              className="text-sm text-green-600 hover:underline"
            >
              Додати послугу →
            </button>
            <button
              onClick={onAddResource}
              className="text-sm text-blue-600 hover:underline"
            >
              Додати ресурс →
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tariffs.map((tariff) => (
            <TariffCard
              key={tariff.id}
              tariff={tariff}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
