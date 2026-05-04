import { useEffect, useState } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { useEditProfileController } from './hooks/useEditProfileController';
import EditProfileLeftPanel from './components/EditProfileLeftPanel';
import EditProfileForm from './components/EditProfileForm';
import SplashScreen from '../shared/SplashScreen';

const heroImg = '/img/background/editProfile/editProfile.jpeg';
const logoImg = '/img/logo/logo-sin-texto-png.png';

export default function EditProfile({ isOnboarding = false }) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const {
    user,
    loading,
    saving,
    success,
    error,
    fieldErrors,
    form,
    activeSection,
    hasSavedOnce,
    isDirty,
    setActiveSection,
    handleChange,
    handleSave,
    handleClose,
    setForm,
  } = useEditProfileController(navigate);

  const blocker = useBlocker(isDirty);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-brand-white">
        <div className="h-10 w-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-dvh flex items-center justify-center bg-brand-white">
        <p className="body text-slate-500">Debes iniciar sesión para editar tu perfil.</p>
      </div>
    );
  }

  return (
    <>
      <img src={heroImg} style={{ display: 'none' }} onLoad={() => setImageLoaded(true)} />
      {!imageLoaded && <SplashScreen />}
      {imageLoaded && (
        <div className="md:min-h-screen flex flex-col items-center pt-6 bg-slate-50 px-4 overflow-y-auto">
          <div className="w-full max-w-5xl grid md:grid-cols-2 md:rounded-2xl md:shadow-[0_0_18px_rgba(15,23,42,0.30)] md:overflow-hidden">
            <EditProfileLeftPanel
              heroImg={heroImg}
              logoImg={logoImg}
              usuario={user}
              form={form}
              setForm={setForm}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
            <EditProfileForm
              activeSection={activeSection}
              form={form}
              fieldErrors={fieldErrors}
              error={error}
              success={success}
              saving={saving}
              isOnboarding={isOnboarding}
              hasSavedOnce={hasSavedOnce}
              onChange={handleChange}
              onSave={handleSave}
              onClose={handleClose}
              setForm={setForm}
            />
          </div>
        </div>
      )}

      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={() => blocker.reset()} />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="title-h3-desktop text-neutral-7 mb-2">¿Salir sin guardar?</h3>
            <p className="body-2 text-neutral-5 mb-4">
              Tienes cambios sin guardar. Si sales ahora, se perderán.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => blocker.reset()}
                className="flex-1 h-10 rounded-lg border border-neutral-2 body-3 font-bold text-neutral-5 hover:bg-neutral-1 transition cursor-pointer"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={() => blocker.proceed()}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white body-3 font-bold hover:bg-red-700 transition cursor-pointer"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
