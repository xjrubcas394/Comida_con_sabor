import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PanelAdmin() {
  const [productosPendientes, setProductosPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

const cargarPendientes = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const resYo = await fetch('http://localhost:8000/api/catalogo/yo/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resYo.ok) {
        const usuario = await resYo.json();
        if (usuario.rol !== 'Administrador') {
          alert("Acceso denegado. Área restringida a Administración.");
          navigate('/'); 
          return;
        }
      } else {
        // NUEVO: Si el servidor da error o no te reconoce, ¡a la calle!
        alert("Error de autenticación. Inicia sesión de nuevo.");
        navigate('/login');
        return;
      }

      const resP = await fetch('http://localhost:8000/api/catalogo/productos/?pendientes=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resP.ok) {
        const data = await resP.json();
        setProductosPendientes(data.results ? data.results : data);
      }
      
      // SOLO quitamos el "cargando" si hemos llegado hasta aquí exitosamente
      setCargando(false); 
      
    } catch (err) {
      console.error(err);
      setCargando(false);
    } 
  };

  useEffect(() => {
    cargarPendientes();
  }, []);

  const moderarProducto = async (id, nuevoEstado) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`http://localhost:8000/api/catalogo/productos/${id}/moderar/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado_moderacion: nuevoEstado })
      });

      if (res.ok) {
        // Recargamos la lista para que el producto desaparezca de los pendientes
        cargarPendientes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (cargando) return <div className="p-8 text-center">Cargando panel de administración...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-gray-600 mb-8">Revisa y modera los productos subidos por los productores antes de publicarlos en la tienda.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {productosPendientes.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">¡Todo al día!</h3>
              <p className="mt-1 text-sm text-gray-500">No hay productos pendientes de revisión.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Producto</th>
                  <th className="p-4 font-semibold text-gray-700">Precio</th>
                  <th className="p-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPendientes.map(producto => (
                  <tr key={producto.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{producto.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{producto.historia || 'Sin descripción'}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-700">{producto.precio}€</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => moderarProducto(producto.id, 'Aprobado')}
                          className="bg-green-100 text-green-700 hover:bg-green-200 font-bold py-2 px-4 rounded transition-colors"
                        >
                          Aprobar
                        </button>
                        <button 
                          onClick={() => moderarProducto(producto.id, 'Rechazado')}
                          className="bg-red-100 text-red-700 hover:bg-red-200 font-bold py-2 px-4 rounded transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default PanelAdmin;