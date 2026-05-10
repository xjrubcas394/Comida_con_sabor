import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useCart } from './context/CartContext'
import Login from './pages/Login'
import Perfil from './pages/Perfil'
import Checkout from './pages/Checkout'
import Registro from './pages/Registro';
import PanelAdmin from './pages/PanelAdmin';

function Catalogo() {
  const [datosPaginados, setDatosPaginados] = useState({ results: [], next: null, previous: null })
  const [cargando, setCargando] = useState(true)
  const { agregarAlCarrito } = useCart();

  // Cargar cualquier página
  const cargarPagina = (url = `${import.meta.env.VITE_API_URL}/api/catalogo/productos/`) => {
    setCargando(true);
    fetch(url)
      .then(respuesta => respuesta.json())
      .then(datos => {
        setDatosPaginados(datos)
        setCargando(false)
      })
      .catch(error => {
        console.error("Error:", error)
        setCargando(false)
      })
  }

  useEffect(() => {
    cargarPagina();
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Comida Con Sabor</h1>
        <p className="text-lg text-gray-600">Catálogo Gourmet Artesanal</p>
      </header>

      {cargando ? (
        <p className="text-center text-gray-500">Cargando delicias...</p>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {datosPaginados.results.length > 0 ? (
              datosPaginados.results.map(producto => (
                <div key={producto.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                      <img src={producto.imagenes[0].imagen} alt={producto.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-bold text-gray-800">{producto.nombre}</h2>
                      <span className="text-lg font-semibold text-green-600">{producto.precio}€</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
                      Productor: <span className="font-medium text-gray-700">{producto.productor_nombre}</span>
                    </div>
                    <button 
                      onClick={() => agregarAlCarrito(producto)}
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
                    >
                      Añadir al carrito
                    </button>
                  </div>
                </div>
              ))
            ) : (
               <p className="text-center col-span-full text-gray-500">No hay productos disponibles.</p>
            )}
          </div>

          <div className="mt-12 flex justify-center gap-4">
            <button 
              disabled={!datosPaginados.previous}
              onClick={() => cargarPagina(datosPaginados.previous)}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              ← Anterior
            </button>
            <button 
              disabled={!datosPaginados.next}
              onClick={() => cargarPagina(datosPaginados.next)}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/admin" element={<PanelAdmin />} />
      </Routes>
    </>
  )
}

export default App