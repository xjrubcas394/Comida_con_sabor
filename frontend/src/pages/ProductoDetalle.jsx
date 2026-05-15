import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductoDetalle() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [imagenPrincipal, setImagenPrincipal] = useState('');
  
  const { agregarAlCarrito } = useCart();
  const [recomendacionIA, setRecomendacionIA] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/${id}/`)
      .then(res => res.json())
      .then(data => {
        setProducto(data);
        if (data.imagenes && data.imagenes.length > 0) {
          setImagenPrincipal(data.imagenes[0].imagen);
        }
        setCargando(false);
      })
      .catch(err => {
        console.error("Error cargando producto:", err);
        setCargando(false);
      });
  }, [id]);

  const consultarMaridaje = async () => {
    setCargandoIA(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/${producto.id}/maridaje/`);
      const data = await res.json();
      if (res.ok) setRecomendacionIA(data.recomendacion);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoIA(false);
    }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Cargando joya gastronómica...</div>;
  if (!producto) return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Producto no encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block">
          &larr; Volver al catálogo
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row">
          
          {/* COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES */}
          <div className="w-full md:w-1/2 p-6 bg-gray-100 flex flex-col">
            <div className="w-full h-96 bg-white rounded-xl overflow-hidden shadow-sm mb-4 border border-gray-200">
              {imagenPrincipal ? (
                <img src={imagenPrincipal} alt={producto.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
              )}
            </div>
            
            {/* Miniaturas de imágenes (Si hay más de 1) */}
            {producto.imagenes && producto.imagenes.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {producto.imagenes.map((img) => (
                  <button 
                    key={img.id} 
                    onClick={() => setImagenPrincipal(img.imagen)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${imagenPrincipal === img.imagen ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img.imagen} className="w-full h-full object-cover" alt="miniatura" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: DETALLES DEL PRODUCTO */}
          <div className="w-full md:w-1/2 p-10 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{producto.nombre}</h1>
                <p className="text-lg text-gray-500 font-medium">Productor: {producto.productor_nombre}</p>
              </div>
              <span className="text-3xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg">{producto.precio}€</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                {producto.categoria_nombre || "Sin Categoría"}
              </span>
              {producto.es_km0 && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full flex items-center gap-1">📍 Km 0</span>
              )}
              {producto.es_organico && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full flex items-center gap-1">🌱 Orgánico</span>
              )}
              {producto.region_origen && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full flex items-center gap-1">🌍 Origen: {producto.region_origen}</span>
              )}
            </div>

            <div className="mb-8 flex-grow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">La historia detrás del producto</h3>
              <p className="text-gray-600 leading-relaxed">
                {producto.historia || "Este producto artesanal aún no tiene una historia registrada por su productor."}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              <button 
                onClick={() => agregarAlCarrito(producto)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
              >
                Añadir al carrito
              </button>

              <button 
                onClick={consultarMaridaje}
                disabled={cargandoIA}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-lg shadow-md"
              >
                {cargandoIA ? 'Pensando maridaje...' : '✨ Sugerir Maridaje con IA'}
              </button>

              {recomendacionIA && (
                <div className="mt-2 p-5 bg-purple-50 border border-purple-200 rounded-xl shadow-inner">
                  <p className="text-purple-900 font-medium italic text-lg text-center">
                    "{recomendacionIA}"
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;