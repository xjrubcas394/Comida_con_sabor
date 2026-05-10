import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { carrito, eliminarDelCarrito, actualizarCantidad } = useCart();
  const [isCartAbierto, setIsCartAbierto] = useState(false);
  
  // NUEVO ESTADO: Guardamos el rol del usuario para pintar los botones
  const [rolUsuario, setRolUsuario] = useState(null);

  const totalArticulos = carrito.reduce((total, item) => total + item.cantidad, 0);
  const precioTotal = carrito.reduce((total, item) => total + (parseFloat(item.precio) * item.cantidad), 0);
  const navigate = useNavigate();

  // NUEVO: Al cargar la barra, si hay token, preguntamos quién es
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/yo/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token inválido');
      })
      .then(data => setRolUsuario(data.rol))
      .catch(() => {
        // Si falla, borramos sesión por seguridad
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setRolUsuario(null);
      });
    }
  }, []);

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          
          <Link to="/" className="text-2xl font-extrabold text-gray-900 tracking-tight hover:text-blue-600 transition-colors">
            Comida Con Sabor
          </Link>
          
          <div className="flex items-center gap-6">
            {localStorage.getItem('access_token') ? (
              <>
                {rolUsuario === 'Administrador' && (
                  <Link to="/admin" className="text-purple-600 hover:text-purple-800 font-bold transition-colors">
                    Panel Admin
                  </Link>
                )}

                {rolUsuario === 'Productor' && (
                  <Link to="/perfil" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Mis Productos
                  </Link>
                )}

                <button 
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/';
                  }}
                  className="text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Iniciar Sesión / Registro
              </Link>
            )}
            
            <button 
              onClick={() => setIsCartAbierto(true)}
              className="relative p-2 text-gray-800 hover:text-blue-600 transition-colors group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalArticulos > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1/4 -translate-y-1/4 shadow-sm border-2 border-white">
                  {totalArticulos}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* FONDO OSCURO */}
      {isCartAbierto && (
        <div 
          className="fixed inset-0 bg-black/10 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsCartAbierto(false)}
        />
      )}

      {/* PANEL LATERAL DEL CARRITO */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isCartAbierto ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Tu Cesta</h2>
          <button onClick={() => setIsCartAbierto(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {carrito.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-gray-500 mb-4">Tu cesta está vacía.</p>
              <button onClick={() => setIsCartAbierto(false)} className="text-blue-600 font-medium hover:underline">Continuar comprando</button>
            </div>
          ) : (
            <ul className="space-y-6">
              {carrito.map(producto => (
                <li key={producto.id} className="flex gap-4 border-b border-gray-50 pb-4">
                  <img 
                    src={producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0].imagen : ''} 
                    alt={producto.nombre} 
                    className="w-20 h-20 object-cover rounded-md bg-gray-100 border border-gray-200" 
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{producto.nombre}</h3>
                    <p className="text-green-600 font-bold">{producto.precio}€</p>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition">-</button>
                        <span className="px-3 py-1 font-medium text-sm bg-white border-x border-gray-300">{producto.cantidad}</span>
                        <button onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition">+</button>
                      </div>
                      <button onClick={() => eliminarDelCarrito(producto.id)} className="text-red-500 text-sm font-medium hover:text-red-700 transition underline">
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {carrito.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-900">
              <span>Total Estimado:</span>
              <span>{precioTotal.toFixed(2)}€</span>
            </div>
            <p className="text-xs text-gray-500 mb-4 text-center">Impuestos y gastos de envío calculados en el pago.</p>
            <button 
              onClick={() => {
                setIsCartAbierto(false); 
                const token = localStorage.getItem('access_token');
                if (!token) {
                  alert("¡Hola! Para finalizar tu compra, por favor inicia sesión o regístrate.");
                  navigate('/login');
                } else {
                  navigate('/checkout'); 
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-lg shadow-md transition-colors"
            >
              Proceder al Pago
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Navbar;