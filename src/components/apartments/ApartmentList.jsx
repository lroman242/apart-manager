import ApartmentCard from './ApartmentCard'

export default function ApartmentList({ apartments, onAdd, onEdit, onDelete, onToggleHold, onTariffs }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Квартири
          {apartments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({apartments.length})</span>
          )}
        </h2>
        <button
          onClick={onAdd}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Додати квартиру
        </button>
      </div>

      {apartments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <span className="text-4xl">🏠</span>
          <p className="text-gray-600 font-medium">Квартир ще немає</p>
          <p className="text-sm text-gray-400">Додайте першу квартиру, щоб почати.</p>
          <button
            onClick={onAdd}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            Додати першу квартиру →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apartments.map((apt) => (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleHold={onToggleHold}
              onTariffs={onTariffs}
            />
          ))}
        </div>
      )}
    </div>
  )
}
