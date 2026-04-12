import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../config/routes";
import CategoryBar from "./CategoryBar";
import SplashScreen from "../shared/SplashScreen";

const heroImg = '/img/background/home/hero/background_hero.jpg';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, user } = useAuth();
  const [showInviteError, setShowInviteError] = useState(searchParams.get('inviteError') === 'emailMismatch');
  const [imagenCargada, setImagenCargada] = useState(false);

  useEffect(() => {
    if (!showInviteError) return;
    setSearchParams((prev) => { prev.delete('inviteError'); return prev; }, { replace: true });
    const timer = setTimeout(() => setShowInviteError(false), 8000);
    return () => clearTimeout(timer);
  }, []);
  const registeredName =
    profile?.nombre ||
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "usuario";

  return (
    <>
      <img src={heroImg} style={{ display: 'none' }} onLoad={() => setImagenCargada(true)} alt="" />
      {!imagenCargada && <SplashScreen />}
      {imagenCargada && <>
      {showInviteError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-feedback-error flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-feedback-error-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="title-h3-desktop text-neutral-6 mb-2">Invitación no válida</p>
              <p className="body-2 text-neutral-4">
                Esta invitación fue enviada a una dirección de correo diferente a la tuya. Cierra sesión e inicia sesión con la cuenta correcta para unirte al viaje.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteError(false)}
              className="w-full bg-primary-3 hover:bg-orange-400 text-white body-2-semibold py-3 rounded-full transition duration-200"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      <div
      style={{
        backgroundImage: "url('/img/background/home/hero/background_hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        height: "100dvh",
        width: "calc(100% + 2rem)",
        margin: 0,
        padding: 0,
        marginLeft: "-1rem",
        marginTop: "-6.5rem",
        marginBottom: "-1.5rem",
      }}
    >
      <div className="absolute left-5 right-5 top-24 sm:left-10 sm:top-32 sm:right-auto md:left-14 md:top-36 lg:left-16 lg:top-40 max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl text-left">
        <h1 className="title-h1-mobile md:title-h1-desktop text-sky-400">
          ¡Bienvenid@, {registeredName}!
        </h1>

        <h2 className="title-h2-mobile md:title-h2-desktop text-sky-400 mt-2">
          Plan, Pack &amp; Go
        </h2>

        <p className="body-bold text-white mt-4">
          Planifica tu próximo gran viaje o explora nuevos destinos para tu próxima aventura
        </p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.TRIPS.CREATE)}
          className="mt-5 bg-primary-3 hover:bg-orange-400 text-white body-2-semibold px-5 py-2 rounded-full transition duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
        >
          Crear un nuevo viaje
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <CategoryBar />
      </div>
    </div>
    </>}
    </>
  );
}
