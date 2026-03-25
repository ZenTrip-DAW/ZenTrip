import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import { useProfileAvatar } from "../../../../hooks/useProfileAvatar";
import { useAuth } from "../../../../context/AuthContext";

export function useNavbarController() {
  const navigate = useNavigate();
  const { avatarSrc, initials } = useProfileAvatar();
  const { logout } = useAuth();

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

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
  };

  const handleGoToEditProfile = () => {
    setProfileMenuOpen(false);
    navigate(ROUTES.PROFILE.EDIT);
  };

  const handleGoHome = () => {
    setProfileMenuOpen(false);
    navigate(ROUTES.HOME);
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    try {
      await logout();
    } finally {
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    }
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
    closeProfileMenu,
    handleGoToEditProfile,
    handleGoHome,
    handleLogout,
  };
}
