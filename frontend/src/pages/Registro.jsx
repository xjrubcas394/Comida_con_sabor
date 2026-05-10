import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Registro() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogo/registro/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (respuesta.ok) {
        // Si se registra bien, lo mandamos directamente al Login para que entre
        alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
        navigate('/login');
      } else {
        const data = await respuesta.json();
        // Capturamos si el usuario ya existe
        if (data.username) setError('Ese nombre de usuario ya está en uso.');
        else setError('Hubo un error al crear la cuenta. Revisa los datos.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Crear una cuenta</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Únete para comprar los mejores productos artesanales</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded text-center text-sm font-medium">{error}</div>}
        
        <form className="mt-8 space-y-6" onSubmit={manejarRegistro}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" placeholder="Nombre" className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
              <input required type="text" placeholder="Apellidos" className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
            <input required type="email" placeholder="Correo electrónico" className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required type="password" placeholder="Contraseña" className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button type="submit" disabled={cargando} className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${cargando ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}>
            {cargando ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="text-center mt-4">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 text-sm">¿Ya tienes cuenta? Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
}

export default Registro;