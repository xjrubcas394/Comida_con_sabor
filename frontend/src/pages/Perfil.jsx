import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Perfil() {
  const [datosPaginados, setDatosPaginados] = useState({ results: [], next: null, previous: null });  
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [imagen, setImagen] = useState(null);
  
  // NUEVOS ESTADOS PARA VENTAS Y PESTAÑAS
  const [misVentas, setMisVentas] = useState([]);
  const [pestañaActiva, setPestañaActiva] = useState('productos'); 
  const navigate = useNavigate();

  const [formProducto, setFormProducto] = useState({
    nombre: '', precio: '', categoria: '', historia: ''
  });

  const ejecutarBusqueda = (e) => {
    e.preventDefault();
    cargarDatos(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/?propios=true&search=${busqueda}`);
  };

const cargarDatos = async (url = `${import.meta.env.VITE_API_URL}/api/catalogo/productos/?propios=true`) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const resYo = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/yo/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resYo.ok) {
        const usuario = await resYo.json();
        if (usuario.rol !== 'Productor') {
          alert("Acceso denegado. El Panel de Control es exclusivo para Productores.");
          navigate('/'); 
          return; // Cortamos aquí sin quitar la pantalla de carga
        }
      } else {
        navigate('/login');
        return;
      }

      const resP = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (resP.ok) {
        const respuesta = await resP.json();
        setDatosPaginados(respuesta); 
      }

      const resC = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/categorias/`);
      if (resC.ok) {
        const dataCategorias = await resC.json();
        setCategorias(dataCategorias.results ? dataCategorias.results : dataCategorias);
      }
      
      const resV = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/mis-ventas/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resV.ok) {
        const dataVentas = await resV.json();
        setMisVentas(dataVentas.results ? dataVentas.results : dataVentas);
      }

      // SOLO quitamos el "cargando" si el productor pasó todos los controles
      setCargando(false);

    } catch (err) { 
      console.error(err); 
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const prepararEdicion = (p) => {
    setEditandoId(p.id);
    setFormProducto({
      nombre: p.nombre,
      precio: p.precio,
      categoria: p.categoria,
      historia: p.historia || ''
    });
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    const url = editandoId 
      ? `${import.meta.env.VITE_API_URL}/api/catalogo/productos/${editandoId}/` 
      : `${import.meta.env.VITE_API_URL}/api/catalogo/productos/`;
    
    try {
      const respuesta = await fetch(url, {
        method: editandoId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formProducto)
      });

      if (respuesta.ok) {
        const productoGuardado = await respuesta.json();
        const idFinal = editandoId ? editandoId : productoGuardado.id;

        if (imagen) {
          const formData = new FormData();
          formData.append('imagen', imagen);

          await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/${idFinal}/subir_imagen/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }

        setMostrarFormulario(false);
        setEditandoId(null);
        setFormProducto({ nombre: '', precio: '', categoria: '', historia: '' });
        setImagen(null);
        cargarDatos();
      }
    } catch (err) { console.error(err); }
  };

  const eliminarProducto = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/productos/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) cargarDatos();
    } catch (err) { console.error(err); }
  };

  const marcarComoEnviado = async (pedidoId) => {
    if (!confirm("¿Marcar este pedido como enviado? El cliente recibirá su paquete pronto.")) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/pedidos/${pedidoId}/marcar_enviado/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        cargarDatos();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Panel de Productor</h1>

        {/* --- PESTAÑAS DE NAVEGACIÓN --- */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button 
            onClick={() => setPestañaActiva('productos')}
            className={`py-2 px-4 font-semibold border-b-2 transition-colors ${pestañaActiva === 'productos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Mis Productos
          </button>
          <button 
            onClick={() => setPestañaActiva('ventas')}
            className={`py-2 px-4 font-semibold border-b-2 transition-colors ${pestañaActiva === 'ventas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Mis Ventas
          </button>
        </div>

        {/* --- VISTA: MIS VENTAS --- */}
        {pestañaActiva === 'ventas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {misVentas.length === 0 ? (
              <p className="p-8 text-center text-gray-500">Aún no tienes ventas registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-semibold text-gray-700">Fecha</th>
                      <th className="p-4 font-semibold text-gray-700">Producto</th>
                      <th className="p-4 font-semibold text-gray-700">Cant.</th>
                      <th className="p-4 font-semibold text-gray-700">Cliente y Dirección</th>
                      <th className="p-4 font-semibold text-gray-700 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {misVentas.map(venta => (
                      <tr key={venta.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 text-gray-600">{new Date(venta.fecha_pedido).toLocaleDateString()}</td>
                        <td className="p-4 font-medium text-gray-900">{venta.nombre_producto}</td>
                        <td className="p-4 text-gray-600">{venta.cantidad}</td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{venta.nombre_cliente}</div>
                          <div className="text-sm text-gray-500">{venta.direccion_cliente}, {venta.ciudad_cliente}</div>
                        </td>
                        <td className="p-4 text-center">
                          {venta.estado_pedido === 'Pendiente' ? (
                            <button 
                              onClick={() => marcarComoEnviado(venta.pedido_id)}
                              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                              Marcar Enviado
                            </button>
                          ) : (
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                              {venta.estado_pedido}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- VISTA: MIS PRODUCTOS --- */}
        {pestañaActiva === 'productos' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-xl font-semibold text-gray-700">Catálogo Personal</h2>
              <div className="flex gap-4 w-full md:w-auto">
                <form onSubmit={ejecutarBusqueda} className="flex flex-1">
                  <input 
                    type="text" 
                    placeholder="Buscar mis productos..." 
                    className="border border-gray-300 rounded-l-lg p-2 w-full focus:outline-none focus:border-blue-500"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-r-lg hover:bg-gray-700">
                    Buscar
                  </button>
                </form>
                
                <button 
                  type="button"
                  onClick={() => { 
                    setMostrarFormulario(!mostrarFormulario); 
                    setEditandoId(null); 
                    setFormProducto({ nombre: '', precio: '', categoria: '', historia: '' }); 
                    setImagen(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-colors"
                >
                  {mostrarFormulario ? 'Cancelar' : '+ Nuevo Producto'}
                </button>
              </div>
            </div>

            {mostrarFormulario && (
              <form onSubmit={guardarProducto} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-2 gap-4">
                <h2 className="col-span-2 text-xl font-bold border-b pb-2">
                  {editandoId ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <input placeholder="Nombre" className="border p-2 rounded" value={formProducto.nombre} onChange={e => setFormProducto({...formProducto, nombre: e.target.value})} required />
                <input placeholder="Precio" type="number" step="0.01" className="border p-2 rounded" value={formProducto.precio} onChange={e => setFormProducto({...formProducto, precio: e.target.value})} required />
                <select className="border p-2 rounded" value={formProducto.categoria} onChange={e => setFormProducto({...formProducto, categoria: e.target.value})} required>
                  <option value="">Categoría...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <textarea placeholder="Historia" className="border p-2 rounded col-span-2" value={formProducto.historia} onChange={e => setFormProducto({...formProducto, historia: e.target.value})} />
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1 font-medium">Foto del producto</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImagen(e.target.files[0])}
                    className="w-full border border-gray-300 p-2 rounded bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                  />
                </div>
                <button className="col-span-2 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition-colors">
                  {editandoId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datosPaginados.results.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold">{p.nombre}</h3>
                  <p className="text-2xl text-green-600 font-bold mb-4">{p.precio}€</p>
                  <div className="flex gap-2 border-t pt-4">
                    <button onClick={() => prepararEdicion(p)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded font-medium transition-colors">Editar</button>
                    <button onClick={() => eliminarProducto(p.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded font-medium transition-colors">Borrar</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button 
                disabled={!datosPaginados.previous}
                onClick={() => cargarDatos(datosPaginados.previous)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button 
                disabled={!datosPaginados.next}
                onClick={() => cargarDatos(datosPaginados.next)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Perfil;