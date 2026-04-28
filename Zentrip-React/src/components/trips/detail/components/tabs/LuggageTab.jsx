import { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { Plus, Trash2, X, Users, Check } from 'lucide-react';
import { db } from '../../../../../config/firebaseConfig';
import { useAuth } from '../../../../../context/AuthContext';
import {
  getUserLuggage,
  getGroupLuggage,
  addUserLuggageItem,
  deleteUserLuggageItem,
  updateUserLuggageItemPacked,
  addGroupLuggageItem,
  addUserToGroupLuggageItem,
  removeOneGroupLuggageSelection,
  deleteGroupLuggageItem,
} from '../../../../../services/tripService';

export default function LuggageTab({ tripId }) {
  const { user, profile } = useAuth();

  const [personalItems, setPersonalItems] = useState([]);
  const [groupItems, setGroupItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [personalItemDraft, setPersonalItemDraft] = useState('');
  const [groupItemDraft, setGroupItemDraft] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [modalSelection, setModalSelection] = useState(new Set());
  const [dismissedPersonalRecents, setDismissedPersonalRecents] = useState(new Set());
  const [pendingRecentRemoval, setPendingRecentRemoval] = useState(null);

  const userName = profile?.displayName || profile?.firstName || user?.email || 'Usuario';

  const personalSuggestions = [
    'Documentación',
    'Cargador móvil',
    'Cepillo de dientes',
    'Medicinas',
    'Ropa interior',
    'Neceser',
    'Gafas de sol',
    'Pijama',
    'Desodorante',
    'Gel/Champú',
    'Tapones para oídos',
    'Bañador',
    'Pañuelo',
    'Chubasquero',
    'Cargador portátil',
    'Llaves',
    'Tarjeta sanitaria',
    'Toalla pequeña',
  ];

  const groupSuggestions = [
    'Adaptador universal',
    'Botiquín',
    'Power bank',
    'Protector solar',
    'Toalla de playa',
    'Altavoz',
    'Regleta',
    'Cargador múltiple',
    'Paraguas',
    'Cartas/juego',
    'Nevera portátil',
    'Manta',
  ];

  const getItemTime = (value) => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
    return 0;
  };

  const getRecentLabels = (items, max = 40) => {
    const ranked = items
      .map((item, index) => ({
        label: item.item,
        key: item.item?.trim().toLowerCase(),
        time: getItemTime(item.createdAt),
        index,
      }))
      .filter((entry) => entry.key);

    ranked.sort((a, b) => (b.time - a.time) || (b.index - a.index));

    const seen = new Set();
    const result = [];
    for (const entry of ranked) {
      if (seen.has(entry.key)) continue;
      seen.add(entry.key);
      result.push(entry.label);
      if (result.length >= max) break;
    }
    return result;
  };

  useEffect(() => {
    if (!tripId || !user?.uid) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [personal, group] = await Promise.all([
          getUserLuggage(tripId, user.uid),
          getGroupLuggage(tripId),
        ]);
        setPersonalItems(personal);

        const groupWithSelections = await Promise.all(
          group.map(async (item) => {
            const selectionsSnap = await getDocs(
              collection(db, 'trips', tripId, 'luggageGroup', item.id, 'selections')
            );
            const selections = selectionsSnap.docs.map((d) => d.data());
            return { ...item, selections };
          })
        );

        setGroupItems(groupWithSelections);
      } catch (err) {
        console.error('Error cargando equipaje:', err);
        setMessage('Error al cargar el equipaje.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId, user?.uid]);

  const handleAddPersonalItem = async (e) => {
    e.preventDefault();
    const trimmed = personalItemDraft.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const id = await addUserLuggageItem(tripId, user.uid, trimmed);
      setPersonalItems((prev) => [...prev, { id, item: trimmed, userId: user.uid, packed: false, createdAt: new Date() }]);
      setPersonalItemDraft('');
      setMessage('Item añadido a tu maleta.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error añadiendo item personal:', err);
      setMessage(`Error: ${err.message || 'Error al añadir item.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPersonalSuggestion = async (item) => {
    if (submitting) return;
    if (!item) return;
    setSubmitting(true);
    try {
      const id = await addUserLuggageItem(tripId, user.uid, item);
      setPersonalItems((prev) => [...prev, { id, item, userId: user.uid, packed: false, createdAt: new Date() }]);
      setMessage('Item añadido a tu maleta.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error añadiendo item personal:', err);
      setMessage(`Error: ${err.message || 'Error al añadir item.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePersonalGroupItems = async (itemId) => {
    setSubmitting(true);
    try {
      await deleteUserLuggageItem(tripId, itemId);
      setPersonalItems((prev) =>
        prev.filter((item) => item.id !== itemId)
      );
      setMessage('Item eliminado de tu maleta.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error eliminando item:', err);
      setMessage(`Error: ${err.message || 'Error al eliminar item.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePersonalPackedGroup = async (itemIds, packed) => {
    setSubmitting(true);
    try {
      await Promise.all(itemIds.map((id) => updateUserLuggageItemPacked(tripId, id, packed)));
      setPersonalItems((prev) =>
        prev.map((item) => (itemIds.includes(item.id) ? { ...item, packed } : item))
      );
    } catch (err) {
      console.error('Error actualizando item personal:', err);
      setMessage('Error al actualizar item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGroupItem = async (e) => {
    e.preventDefault();
    const trimmed = groupItemDraft.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const id = await addGroupLuggageItem(tripId, user.uid, userName, trimmed);
      const personalId = await addUserLuggageItem(tripId, user.uid, trimmed);
      setGroupItems((prev) => [
        ...prev,
        { id, item: trimmed, createdAt: new Date(), createdBy: user.uid, selections: [{ userId: user.uid, userName }] },
      ]);
      setPersonalItems((prev) => [...prev, { id: personalId, item: trimmed, userId: user.uid, packed: false, createdAt: new Date() }]);
      setGroupItemDraft('');
      setMessage('Item añadido a las maletas.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error añadiendo item grupal:', err);
      setMessage(`Error: ${err.message || 'Error al añadir item.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGroupSuggestion = async (item) => {
    if (submitting) return;
    if (!item) return;
    setSubmitting(true);
    try {
      const id = await addGroupLuggageItem(tripId, user.uid, userName, item);
      const personalId = await addUserLuggageItem(tripId, user.uid, item);
      setGroupItems((prev) => [
        ...prev,
        { id, item, createdAt: new Date(), createdBy: user.uid, selections: [{ userId: user.uid, userName }] },
      ]);
      setPersonalItems((prev) => [...prev, { id: personalId, item, userId: user.uid, packed: false, createdAt: new Date() }]);
      setMessage('Item añadido a las maletas.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error añadiendo item grupal:', err);
      setMessage(`Error: ${err.message || 'Error al añadir item.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const personalMap = new Map();
  for (const item of personalItems) {
    const key = item.item?.trim().toLowerCase();
    if (!key) continue;
    if (!personalMap.has(key)) {
      personalMap.set(key, { key, label: item.item, items: [] });
    }
    personalMap.get(key).items.push(item);
  }
  const groupedPersonalItems = Array.from(personalMap.values());

  const groupMap = new Map();
  for (const item of groupItems) {
    const key = item.item?.trim().toLowerCase();
    if (!key) continue;
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, label: item.item, items: [], selections: [] });
    }
    const group = groupMap.get(key);
    group.items.push(item);
    if (Array.isArray(item.selections)) {
      group.selections.push(...item.selections);
    }
  }
  const groupedGroupItems = Array.from(groupMap.values());

  const personalRecentItems = getRecentLabels(personalItems);
  const groupRecentSourceItems = groupItems.filter((item) => (item.selections || []).some((s) => s.userId === user?.uid) || item.createdBy === user?.uid);
  const groupRecentMap = new Map();
  for (const item of groupRecentSourceItems) {
    const key = item.item?.trim().toLowerCase();
    if (!key) continue;
    const time = getItemTime(item.createdAt);
    if (!groupRecentMap.has(key)) {
      groupRecentMap.set(key, { key, label: item.item, time, creators: new Set(), creatorIds: new Set() });
    }
    const entry = groupRecentMap.get(key);
    entry.time = Math.max(entry.time, time);
    if (item.createdBy) entry.creators.add(item.createdBy);
    if (item.createdBy === user?.uid) entry.creatorIds.add(item.id);
  }
  const groupRecentEntries = Array.from(groupRecentMap.values()).sort((a, b) => (b.time - a.time));
  const groupRecentItems = groupRecentEntries.map((entry) => entry.label);
  const groupRecentCreatorsByLabel = Object.fromEntries(
    groupRecentEntries.map((entry) => [entry.label, entry.creators])
  );
  const groupRecentIdsByLabel = Object.fromEntries(
    groupRecentEntries.map((entry) => [entry.label, Array.from(entry.creatorIds)])
  );

  const personalSuggestionsSet = new Set(
    personalSuggestions.map((item) => item.trim().toLowerCase())
  );

  const personalRecents = personalRecentItems.filter(
    (item) => !dismissedPersonalRecents.has(item)
  );

  const groupRecents = groupRecentItems;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-1 p-6 flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-neutral-2 border-t-secondary-4 rounded-full animate-spin" />
      </div>
    );
  }

  const handleToggleGroupItemGroup = async (group) => {
    if (submitting) return;
    const userSelected = group.selections?.some((s) => s.userId === user.uid);
    const targetItemId = group.items[0]?.id;
    if (!targetItemId) return;

    setSubmitting(true);
    try {
      if (userSelected) {
        let removed = false;
        for (const item of group.items) {
          removed = await removeOneGroupLuggageSelection(tripId, item.id, user.uid);
          if (removed) break;
        }
        if (!removed) return;
        setGroupItems((prev) =>
          prev.map((entry) => {
            if (!group.items.some((g) => g.id === entry.id)) return entry;
            const selections = [...(entry.selections || [])];
            const removeIndex = selections.findIndex((s) => s.userId === user.uid);
            if (removeIndex >= 0) selections.splice(removeIndex, 1);
            return { ...entry, selections };
          })
        );
        const personalItemToRemove = personalItems.find((item) => item.item?.trim().toLowerCase() === group.label?.trim().toLowerCase() && item.userId === user.uid);
        if (personalItemToRemove) {
          await deleteUserLuggageItem(tripId, personalItemToRemove.id);
          setPersonalItems((prev) => prev.filter((item) => item.id !== personalItemToRemove.id));
        }
      } else {
        await addUserToGroupLuggageItem(tripId, targetItemId, user.uid, userName);
        const personalId = await addUserLuggageItem(tripId, user.uid, group.label);
        setGroupItems((prev) =>
          prev.map((entry) => {
            if (entry.id !== targetItemId) return entry;
            return { ...entry, selections: [...(entry.selections || []), { userId: user.uid, userName }] };
          })
        );
        setPersonalItems((prev) => [...prev, { id: personalId, item: group.label, userId: user.uid, packed: false, createdAt: new Date() }]);
      }
    } catch (err) {
      console.error('Error actualizando item grupal:', err);
      setMessage('Error al actualizar item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroupItemGroup = async (group) => {
    if (submitting) return;
    const selectionCount = group.selections?.length || 0;
    const targetItemId = group.items[0]?.id;
    if (!targetItemId) return;

    setSubmitting(true);
    try {
      let removed = false;
      let removedItemId = null;
      for (const item of group.items) {
        removed = await removeOneGroupLuggageSelection(tripId, item.id, user.uid);
        if (removed) {
          removedItemId = item.id;
          break;
        }
      }
      if (!removed) {
        setMessage('No tienes una selección en este item.');
        return;
      }

      if (selectionCount <= 1) {
        await deleteGroupLuggageItem(tripId, removedItemId);
        setGroupItems((prev) => prev.filter((entry) => entry.id !== removedItemId));
        setMessage('Item eliminado de la maleta grupal.');
        return;
      }

      setGroupItems((prev) =>
        prev.map((entry) => {
          if (entry.id !== targetItemId) return entry;
          const selections = [...(entry.selections || [])];
          const removeIndex = selections.findIndex((s) => s.userId === user.uid);
          if (removeIndex >= 0) selections.splice(removeIndex, 1);
          return { ...entry, selections };
        })
      );
      setMessage('Selección eliminada de la maleta grupal.');
    } catch (err) {
      console.error('Error eliminando item:', err);
      setMessage(`Error: ${err.message || 'Error al eliminar item.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleModalItem = (item) => {
    setModalSelection((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalSelection(new Set());
  };

  const handleRemovePersonalRecent = (item) => {
    if (personalSuggestionsSet.has(item.trim().toLowerCase())) return;
    setPendingRecentRemoval({ item, scope: 'personal' });
  };

  const handleRemoveGroupRecent = (item) => {
    setPendingRecentRemoval({ item, scope: 'group' });
  };

  const confirmRemovePersonalRecent = async () => {
    if (!pendingRecentRemoval) return;
    const { item, scope } = pendingRecentRemoval;
    if (scope === 'personal') {
      setDismissedPersonalRecents((prev) => {
        const next = new Set(prev);
        next.add(item);
        return next;
      });
    }
    if (scope === 'group') {
      const idsToRemove = groupRecentIdsByLabel[item] || [];
      if (idsToRemove.length > 0) {
        try {
          await Promise.all(idsToRemove.map((id) => deleteGroupLuggageItem(tripId, id)));
          setGroupItems((prev) => prev.filter((entry) => !idsToRemove.includes(entry.id)));
        } catch (err) {
          console.error('Error eliminando item grupal:', err);
          setMessage(`Error: ${err.message || 'Error al eliminar item.'}`);
        }
      }
    }
    setPendingRecentRemoval(null);
  };

  const applyModalSelection = (onSelect) => {
    for (const item of modalSelection) {
      onSelect(item);
    }
    closeModal();
  };

  const renderModal = (title, items, onSelect, accent = 'secondary', onRemove, canRemove) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-7/60" onClick={closeModal} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-secondary-2 bg-white shadow-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="title-h3-desktop text-neutral-7">{title}</h3>
          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-full border border-secondary-2 text-secondary-5 hover:bg-secondary-1 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-2 bg-neutral-1/40 py-8 text-center">
            <p className="body-3 text-neutral-4">No hay elementos todavía.</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map((item) => (
                <div key={item} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleModalItem(item)}
                    className={`w-full px-3 py-2 pr-10 rounded-xl border text-[12px] font-semibold transition text-left break-all ${modalSelection.has(item)
                      ? 'border-secondary-3 bg-secondary-1 text-secondary-6'
                      : 'border-secondary-2 text-secondary-5 hover:bg-secondary-1'}`}
                  >
                    <span className="line-clamp-2">{item}</span>
                  </button>
                  {onRemove && (!canRemove || canRemove(item)) && (
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      className="absolute right-2 top-2 text-neutral-5 hover:text-feedback-error-strong"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-9 px-3 rounded-xl border border-neutral-2 text-neutral-5 text-xs font-semibold hover:bg-neutral-1 transition"
              >
                Cerrar
              </button>
            <button
              type="button"
              onClick={() => applyModalSelection(onSelect)}
              disabled={modalSelection.size === 0}
              className={`h-9 px-3 rounded-xl text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${accent === 'primary' ? 'bg-primary-3 hover:bg-primary-4' : 'bg-secondary-4 hover:bg-secondary-5'}`}
            >
              Añadir
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-4 sm:p-6 flex flex-col gap-5 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maleta Personal */}
        <div>
          <h2 className="title-h3-desktop text-secondary-5 mb-4">Mi maleta personal</h2>

          <form onSubmit={handleAddPersonalItem} className="flex gap-2 mb-4">
            <input
              type="text"
              value={personalItemDraft}
              onChange={(e) => setPersonalItemDraft(e.target.value)}
              placeholder="Ej: Cepillo de dientes, documentos..."
              className="flex-1 h-10 rounded-xl border border-neutral-2 bg-white px-3 body-3 text-neutral-6 placeholder:text-neutral-3 focus:outline-none focus:ring-2 focus:ring-secondary-4"
            />
            <button
              type="submit"
              disabled={submitting || !personalItemDraft.trim()}
              className="h-10 px-4 rounded-xl bg-secondary-4 text-white body-3 font-semibold hover:bg-secondary-5 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveModal('personal-suggestions')}
              className="px-3 py-1.5 rounded-full border border-secondary-2 text-secondary-5 body-4 hover:bg-secondary-1 transition"
            >
              Sugerencias
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('personal-recents')}
              className="px-3 py-1.5 rounded-full border border-secondary-2 text-secondary-5 body-4 hover:bg-secondary-1 transition"
            >
              Recientes
            </button>
          </div>

          {groupedPersonalItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-2 bg-neutral-1/40 py-8 text-center">
              <p className="body-3 text-neutral-4">Aún no has añadido items a tu maleta</p>
            </div>
          ) : (
            <div className={`flex flex-col gap-2 ${groupedPersonalItems.length > 8 ? 'max-h-96 overflow-y-auto' : ''}`}>
              {groupedPersonalItems.map((group) => {
                const allPacked = group.items.every((it) => Boolean(it.packed));
                const itemIds = group.items.map((it) => it.id);
                const count = group.items.length;
                const removeId = itemIds[itemIds.length - 1];
                return (
                <div
                  key={group.key}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${allPacked ? 'bg-secondary-1 border-secondary-3' : 'border-neutral-1 bg-white hover:bg-neutral-1/50'}`}
                >
                  <button
                    type="button"
                    onClick={() => handleTogglePersonalPackedGroup(itemIds, !allPacked)}
                    disabled={submitting}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {allPacked && <Check className="w-5 h-5 shrink-0 text-secondary-4" />}
                    <div className="flex items-center gap-2 w-full">
                      <span className={`body-3 ${allPacked ? 'text-secondary-5' : 'text-neutral-6'} line-clamp-2 break-all flex-1 min-w-0`}>
                        {group.label}
                      </span>
                      {count > 1 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 text-center leading-none bg-secondary-2 text-secondary-6">
                          x{count}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePersonalGroupItems(removeId)}
                    disabled={submitting}
                    className="ml-2 text-neutral-4 hover:text-feedback-error-strong transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Maleta Grupal */}
        <div>
          <h2 className="title-h3-desktop text-secondary-5 mb-4"> Maleta grupal</h2>

          <form onSubmit={handleAddGroupItem} className="flex gap-2 mb-4">
            <input
              type="text"
              value={groupItemDraft}
              onChange={(e) => setGroupItemDraft(e.target.value)}
              placeholder="Ej: Planchas de pelo, tienda de campaña..."
              className="flex-1 h-10 rounded-xl border border-neutral-2 bg-white px-3 body-3 text-neutral-6 placeholder:text-neutral-3 focus:outline-none focus:ring-2 focus:ring-primary-3"
            />
            <button
              type="submit"
              disabled={submitting || !groupItemDraft.trim()}
              className="h-10 px-4 rounded-xl bg-primary-3 text-white body-3 font-semibold hover:bg-primary-4 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveModal('group-suggestions')}
              className="px-3 py-1.5 rounded-full border border-primary-2 text-primary-4 body-4 hover:bg-primary-1 transition"
            >
              Sugerencias
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('group-recents')}
              className="px-3 py-1.5 rounded-full border border-primary-2 text-primary-4 body-4 hover:bg-primary-1 transition"
            >
              Recientes
            </button>
          </div>

          {groupedGroupItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-2 bg-neutral-1/40 py-8 text-center">
              <p className="body-3 text-neutral-4">Aún no hay items en la maleta grupal</p>
            </div>
          ) : (
            <div className={`flex flex-col gap-2 ${groupedGroupItems.length > 8 ? 'max-h-96 overflow-y-auto' : ''}`}>
              {groupedGroupItems.map((group) => {
                const userSelected = group.selections?.some((s) => s.userId === user.uid);
                const selectionCount = group.selections?.length || 0;
                const uniqueUsers = [...new Set((group.selections || []).map((s) => s.userName))];

                return (
                  <div
                    key={group.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggleGroupItemGroup(group)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleGroupItemGroup(group);
                      }
                    }}
                    className={`p-3 rounded-xl border transition ${userSelected ? 'border-primary-3 bg-primary-1/40' : 'border-neutral-1 bg-white hover:bg-neutral-1/50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`body-3 font-semibold ${userSelected ? 'text-primary-4' : 'text-neutral-6'} line-clamp-2 break-all flex-1 min-w-0`}>
                            {group.label}
                          </p>
                          {selectionCount > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 leading-none bg-primary-1 text-primary-4">
                              x{selectionCount}
                            </span>
                          )}
                        </div>
                        {selectionCount > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-secondary-5">
                            <Users className="w-4 h-4 shrink-0" />
                            {uniqueUsers.join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroupItemGroup(group)}
                        disabled={submitting}
                        className="ml-2 text-neutral-4 hover:text-feedback-error-strong transition disabled:opacity-50 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-neutral-1 bg-white px-3 py-2 body-3 text-neutral-5 shadow-sm">
          {message}
        </div>
      )}

      {activeModal === 'personal-suggestions' &&
        renderModal('Sugerencias personales', personalSuggestions, handleAddPersonalSuggestion, 'secondary')}
      {activeModal === 'personal-recents' &&
        renderModal(
          'Recientes personales',
          personalRecents,
          handleAddPersonalSuggestion,
          'secondary',
          handleRemovePersonalRecent,
          (item) => !personalSuggestionsSet.has(item.trim().toLowerCase())
        )}
      {activeModal === 'group-suggestions' &&
        renderModal('Sugerencias grupales', groupSuggestions, handleAddGroupSuggestion, 'secondary')}
      {activeModal === 'group-recents' &&
        renderModal(
          'Recientes grupales',
          groupRecents,
          handleAddGroupSuggestion,
          'secondary',
          handleRemoveGroupRecent,
          (item) => groupRecentCreatorsByLabel[item]?.has(user?.uid)
        )}

      {pendingRecentRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-7/60" onClick={() => setPendingRecentRemoval(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-neutral-1 bg-white shadow-2xl p-5">
            <h3 className="title-h3-desktop text-neutral-7">Eliminar reciente</h3>
            <p className="body-3 text-neutral-5 mt-2">
              ¿Quieres eliminar "{pendingRecentRemoval.item}" de recientes?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingRecentRemoval(null)}
                className="h-9 px-3 rounded-xl border border-neutral-2 text-neutral-5 text-xs font-semibold hover:bg-neutral-1 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemovePersonalRecent}
                className="h-9 px-3 rounded-xl bg-feedback-error-strong text-white text-xs font-semibold hover:bg-feedback-error transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
