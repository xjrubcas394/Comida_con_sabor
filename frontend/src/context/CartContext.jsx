import { createContext, useState, useContext } from 'react';

// 1. Creamos el contexto (la "frecuencia de radio")
const CartContext = createContext();

// 2. Creamos el Provider (la "torre de transmisión")
export function CartProvider({ children }) {
  // El estado global de nuestro carrito (empieza vacío)
  const [carrito, setCarrito] = useState([]);

  // Acción: Añadir producto al carrito
  const agregarAlCarrito = (producto) => {
    setCarrito((carritoActual) => {
      // Comprobamos si el producto ya está en el carrito
      const itemExistente = carritoActual.find(item => item.id === producto.id);
      
      if (itemExistente) {
        // Si ya está, solo le sumamos 1 a la cantidad
        return carritoActual.map(item =>
          item.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      // Si no está, lo añadimos entero y le ponemos cantidad: 1
      return [...carritoActual, { ...producto, cantidad: 1 }];
    });
  };

  // Acción: Eliminar un producto entero (botón papelera)
  const eliminarDelCarrito = (productoId) => {
    setCarrito((carritoActual) => carritoActual.filter(item => item.id !== productoId));
  };

  // Acción: Cambiar la cantidad con los botones [+] y [-]
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return; // Evitamos que compren "0" o "-1" unidades
    setCarrito((carritoActual) =>
      carritoActual.map(item =>
        item.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  // Acción: Vaciar todo (al terminar la compra)
  const limpiarCarrito = () => setCarrito([]);

  return (
    // "Emitimos" los datos y las funciones a toda la app
    <CartContext.Provider value={{ 
      carrito, 
      agregarAlCarrito, 
      eliminarDelCarrito, 
      actualizarCantidad, 
      limpiarCarrito 
    }}>
      {children}
    </CartContext.Provider>
  );
}

// 3. Creamos un Hook personalizado para no tener que importar useContext siempre
export const useCart = () => useContext(CartContext);