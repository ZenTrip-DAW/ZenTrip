import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { profile, user } = useAuth();
  const registeredName =
    profile?.nombre ||
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "usuario";

  return (
    <div
      style={{
        backgroundImage: "url('/img/background/home/hero/background_hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "100vh",
        width: "calc(100% + 2rem)",
        margin: 0,
        padding: 0,
        marginLeft: "-1rem",
        marginTop: "-6.5rem",
      }}
    >
      <div className="absolute left-6 top-28 sm:left-10 sm:top-32 md:left-14 md:top-36 lg:left-16 lg:top-40 max-w-130 text-left">
        <h1 className="title-h1-mobile md:title-h1-desktop text-sky-400">
          ¡Bienvenido, {registeredName}!
        </h1>

        <h2 className="title-h2-mobile md:title-h2-desktop text-sky-400 mt-2">
          Plan, Pack &amp; Go
        </h2>

        <p className="body-bold text-white mt-4 max-w-105">
          Planifica tu próximo gran viaje o explora nuevos
          <br />
          destinos para tu próxima aventura
        </p>

        <button
          type="button"
          className="mt-5 bg-primary-3 hover:bg-orange-400 text-white body-2-semibold px-5 py-2 rounded-full transition duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
        >
          Crear un nuevo viaje
        </button>
      </div>
    </div>
  );
}
