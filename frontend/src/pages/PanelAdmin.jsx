import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PanelAdmin() {
  const [productosPendientes, setProductosPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [pestañaActiva, setPestañaActiva] = useState('productos');
  const navigate = useNavigate();

  const cargarDatosAdmin = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // 1. Validar que eres Admin
      const resYo = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/yo/`, {
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
        alert("Error de autenticación. Inicia sesión de nuevo.");
        navigate('/login');
        return;
      }

      // 2. Cargar Productos Pendientes
      const resP = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/?pendientes=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resP.ok) {
        const data = await resP.json();
        setProductosPendientes(data.results ? data.results : data);
      }

      // 3. Cargar Lista de Usuarios
      const resU = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/gestion/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resU.ok) {
        const dataUsuarios = await resU.json();
        setUsuarios(dataUsuarios);
      }
      
      setCargando(false); 
      
    } catch (err) {
      console.error("Error cargando panel:", err);
      setCargando(false);
    } 
  };

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  const moderarProducto = async (id, nuevoEstado) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/${id}/moderar/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado_moderacion: nuevoEstado })
      });

      if (res.ok) cargarDatosAdmin(); 
    } catch (err) {
      console.error(err);
    }
  };

  const cambiarRolUsuario = async (usuarioId, nuevoRol) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/gestion/${usuarioId}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ rol: nuevoRol })
      });

      if (res.ok) {
        setUsuarios(usuarios.map(u => u.id === usuarioId ? { ...u, rol: nuevoRol } : u));
        alert(`Rol actualizado a ${nuevoRol} correctamente.`);
      }
    } catch (err) {
      console.error("Error cambiando rol:", err);
    }
  };

  if (cargando) return <div className="p-8 text-center text-lg font-bold">Cargando Panel de Mando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button 
            onClick={() => setPestañaActiva('productos')}
            className={`py-2 px-4 font-semibold border-b-2 transition-colors ${pestañaActiva === 'productos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Moderar Productos
          </button>
          <button 
            onClick={() => setPestañaActiva('usuarios')}
            className={`py-2 px-4 font-semibold border-b-2 transition-colors ${pestañaActiva === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Gestión de Roles
          </button>
        </div>

        {/* MODERAR PRODUCTOS */}
        {pestañaActiva === 'productos' && (
          <div>
            <p className="text-gray-600 mb-6">Revisa y modera los productos subidos por los productores antes de publicarlos.</p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {productosPendientes.length === 0 ? (
                <div className="p-12 text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">¡Todo al día!</h3>
                  <p className="mt-1 text-sm text-gray-500">No hay productos pendientes de revisión.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-semibold text-gray-700">Producto</th>
                      <th className="p-4 font-semibold text-gray-700">Precio</th>
                      <th className="p-4 font-semibold text-gray-700 text-center">Acciones</th>
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
                          <div className="flex gap-2 justify-center">
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
        )}

        {/* --- VISTA: GESTIÓN DE ROLES --- */}
        {pestañaActiva === 'usuarios' && (
          <div>
            <p className="text-gray-600 mb-6">Asigna permisos de Productor a las cuentas que soliciten vender en la plataforma.</p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {usuarios.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No hay usuarios registrados en la plataforma.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-semibold text-gray-700">Usuario</th>
                      <th className="p-4 font-semibold text-gray-700 text-center">Rol Actual</th>
                      <th className="p-4 font-semibold text-gray-700 text-center">Cambiar Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{u.nombre} {u.apellidos}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            u.rol === 'Productor' ? 'bg-purple-100 text-purple-700' : 
                            u.rol === 'Administrador' ? 'bg-red-100 text-red-700' : 
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <select 
                            className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                            value={u.rol}
                            onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                          >
                            <option value="Cliente">Cliente</option>
                            <option value="Productor">Productor</option>
                            <option value="Administrador">Administrador</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PanelAdmin;