import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';

export function useInvitacionesController() {
  const navigate = useNavigate();

  const handleAtras = () => {
    navigate(ROUTES.TRIPS.CREATE);
  };

  const handleSiguiente = () => {
    // TODO: Guardar invitaciones y navegar al siguiente paso
    navigate(ROUTES.TRIPS.RESUMEN);
  };

  return {
    handleAtras,
    handleSiguiente,
  };
}
