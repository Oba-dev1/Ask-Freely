// src/Components/ProgramBuilder.jsx
import React, { useState, useEffect } from 'react';
import { ref, push, set, onValue, update, remove } from 'firebase/database';
import { database } from '../Firebase/config';

function ProgramBuilder({ eventId, eventTitle }) {
  const [programItems, setProgramItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 10,
    type: 'segment',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  // Load program items from Firebase
  useEffect(() => {
    if (!eventId) return;

    const programRef = ref(database, `programs/${eventId}`);
    const unsubscribe = onValue(programRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => a.order - b.order);
        setProgramItems(items);
      } else {
        setProgramItems([]);
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = async () => {
    if (!formData.title.trim()) return;

    if (!eventId) {
      console.error('No eventId provided');
      alert('Error: Event ID is missing. Cannot add program item.');
      return;
    }

    setLoading(true);
    try {
      const programRef = ref(database, `programs/${eventId}`);
      const newItemRef = push(programRef);

      console.log('Adding program item to:', `programs/${eventId}`);

      await set(newItemRef, {
        title: formData.title,
        description: formData.description || '',
        duration: parseInt(formData.duration) || 10,
        type: formData.type,
        notes: formData.notes || '',
        order: programItems.length,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      console.log('Program item added successfully');

      // Reset form
      setFormData({
        title: '',
        description: '',
        duration: 10,
        type: 'segment',
        notes: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding program item:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`Failed to add program item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !formData.title.trim()) return;

    setLoading(true);
    try {
      await update(ref(database, `programs/${eventId}/${editingItem.id}`), {
        title: formData.title,
        description: formData.description || '',
        duration: parseInt(formData.duration) || 10,
        type: formData.type,
        notes: formData.notes || ''
      });

      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        duration: 10,
        type: 'segment',
        notes: ''
      });
    } catch (error) {
      console.error('Error updating program item:', error);
      alert('Failed to update program item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this program item?')) return;

    setLoading(true);
    try {
      await remove(ref(database, `programs/${eventId}/${itemId}`));

      // Reorder remaining items
      const remainingItems = programItems
        .filter(item => item.id !== itemId)
        .sort((a, b) => a.order - b.order);

      for (let i = 0; i < remainingItems.length; i++) {
        await update(ref(database, `programs/${eventId}/${remainingItems[i].id}`), {
          order: i
        });
      }
    } catch (error) {
      console.error('Error deleting program item:', error);
      alert('Failed to delete program item');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveItem = async (itemId, direction) => {
    const currentIndex = programItems.findIndex(item => item.id === itemId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === programItems.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const itemA = programItems[currentIndex];
    const itemB = programItems[newIndex];

    setLoading(true);
    try {
      await update(ref(database, `programs/${eventId}/${itemA.id}`), { order: newIndex });
      await update(ref(database, `programs/${eventId}/${itemB.id}`), { order: currentIndex });
    } catch (error) {
      console.error('Error reordering items:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      duration: item.duration,
      type: item.type,
      notes: item.notes || ''
    });
    setShowAddForm(true);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      duration: 10,
      type: 'segment',
      notes: ''
    });
    setShowAddForm(false);
  };

  const getTotalDuration = () => {
    return programItems.reduce((total, item) => total + (item.duration || 0), 0);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'segment': return '📋';
      case 'qa': return '❓';
      case 'break': return '☕';
      case 'performance': return '🎤';
      default: return '📌';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'segment': return 'Segment';
      case 'qa': return 'Q&A Session';
      case 'break': return 'Break';
      case 'performance': return 'Performance';
      default: return 'Other';
    }
  };

  return (
    <div className="bg-white border border-black/10 rounded-[20px] p-10 lg:p-8 md:p-6 mt-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4 lg:flex-col lg:items-start">
        <div>
          <h3 className="m-0 mb-2 text-[1.6rem] md:text-[1.4rem] text-neutral-800 font-bold">Event Program</h3>
          <p className="m-0 text-neutral-500 text-[0.95rem]">Build the flow for your event and share with your MC</p>
        </div>
        <div className="flex gap-4 items-center md:w-full md:justify-between">
          <span className="inline-flex items-center gap-2 py-2 px-4 bg-primary/10 border border-primary/25 rounded-[20px] text-primary text-[0.9rem] md:text-[0.85rem] font-semibold">
            <i className="fas fa-list text-[0.85rem]"></i> {programItems.length} items
          </span>
          <span className="inline-flex items-center gap-2 py-2 px-4 bg-primary/10 border border-primary/25 rounded-[20px] text-primary text-[0.9rem] md:text-[0.85rem] font-semibold">
            <i className="fas fa-clock text-[0.85rem]"></i> {getTotalDuration()} mins
          </span>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-primary/[0.03] border border-primary/15 rounded-[14px] p-7 md:p-5 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="m-0 text-[1.2rem] text-neutral-800 font-semibold">{editingItem ? 'Edit Program Item' : 'Add Program Item'}</h4>
            <button onClick={cancelEditing} className="bg-transparent border-none text-neutral-500 text-2xl cursor-pointer w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-black/[0.05] hover:text-neutral-800">✕</button>
          </div>

          <div className="mb-5">
            <label htmlFor="title" className="block font-semibold mb-2 text-neutral-800 text-[0.875rem]">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Opening Prayer, Panel Discussion"
              required
              className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-5">
            <div className="mb-5">
              <label htmlFor="type" className="block font-semibold mb-2 text-neutral-800 text-[0.875rem]">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full py-3 px-4 pr-10 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%27http://www.w3.org/2000/svg%27_width=%2712%27_height=%2712%27_viewBox=%270_0_12_12%27%3E%3Cpath_fill=%27%23666%27_d=%27M6_9L1_4h10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
              >
                <option value="segment">Segment</option>
                <option value="qa">Q&A Session</option>
                <option value="break">Break</option>
                <option value="performance">Performance</option>
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="duration" className="block font-semibold mb-2 text-neutral-800 text-[0.875rem]">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                max="300"
                className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="description" className="block font-semibold mb-2 text-neutral-800 text-[0.875rem]">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              placeholder="Brief description of this segment"
              className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all min-h-[80px] resize-y leading-relaxed placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="notes" className="block font-semibold mb-2 text-neutral-800 text-[0.875rem]">Notes for MC</label>
            <input
              type="text"
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="e.g., Introduce guest speaker, transition to video"
              className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
            />
          </div>

          <div className="flex gap-3 justify-end md:flex-col">
            <button onClick={cancelEditing} className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-neutral-200 text-neutral-500 bg-white md:w-full hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={editingItem ? handleUpdateItem : handleAddItem}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-primary text-white bg-gradient-to-br from-primary to-orange-500 shadow-[0_2px_8px_rgba(255,107,53,0.2)] md:w-full hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {/* Add Item Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full p-4 bg-primary/[0.05] border-2 border-dashed border-primary/25 rounded-xl text-primary text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 mb-6 hover:bg-primary/10 hover:border-primary/40"
        >
          <i className="fas fa-plus-circle text-lg"></i> Add Program Item
        </button>
      )}

      {/* Program Items List */}
      {programItems.length > 0 ? (
        <div className="flex flex-col gap-4">
          {programItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[40px_1fr_auto] md:grid-cols-1 gap-4 items-start bg-white border border-black/[0.08] rounded-xl p-5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-primary/[0.02] hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(255,107,53,0.08)]">
              <div className="w-10 h-10 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-base md:text-[0.9rem] flex-shrink-0">{index + 1}</div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-3 gap-4 flex-wrap md:flex-col md:items-start">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[1.5rem] flex-shrink-0">{getTypeIcon(item.type)}</span>
                    <h4 className="m-0 text-[1.1rem] md:text-base text-neutral-800 font-semibold break-words">{item.title}</h4>
                    <span className="py-1 px-3 bg-primary/[0.12] border border-primary/25 rounded-xl text-primary text-[0.75rem] font-semibold uppercase tracking-wide whitespace-nowrap flex-shrink-0">{getTypeLabel(item.type)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-neutral-500 text-[0.9rem] font-medium whitespace-nowrap flex-shrink-0">
                    <i className="fas fa-clock text-[0.85rem]"></i> {item.duration} min
                  </span>
                </div>

                {item.description && (
                  <p className="m-0 mb-3 text-neutral-600 text-[0.95rem] leading-relaxed">{item.description}</p>
                )}

                {item.notes && (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 text-amber-900 text-[0.9rem] flex items-start gap-2">
                    <i className="fas fa-sticky-note text-amber-500 mt-0.5 flex-shrink-0"></i> <strong className="text-amber-950">MC Note:</strong> {item.notes}
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-2 flex-shrink-0 md:w-full md:justify-end">
                <button
                  onClick={() => handleMoveItem(item.id, 'up')}
                  disabled={index === 0 || loading}
                  className="w-9 h-9 bg-black/[0.03] border border-black/10 rounded-lg text-neutral-500 cursor-pointer transition-all flex items-center justify-center text-[0.9rem] hover:bg-primary/10 hover:border-primary/30 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <i className="fas fa-arrow-up"></i>
                </button>
                <button
                  onClick={() => handleMoveItem(item.id, 'down')}
                  disabled={index === programItems.length - 1 || loading}
                  className="w-9 h-9 bg-black/[0.03] border border-black/10 rounded-lg text-neutral-500 cursor-pointer transition-all flex items-center justify-center text-[0.9rem] hover:bg-primary/10 hover:border-primary/30 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <i className="fas fa-arrow-down"></i>
                </button>
                <button
                  onClick={() => startEditing(item)}
                  className="w-9 h-9 bg-black/[0.03] border border-black/10 rounded-lg text-neutral-500 cursor-pointer transition-all flex items-center justify-center text-[0.9rem] hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                  title="Edit"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={loading}
                  className="w-9 h-9 bg-black/[0.03] border border-black/10 rounded-lg text-neutral-500 cursor-pointer transition-all flex items-center justify-center text-[0.9rem] hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showAddForm && (
        <div className="text-center py-12 px-4 text-neutral-500">
          <div className="text-[4rem] mb-4 opacity-30">📋</div>
          <h4 className="m-0 mb-2 text-neutral-600 text-[1.2rem] font-semibold">No program items yet</h4>
          <p className="m-0 text-[0.95rem]">Add program items to create the flow for your event</p>
        </div>
      )}
    </div>
  );
}

export default ProgramBuilder;
