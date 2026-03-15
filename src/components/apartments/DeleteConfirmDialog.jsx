export default function DeleteConfirmDialog({ apartmentName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Видалити квартиру?</h2>
        <p className="text-sm text-gray-600">
          Ви впевнені, що хочете назавжди видалити{' '}
          <span className="font-medium text-gray-800">{apartmentName}</span>?
          Цю дію неможливо скасувати.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  )
}
