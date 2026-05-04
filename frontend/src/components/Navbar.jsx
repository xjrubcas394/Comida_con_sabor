import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
  // 1. Nos traemos más funciones de nuestro "cerebro" (el Context)
  const { carrito, eliminarDelCarrito, actualizarCantidad } = useCart();
  
  // 2. Nuevo estado local para controlar si el panel lateral está abierto o cerrado
  const [isCartAbierto, setIsCartAbierto] = useState(false);

  const totalArticulos = carrito.reduce((total, item) => total + item.cantidad, 0);
  
  // 3. Calculamos el precio total (multiplicando cantidad por precio unitario)
  const precioTotal = carrito.reduce((total, item) => total + (parseFloat(item.precio) * item.cantidad), 0);

  const navigate = useNavigate();

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          
          <Link to="/" className="text-2xl font-extrabold text-gray-900 tracking-tight hover:text-blue-600 transition-colors">
            Comida Con Sabor
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Acceso Productores
            </Link>
            
            {/* 4. Al hacer clic, abrimos el panel cambiando el estado a true */}
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

      {/* 5. FONDO OSCURO (Backdrop) - Si haces clic fuera del carrito, se cierra */}
      {isCartAbierto && (
        <div 
          className="fixed inset-0 bg-black/10 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsCartAbierto(false)}
        />
      )}

      {/* 6. PANEL LATERAL DEL CARRITO */}
      {/* Usamos clases de Tailwind (translate-x) para que se deslice desde la derecha */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isCartAbierto ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        
        {/* Cabecera del panel */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Tu Cesta</h2>
          <button onClick={() => setIsCartAbierto(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Lista de productos en el carrito */}
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
                  {/* Foto en miniatura */}
                  <img 
                    src={producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0].imagen : ''} 
                    alt={producto.nombre} 
                    className="w-20 h-20 object-cover rounded-md bg-gray-100 border border-gray-200" 
                  />
                  
                  {/* Detalles y controles */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{producto.nombre}</h3>
                    <p className="text-green-600 font-bold">{producto.precio}€</p>
                    
                    <div className="flex justify-between items-center mt-3">
                      {/* Botones de [ - 1 + ] */}
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition">-</button>
                        <span className="px-3 py-1 font-medium text-sm bg-white border-x border-gray-300">{producto.cantidad}</span>
                        <button onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition">+</button>
                      </div>
                      
                      {/* Botón de eliminar */}
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
                navigate('/checkout');
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