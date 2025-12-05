// src/Components/ProgramBuilder.jsx
import React, { useState, useEffect } from 'react';
import { ref, push, set, onValue, update, remove } from 'firebase/database';
import { database } from '../Firebase/config';
import './ProgramBuilder.css';

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

    setLoading(true);
    try {
      const programRef = ref(database, `programs/${eventId}`);
      const newItemRef = push(programRef);

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
      alert('Failed to add program item');
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
    <div className="program-builder">
      <div className="program-header">
        <div>
          <h3>Event Program</h3>
          <p className="program-subtitle">Build the flow for your event and share with your MC</p>
        </div>
        <div className="program-stats">
          <span className="stat-badge">
            <i className="fas fa-list"></i> {programItems.length} items
          </span>
          <span className="stat-badge">
            <i className="fas fa-clock"></i> {getTotalDuration()} mins
          </span>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="program-form-card">
          <div className="form-header">
            <h4>{editingItem ? 'Edit Program Item' : 'Add Program Item'}</h4>
            <button onClick={cancelEditing} className="btn-close-form">✕</button>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Opening Prayer, Panel Discussion"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="segment">Segment</option>
                <option value="qa">Q&A Session</option>
                <option value="break">Break</option>
                <option value="performance">Performance</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                max="300"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              placeholder="Brief description of this segment"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes for MC</label>
            <input
              type="text"
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="e.g., Introduce guest speaker, transition to video"
            />
          </div>

          <div className="form-actions">
            <button onClick={cancelEditing} className="event-btn event-btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={editingItem ? handleUpdateItem : handleAddItem}
              className="event-btn event-btn-primary"
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
          className="btn-add-program-item"
        >
          <i className="fas fa-plus-circle"></i> Add Program Item
        </button>
      )}

      {/* Program Items List */}
      {programItems.length > 0 ? (
        <div className="program-items-list">
          {programItems.map((item, index) => (
            <div key={item.id} className="program-item">
              <div className="item-order">{index + 1}</div>

              <div className="item-content">
                <div className="item-header">
                  <div className="item-title-section">
                    <span className="item-icon">{getTypeIcon(item.type)}</span>
                    <h4>{item.title}</h4>
                    <span className="item-type-badge">{getTypeLabel(item.type)}</span>
                  </div>
                  <span className="item-duration">
                    <i className="fas fa-clock"></i> {item.duration} min
                  </span>
                </div>

                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}

                {item.notes && (
                  <div className="item-notes">
                    <i className="fas fa-sticky-note"></i> <strong>MC Note:</strong> {item.notes}
                  </div>
                )}
              </div>

              <div className="item-actions">
                <button
                  onClick={() => handleMoveItem(item.id, 'up')}
                  disabled={index === 0 || loading}
                  className="btn-item-action"
                  title="Move up"
                >
                  <i className="fas fa-arrow-up"></i>
                </button>
                <button
                  onClick={() => handleMoveItem(item.id, 'down')}
                  disabled={index === programItems.length - 1 || loading}
                  className="btn-item-action"
                  title="Move down"
                >
                  <i className="fas fa-arrow-down"></i>
                </button>
                <button
                  onClick={() => startEditing(item)}
                  className="btn-item-action"
                  title="Edit"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={loading}
                  className="btn-item-action btn-delete"
                  title="Delete"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showAddForm && (
        <div className="empty-program-state">
          <div className="empty-icon">📋</div>
          <h4>No program items yet</h4>
          <p>Add program items to create the flow for your event</p>
        </div>
      )}
    </div>
  );
}

export default ProgramBuilder;
