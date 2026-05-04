import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Checkout() {
  const { carrito, limpiarCarrito } = useCart();
  const [pedidoCompletado, setPedidoCompletado] = useState(false);

  const subtotal = carrito.reduce((total, item) => total + (parseFloat(item.precio) * item.cantidad), 0);
  const gastosEnvio = subtotal > 50 ? 0 : 4.99;
  const total = subtotal + gastosEnvio;

  const [formDatos, setFormDatos] = useState({
    nombre: '', email: '', direccion: '', ciudad: '', tarjeta: ''
  });
  const [procesando, setProcesando] = useState(false);

  const procesarPago = async (e) => {
    e.preventDefault();
    setProcesando(true); // Bloqueamos el botón temporalmente
    
    // 1. Traducimos el carrito de React al formato que espera Django
    const detallesPedido = carrito.map(item => ({
      producto: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio // Mandamos el precio actual por si el productor lo cambia mañana
    }));

    // 2. Preparamos el paquete completo (Ticket padre + Líneas hijas)
    const payload = {
      nombre_cliente: formDatos.nombre,
      email: formDatos.email,
      direccion: formDatos.direccion,
      ciudad: formDatos.ciudad,
      total: total.toFixed(2), // El total que calculamos en el frontend
      detalles: detallesPedido
    };

    try {
      // 3. Enviamos el paquete a nuestra nueva puerta de entrada en Django
      const respuesta = await fetch('http://localhost:8000/api/catalogo/pedidos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (respuesta.ok) {
        // 4. ¡ÉXITO! La base de datos lo ha guardado.
        limpiarCarrito();
        setPedidoCompletado(true);
      } else {
        // Si Django rechaza el paquete (ej. faltan datos)
        console.error("Django rechazó el pedido", await respuesta.json());
        alert("Hubo un problema al procesar tu pedido. Revisa tus datos.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor de pagos.");
    } finally {
      setProcesando(false); // Desbloqueamos el botón
    }
  };

  if (pedidoCompletado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
          <p className="text-gray-600 mb-8">Gracias por apoyar a nuestros productores locales. Te hemos enviado un email con los detalles.</p>
          <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
        <Link to="/" className="text-blue-600 hover:underline font-medium">Volver a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        

        <div className="lg:col-span-7 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalles de Envío y Pago</h2>
          
          <form onSubmit={procesarPago} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input required type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formDatos.nombre} onChange={e => setFormDatos({...formDatos, nombre: e.target.value})} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formDatos.email} onChange={e => setFormDatos({...formDatos, email: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega</label>
                <input required type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Calle, número, piso..." value={formDatos.direccion} onChange={e => setFormDatos({...formDatos, direccion: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input required type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formDatos.ciudad} onChange={e => setFormDatos({...formDatos, ciudad: e.target.value})} />
              </div>
            </div>

            <hr className="my-8 border-gray-200" />
            
            <h3 className="text-lg font-bold text-gray-900 mb-4">Información de Pago (Simulada)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tarjeta (Falsa)</label>
              <input required type="text" placeholder="0000 0000 0000 0000" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" value={formDatos.tarjeta} onChange={e => setFormDatos({...formDatos, tarjeta: e.target.value})} />
            </div>

            <button 
              type="submit" 
              disabled={procesando}
              className={`w-full text-white font-bold py-4 rounded-xl mt-8 transition-colors text-lg ${procesando ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'}`}
            >
              {procesando ? 'Procesando conexión segura...' : `Pagar ${total.toFixed(2)}€`}
            </button>
          </form>
        </div>



        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen de tu pedido</h2>
            
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
              {carrito.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative">
                    <img src={item.imagenes[0]?.imagen || ''} alt={item.nombre} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.cantidad}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 line-clamp-1">{item.nombre}</h4>
                    <p className="text-gray-500 text-sm">{item.productor_nombre}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{(parseFloat(item.precio) * item.cantidad).toFixed(2)}€</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Gastos de envío</span>
                <span>{gastosEnvio === 0 ? <span className="text-green-600 font-medium">Gratis</span> : `${gastosEnvio}€`}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Checkout;