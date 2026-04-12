import { useEffect, useRef } from "react";
import { useNavbarController } from "./hooks/useNavbarController";
import UserAvatar from "../../ui/UserAvatar";

const TRANSLATE_ICON = "/img/header/translate.png";
const logo = "/img/logo/logo-sin-texto-png.png";
const NAV_ITEMS = ["Explorar", "Mis viajes", "Comunidad"];

const Header = () => {
    const {
        avatarSrc,
        initials,
        avatarColor,
        notificationCount,
        messageCount,
        menuOpen,
        profileMenuOpen,
        toggleProfileMenu,
        toggleMobileMenu,
        closeProfileMenu,
        handleGoToEditProfile,
        handleGoHome,
        handleGoToMyTrips,
        handleLogout,
    } = useNavbarController();

    const profileMenuRef = useRef(null);

    useEffect(() => {
        if (!profileMenuOpen) return undefined;

        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                closeProfileMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [profileMenuOpen, closeProfileMenu]);

    return (
        <header
            className="-mt-1 w-full rounded-[9999px] h-16 flex items-center justify-between pl-3 pr-2 md:pl-5 md:pr-3 lg:pl-6 lg:pr-3"
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.30)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
            }}
        >
            {/* Logo */}
            <button
                className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0 shrink-0 -ml-0.5"
                onClick={handleGoHome}
            >
                <img src={logo} alt="ZenTrip" className="h-10 w-auto" />
                <span className="title-h3-desktop whitespace-nowrap mt-1">
                    <span className="text-secondary-5">Zen</span>
                    <span className="text-primary-3">Trip</span>
                </span>
            </button>

            {/* Nav desktop */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-8 px-4">
                {NAV_ITEMS.map((item) => (
                    item === 'Mis viajes' ? (
                        <button
                            key={item}
                            type="button"
                            onClick={handleGoToMyTrips}
                            className="body-2-semibold text-neutral-7 hover:text-primary-3 transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
                        >
                            {item}
                        </button>
                    ) : (
                        <a
                            key={item}
                            href="#"
                            className="body-2-semibold text-neutral-7 hover:text-primary-3 transition-colors duration-200"
                        >
                            {item}
                        </a>
                    )
                ))}
            </nav>

            {/* Iconos derecha */}
            <div className="flex items-center gap-5 md:gap-6 ml-auto">

                {/* Notificaciones */}
                <button className="relative p-1 cursor-pointer">
                    <svg width="25" height="25" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.0183 24.5C15.8132 24.8536 15.5188 25.1471 15.1646 25.3511C14.8104 25.5552 14.4088 25.6625 14 25.6625C13.5912 25.6625 13.1896 25.5552 12.8354 25.3511C12.4812 25.1471 12.1868 24.8536 11.9817 24.5M21 9.33334C21 7.47683 20.2625 5.69635 18.9497 4.3836C17.637 3.07084 15.8565 2.33334 14 2.33334C12.1435 2.33334 10.363 3.07084 9.05025 4.3836C7.7375 5.69635 7 7.47683 7 9.33334C7 17.5 3.5 19.8333 3.5 19.8333H24.5C24.5 19.8333 21 17.5 21 9.33334Z" stroke="#1E1E1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    {notificationCount > 0 && (
                        <span
                            className="absolute -top-1 -right-1 bg-primary-3 text-white body-3 rounded-full flex items-center justify-center min-w-4.5 h-4.5"
                        >
                            {notificationCount}
                        </span>
                    )}
                </button>

                {/* Mensajes */}
                <button className="relative p-1 cursor-pointer">
                    <svg width="25" height="25" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24.5 13.4167C24.504 14.9565 24.1442 16.4755 23.45 17.85C22.6268 19.497 21.3614 20.8824 19.7954 21.8508C18.2293 22.8193 16.4246 23.3326 14.5833 23.3333C13.0435 23.3374 11.5245 22.9776 10.15 22.2833L3.5 24.5L5.71667 17.85C5.02242 16.4755 4.66265 14.9565 4.66667 13.4167C4.66738 11.5754 5.18071 9.77066 6.14917 8.20464C7.11763 6.63863 8.50296 5.37316 10.15 4.55C11.5245 3.85576 13.0435 3.49599 14.5833 3.5H15.1667C17.5984 3.63416 19.8952 4.66056 21.6173 6.38267C23.3394 8.10479 24.3658 10.4016 24.5 12.8333V13.4167Z" stroke="#1E1E1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>


                    {messageCount > 0 && (
                        <span
                            className="absolute -top-1 -right-1 bg-primary-3 text-white body-3 rounded-full flex items-center justify-center min-w-4.5 h-4.5"
                        >
                            {messageCount}
                        </span>
                    )}
                </button>

                {/* Idioma */}
                <button className="p-1 hidden sm:block cursor-pointer">
                    <img src={TRANSLATE_ICON} alt="Idioma" className="w-8 h-8 object-contain" />

                </button>

                {/* Avatar */}
                <div ref={profileMenuRef} className="relative shrink-0">
                    <button
                        className="cursor-pointer"
                        onClick={toggleProfileMenu}
                        aria-label="Menú de perfil"
                    >
                        <UserAvatar
                            src={avatarSrc}
                            initials={initials}
                            sizeClass="w-10 h-10"
                            containerClass="shrink-0"
                            backgroundClass="bg-secondary-5"
                            backgroundColor={avatarColor}
                            showColorOverlay
                            initialsClass="body-3 text-white"
                        />
                    </button>

                    {profileMenuOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 min-w-44 rounded-xl border border-secondary-1 shadow-lg z-50 py-1 backdrop-blur"
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                        >
                            <button
                                className="w-full text-left px-4 py-2 body-2 text-secondary-5 hover:bg-secondary-1 transition-colors cursor-pointer"
                                onClick={handleGoToEditProfile}
                            >
                                Editar perfil
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 body-2 text-primary-3 hover:bg-secondary-1 transition-colors cursor-pointer"
                                onClick={handleLogout}
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>

                {/* Hamburguesa móvil */}
                <button
                    className="md:hidden p-1 mr-1"
                    onClick={toggleMobileMenu}
                >
                    <div className="flex flex-col gap-1.5">
                        <span className="block w-5 h-0.5 bg-neutral-6"></span>
                        <span className="block w-5 h-0.5 bg-neutral-6"></span>
                        <span className="block w-5 h-0.5 bg-neutral-6"></span>
                    </div>
                </button>
            </div>

            {/* Nav móvil */}
            {menuOpen && (
                <div
                    className="absolute top-full left-2 right-2 mt-2 rounded-2xl border border-secondary-1 px-6 py-4 flex flex-col gap-4 md:hidden z-50 backdrop-blur"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.92)" }}
                >
                    {NAV_ITEMS.map((item) => (
                        item === 'Mis viajes' ? (
                            <button
                                key={item}
                                type="button"
                                onClick={handleGoToMyTrips}
                                className="body-2-semibold text-neutral-7 hover:text-primary-3 transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
                            >
                                {item}
                            </button>
                        ) : (
                            <a
                                key={item}
                                href="#"
                                className="body-2-semibold text-neutral-7 hover:text-primary-3 transition-colors duration-200"
                            >
                                {item}
                            </a>
                        )
                    ))}
                </div>
            )}
        </header>
    );
};

export default Header;