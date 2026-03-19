import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import { useProfileAvatar } from "../../../../hooks/useProfileAvatar";

export function useNavbarController() {
  const navigate = useNavigate();
  const { avatarSrc, initials } = useProfileAvatar();

  const notificationCount = 5;
  const messageCount = 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const toggleProfileMenu = () => {
    setProfileMenuOpen((prev) => {
      const next = !prev;
      if (next) setMenuOpen(false);
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) setProfileMenuOpen(false);
      return next;
    });
  };

  const handleGoToEditProfile = () => {
    setProfileMenuOpen(false);
    navigate(ROUTES.PROFILE.EDIT);
  };

  const handleGoHome = () => {
    setProfileMenuOpen(false);
    navigate(ROUTES.HOME);
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
  };

  return {
    avatarSrc,
    initials,
    notificationCount,
    messageCount,
    menuOpen,
    profileMenuOpen,
    toggleProfileMenu,
    toggleMobileMenu,
    handleGoToEditProfile,
    handleGoHome,
    handleLogout,
  };
}
