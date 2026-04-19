import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const manejarLogin = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    setError('');

    try {
      // 1. Llamamos a nuestra API de Django
      const respuesta = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        // 2. ¡Éxito! Guardamos los tokens en el navegador (Local Storage)
        localStorage.setItem('access_token', datos.access);
        localStorage.setItem('refresh_token', datos.refresh);
        
        // 3. Redirigimos al usuario a su nuevo perfil (que crearemos luego)
        navigate('/perfil'); 
      } else {
        // Si las credenciales son incorrectas
        setError('Email o contraseña incorrectos.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceso para Productores
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Gestiona tu catálogo artesanal
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={manejarLogin}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Entrar al Panel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;