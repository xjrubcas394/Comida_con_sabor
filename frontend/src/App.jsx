import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useCart } from './context/CartContext'
import Login from './pages/Login'
import Perfil from './pages/Perfil'
import Checkout from './pages/Checkout'
import Registro from './pages/Registro';
import PanelAdmin from './pages/PanelAdmin';

function ProductoCard({ producto, agregarAlCarrito }) {
  const [recomendacionIA, setRecomendacionIA] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);

  const consultarMaridaje = async () => {
    setCargandoIA(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/${producto.id}/maridaje/`);
      const data = await res.json();
      
      if (res.ok) {
        setRecomendacionIA(data.recomendacion);
      } else {
        alert("Error en la IA: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con el asistente virtual.");
    } finally {
      setCargandoIA(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <div className="h-48 bg-gray-200 overflow-hidden shrink-0">
        {producto.imagenes && producto.imagenes.length > 0 ? (
          <img src={producto.imagenes[0].imagen} alt={producto.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-gray-800">{producto.nombre}</h2>
          <span className="text-lg font-semibold text-green-600">{producto.precio}€</span>
        </div>
        <div className="pt-4 border-t border-gray-100 text-sm text-gray-500 mb-4">
          Productor: <span className="font-medium text-gray-700">{producto.productor_nombre}</span>
        </div>
        
        {/* Contenedor de botones (mt-auto empuja los botones al fondo para alinear todas las tarjetas) */}
        <div className="mt-auto flex flex-col gap-3">
          <button 
            onClick={() => agregarAlCarrito(producto)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
          >
            Añadir al carrito
          </button>

          {/* BOTÓN MÁGICO DE IA */}
          <button 
            onClick={consultarMaridaje}
            disabled={cargandoIA}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargandoIA ? 'Pensando maridaje...' : '✨ Sugerir Maridaje (IA)'}
          </button>

          {/* RESPUESTA DE LA IA */}
          {recomendacionIA && (
            <div className="mt-1 p-3 bg-purple-50 border border-purple-200 rounded-lg shadow-sm animate-fade-in">
              <p className="text-sm text-purple-900 font-medium italic">
                "{recomendacionIA}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Catalogo() {
  const [datosPaginados, setDatosPaginados] = useState({ results: [], next: null, previous: null })
  const [cargando, setCargando] = useState(true)
  const { agregarAlCarrito } = useCart();
  
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const categoriasDestacadas = ["Quesos", "Vinos", "Aceites", "Dulces", "Conservas"];

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

  const buscarProductos = (e) => {
    e.preventDefault();
    cargarPagina(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/?search=${terminoBusqueda}`);
  };

  const buscarPorCategoria = (categoria) => {
    setTerminoBusqueda(categoria);
    cargarPagina(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/?search=${categoria}`);
  };

  useEffect(() => {
    cargarPagina();
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Comida Con Sabor</h1>
        <p className="text-lg text-gray-600">Catálogo Gourmet Artesanal</p>
      </header>

      <form onSubmit={buscarProductos} className="max-w-3xl mx-auto mb-10 flex gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre del producto o email del productor..."
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={() => {
            setTerminoBusqueda('');
            cargarPagina();
          }}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
        >
          Limpiar
        </button>
      </form>

      <div className="max-w-3xl mx-auto mb-10 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => {
            setTerminoBusqueda('');
            cargarPagina();
          }}
          className="px-5 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors shadow-sm"
        >
          Todos los productos
        </button>
        {categoriasDestacadas.map(cat => (
          <button
            key={cat}
            onClick={() => buscarPorCategoria(cat)}
            className="px-5 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
          >
            {cat}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-center text-gray-500">Cargando delicias...</p>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {datosPaginados.results.length > 0 ? (
              datosPaginados.results.map(producto => (
                <ProductoCard 
                  key={producto.id} 
                  producto={producto} 
                  agregarAlCarrito={agregarAlCarrito} 
                />
              ))
            ) : (
               <p className="text-center col-span-full text-gray-500 text-lg py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                 No hemos encontrado ningún producto con esa búsqueda 🕵️‍♂️
               </p>
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