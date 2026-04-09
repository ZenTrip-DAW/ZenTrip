export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="title-h2-desktop text-secondary-5 mb-2">Política de Privacidad</h1>
      <p className="body-3 text-neutral-4 mb-8">Última actualización: abril de 2026</p>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">1. Responsable del tratamiento</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          ZenTrip es un proyecto académico desarrollado como Trabajo de Fin de Grado (TFG) del ciclo formativo
          de Desarrollo de Aplicaciones Web (DAW). El responsable del tratamiento de los datos es la autora del proyecto.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">2. Datos que recogemos</h2>
        <ul className="list-disc pl-5 space-y-2 body-2 text-neutral-5">
          <li>Correo electrónico y contraseña (para autenticación).</li>
          <li>Nombre, apellidos y nombre de usuario (para personalizar tu perfil).</li>
          <li>Número de teléfono y país (opcionales, para completar tu perfil).</li>
          <li>Foto de perfil (opcional, URL pública).</li>
          <li>Datos de los viajes que creas o en los que participas.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">3. Finalidad del tratamiento</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          Los datos se utilizan exclusivamente para el funcionamiento de la plataforma: gestionar tu cuenta,
          permitirte crear y unirte a viajes, y personalizar tu experiencia. No se ceden a terceros ni se
          utilizan con fines comerciales.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">4. Base legal</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          El tratamiento se basa en el consentimiento del usuario al registrarse en la plataforma y en la
          ejecución del contrato de uso del servicio.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">5. Almacenamiento y seguridad</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          Los datos se almacenan en Firebase (Google) con medidas de seguridad estándar de la industria,
          incluyendo cifrado en tránsito (HTTPS) y autenticación segura.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">6. Tus derechos</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición
          y portabilidad contactando a través del correo indicado en la plataforma. También puedes eliminar
          tu cuenta desde la configuración de perfil.
        </p>
      </section>

      <section>
        <h2 className="title-h3-desktop text-secondary-5 mb-3">7. Cookies</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          ZenTrip utiliza almacenamiento local (localStorage) para mantener tu sesión activa. No se utilizan
          cookies de terceros con fines publicitarios.
        </p>
      </section>
    </div>
  );
}
