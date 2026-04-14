import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import { useProfileAvatar } from "../../../../hooks/useProfileAvatar";
import { useAuth } from "../../../../context/AuthContext";
import { useNotifications } from "../../../../context/NotificationContext";

export function useNavbarController() {
  const navigate = useNavigate();
  const { avatarSrc, initials } = useProfileAvatar();
  const { profile, logout } = useAuth();
  const { unseenCount: notificationCount } = useNotifications();
  const avatarColor = profile?.avatarColor || "";

  const messageCount = 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const toggleNotificationPanel = () => {
    setNotificationPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
      return next;
    });
  };

  const closeNotificationPanel = () => setNotificationPanelOpen(false);

  const toggleProfileMenu = () => {
    setProfileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setMenuOpen(false);
        setNotificationPanelOpen(false);
      }
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setProfileMenuOpen(false);
        setNotificationPanelOpen(false);
      }
      return next;
    });
  };

  const closeMobileMenu = () => setMenuOpen(false);

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

  const handleGoToMyTrips = () => {
    setMenuOpen(false);
    navigate(ROUTES.TRIPS.LIST);
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
    avatarColor,
    notificationCount,
    messageCount,
    menuOpen,
    profileMenuOpen,
    notificationPanelOpen,
    toggleProfileMenu,
    toggleMobileMenu,
    closeMobileMenu,
    closeProfileMenu,
    toggleNotificationPanel,
    closeNotificationPanel,
    handleGoToEditProfile,
    handleGoHome,
    handleGoToMyTrips,
    handleLogout,
  };
}
