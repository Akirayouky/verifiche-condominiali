'use client'

export default function TestCSS() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          🎨 Test CSS Tailwind
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Card Rossa</h2>
            <p className="text-gray-600">Se vedi questo con colori e layout, CSS funziona!</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Card Verde</h2>
            <p className="text-gray-600">Tailwind CSS è attivo e funzionante.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Card Blu</h2>
            <p className="text-gray-600">Responsive design e animazioni ok!</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Test Componenti</h2>
          
          <div className="space-y-4">
            <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors duration-200 shadow-sm">
              Button Hover Test
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Badge Verde
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Badge Rosso
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Badge Blu
              </span>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
              Area con bordo tratteggiato - se vedi questo styling, tutto funziona!
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Torna alla Homepage
          </a>
        </div>
      </div>
    </div>
  )
}