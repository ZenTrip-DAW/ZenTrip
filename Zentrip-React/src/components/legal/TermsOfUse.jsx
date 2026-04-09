export default function TermsOfUse() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="title-h2-desktop text-secondary-5 mb-2">Términos de Uso</h1>
      <p className="body-3 text-neutral-4 mb-8">Última actualización: abril de 2026</p>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">1. Aceptación de los términos</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          Al registrarte y utilizar ZenTrip aceptas estos Términos de Uso. Si no estás de acuerdo,
          no debes utilizar la plataforma. ZenTrip es un proyecto académico (TFG — DAW 2026) sin
          fines comerciales.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">2. Descripción del servicio</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          ZenTrip es una plataforma de planificación de viajes que permite a los usuarios crear viajes,
          invitar a otras personas y organizar itinerarios de forma colaborativa.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">3. Uso aceptable</h2>
        <ul className="list-disc pl-5 space-y-2 body-2 text-neutral-5">
          <li>Usar la plataforma de forma lícita y respetuosa.</li>
          <li>No suplantar la identidad de otras personas.</li>
          <li>No introducir contenido ofensivo, fraudulento o ilegal.</li>
          <li>No intentar acceder a cuentas o datos de otros usuarios sin autorización.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">4. Cuentas de usuario</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          Eres responsable de mantener la confidencialidad de tus credenciales y de todas las
          actividades realizadas desde tu cuenta. Debes notificar cualquier uso no autorizado.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">5. Propiedad intelectual</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          El diseño, código y contenidos originales de ZenTrip pertenecen a su autora. Los contenidos
          generados por los usuarios (nombres de viajes, descripciones, etc.) son responsabilidad de
          quien los crea.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="title-h3-desktop text-secondary-5 mb-3">6. Limitación de responsabilidad</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          ZenTrip se proporciona "tal cual" como proyecto académico. No se garantiza disponibilidad
          continua ni se asume responsabilidad por pérdida de datos derivada de fallos técnicos.
        </p>
      </section>

      <section>
        <h2 className="title-h3-desktop text-secondary-5 mb-3">7. Modificaciones</h2>
        <p className="body-2 text-neutral-5 leading-relaxed">
          Estos términos pueden actualizarse. La fecha de última actualización siempre estará visible
          en esta página.
        </p>
      </section>
    </div>
  );
}
