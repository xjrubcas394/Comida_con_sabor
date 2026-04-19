import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Perfil() {
  const [misProductos, setMisProductos] = useState([]);
  const [categorias, setCategorias] = useState([]); // Guardará las categorías para el select
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false); // Controla si se ve el formulario
  const navigate = useNavigate();

  // Estados para el formulario
  const [nuevoProducto, setNuevoProducto] = useState({nombre: '', precio: '', categoria: '', historia: ''});
  const [imagen, setImagen] = useState(null);

  const cargarDatos = async () => {
    const token = localStorage.getItem('access_token');
    try {
      // Pedimos los productos
      const resProductos = await fetch('http://localhost:8000/api/catalogo/productos/?propios=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resProductos.ok) setMisProductos(await resProductos.json());
      else if (resProductos.status === 401) cerrarSesion();

      // Pedimos las categorías (no necesitan token porque son de lectura pública)
      const resCategorias = await fetch('http://localhost:8000/api/catalogo/categorias/');
      if (resCategorias.ok) setCategorias(await resCategorias.json());

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Función para manejar el envío del formulario
  const crearProducto = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    
    try {
      // PASO 1: Creamos el producto (JSON)
      const resProducto = await fetch('http://localhost:8000/api/catalogo/productos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoProducto)
      });

      if (resProducto.ok) {
        const productoCreado = await resProducto.json();

        if (imagen) {
          const formData = new FormData();
          formData.append('imagen', imagen);

          await fetch(`http://localhost:8000/api/catalogo/productos/${productoCreado.id}/subir_imagen/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }

        setMostrarFormulario(false);
        setNuevoProducto({ nombre: '', precio: '', categoria: '', historia: '' });
        setImagen(null);
        cargarDatos(); 
      } else {
        alert("Error al crear el producto. Revisa los datos.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Panel de Productor</h1>
        <button onClick={cerrarSesion} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded font-medium transition-colors">Cerrar Sesión</button>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Tus Productos</h2>
          <button 
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className={`${mostrarFormulario ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm`}
          >
            {mostrarFormulario ? 'Cancelar' : '+ Añadir Nuevo Producto'}
          </button>
        </div>

        {/* Zona del Formulario (Se oculta/muestra) */}
        {mostrarFormulario && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-blue-100">
            <h3 className="text-lg font-bold mb-4">Detalles del nuevo producto</h3>
            <form onSubmit={crearProducto} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre del producto</label>
                <input required type="text" className="w-full border border-gray-300 p-2 rounded"
                  value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Precio (€)</label>
                <input required type="number" step="0.01" className="w-full border border-gray-300 p-2 rounded"
                  value={nuevoProducto.precio} onChange={e => setNuevoProducto({...nuevoProducto, precio: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                <select required className="w-full border border-gray-300 p-2 rounded bg-white"
                  value={nuevoProducto.categoria} onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}>
                  <option value="">Selecciona una categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Historia / Descripción (Opcional)</label>
                <textarea className="w-full border border-gray-300 p-2 rounded" rows="3"
                  value={nuevoProducto.historia} onChange={e => setNuevoProducto({...nuevoProducto, historia: e.target.value})}></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Imagen del Producto</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImagen(e.target.files[0])}
                  className="w-full border border-gray-300 p-2 rounded bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de productos */}
        {cargando ? (
          <p className="text-gray-500">Cargando tus productos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {misProductos.length > 0 ? (
              misProductos.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800">{p.nombre}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{p.categoria_nombre || 'Sin categoría'}</span>
                  </div>
                  <p className="text-2xl text-green-600 font-bold mt-2">{p.precio}€</p>
                  <p className="text-sm text-gray-500 mt-4 pt-4 border-t">
                    Estado: <span className={p.estado_moderacion === 'Aprobado' ? 'text-green-600 font-semibold' : 'text-orange-500 font-semibold'}>
                      {p.estado_moderacion}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 bg-white p-10 rounded-xl border border-dashed border-gray-300">
                Aún no has subido ningún producto. ¡Dale al botón azul para empezar!
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Perfil;