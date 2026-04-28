import { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { Plus, Trash2, X } from 'lucide-react';
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

  const userName = profile?.displayName || profile?.firstName || user?.email || 'Usuario';

  const personalSuggestions = [
    'Documentación',
    'Cargador móvil',
    'Cepillo de dientes',
    'Medicinas',
    'Ropa interior',
    'Neceser',
  ];

  const groupSuggestions = [
    'Adaptador universal',
    'Botiquín',
    'Power bank',
    'Protector solar',
    'Toalla de playa',
    'Altavoz',
  ];

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
      setGroupItems((prev) => [
        ...prev,
        { id, item: trimmed, createdAt: new Date(), selections: [{ userId: user.uid, userName }] },
      ]);
      setGroupItemDraft('');
      setMessage('Item añadido a la maleta grupal.');
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
      setGroupItems((prev) => [
        ...prev,
        { id, item, createdAt: new Date(), selections: [{ userId: user.uid, userName }] },
      ]);
      setMessage('Item añadido a la maleta grupal.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error añadiendo item grupal:', err);
      setMessage(`Error: ${err.message || 'Error al añadir item.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-1 p-6 flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-neutral-2 border-t-secondary-4 rounded-full animate-spin" />
      </div>
    );
  }

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
      } else {
        await addUserToGroupLuggageItem(tripId, targetItemId, user.uid, userName);
        setGroupItems((prev) =>
          prev.map((entry) => {
            if (entry.id !== targetItemId) return entry;
            return { ...entry, selections: [...(entry.selections || []), { userId: user.uid, userName }] };
          })
        );
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

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-4 sm:p-6 flex flex-col gap-5 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maleta Personal */}
        <div>
          <h2 className="title-h3-desktop text-secondary-5 mb-4">🧳 Mi maleta personal</h2>

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
            {personalSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleAddPersonalSuggestion(item)}
                disabled={submitting}
                className="px-3 py-1.5 rounded-full border border-neutral-2 text-neutral-5 body-4 hover:bg-neutral-1 transition disabled:opacity-50"
              >
                {item}
              </button>
            ))}
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
                    <span className={`w-2.5 h-2.5 rounded-full ${allPacked ? 'bg-secondary-4' : 'bg-neutral-2'}`} />
                    <span className={`body-3 ${allPacked ? 'text-secondary-5' : 'text-neutral-6'}`}>
                      {group.label}
                    </span>
                    {count > 1 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center leading-none bg-secondary-2 text-secondary-6">
                        x{count}
                      </span>
                    )}
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
          <h2 className="title-h3-desktop text-secondary-5 mb-4">👥 Maleta grupal</h2>

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
            {groupSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleAddGroupSuggestion(item)}
                disabled={submitting}
                className="px-3 py-1.5 rounded-full border border-neutral-2 text-neutral-5 body-4 hover:bg-neutral-1 transition disabled:opacity-50"
              >
                {item}
              </button>
            ))}
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
                        <p className={`body-3 font-semibold ${userSelected ? 'text-primary-4' : 'text-neutral-6'}`}>
                          {group.label}
                        </p>
                        {selectionCount > 0 && (
                          <div className="mt-1.5 flex flex-col gap-1">
                            {uniqueUsers.map((name, idx) => (
                              <div key={idx} className="text-[11px] font-semibold text-primary-4">
                                {name}
                              </div>
                            ))}
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full w-fit leading-none bg-primary-1 text-primary-4">
                              x{selectionCount}
                            </span>
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
    </div>
  );
}
