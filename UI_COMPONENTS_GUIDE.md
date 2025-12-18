# UI Components & Design System Guide

This guide covers the design system, skeleton loaders, success animations, and best practices for consistent UI.

## Design System

### Spacing Scale
Use CSS variables for consistent spacing:

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 0.75rem;   /* 12px */
--spacing-lg: 1rem;      /* 16px */
--spacing-xl: 1.5rem;    /* 24px */
--spacing-2xl: 2rem;     /* 32px */
--spacing-3xl: 3rem;     /* 48px */
```

**Usage:**
```css
.my-card {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
}
```

### Border Radius
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
```

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.15);
```

### Animation Timing
```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## Skeleton Loaders

Import skeleton components:

```jsx
import {
  QuestionSkeleton,
  EventCardSkeleton,
  StatsSkeleton,
  ListSkeleton,
  Skeleton
} from './Components/SkeletonLoader';
```

### Usage Examples

**Question List Loading:**
```jsx
function QuestionsList({ questions, loading }) {
  if (loading) {
    return (
      <div>
        <QuestionSkeleton />
        <QuestionSkeleton />
        <QuestionSkeleton />
      </div>
    );
  }

  return questions.map(q => <QuestionItem key={q.id} question={q} />);
}
```

**Dashboard Stats Loading:**
```jsx
function Dashboard({ stats, loading }) {
  if (loading) return <StatsSkeleton />;

  return <StatsDisplay stats={stats} />;
}
```

**Custom Skeleton:**
```jsx
<Skeleton width="60%" height="2rem" />
<Skeleton width="100%" height="1rem" style={{ marginTop: '1rem' }} />
```

**List Skeleton:**
```jsx
<ListSkeleton count={5} />
```

---

## Success Animations & Toasts

### Toast Notifications

Import the Toast component:

```jsx
import Toast from './Components/Toast';
```

**Basic Usage:**
```jsx
function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  const handleSuccess = () => {
    setShowToast(true);
  };

  return (
    <>
      <button onClick={handleSuccess}>Save</button>

      {showToast && (
        <Toast
          title="Success!"
          message="Your changes have been saved"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
```

**Toast Types:**
```jsx
// Success (default)
<Toast type="success" title="Success!" message="Event created" />

// Error
<Toast type="error" title="Error" message="Failed to save" />

// Info
<Toast type="info" title="Info" message="Processing..." />

// Warning
<Toast type="warning" title="Warning" message="Check your input" />
```

**Custom Duration:**
```jsx
<Toast
  title="Copied!"
  duration={1500}  // 1.5 seconds
  onClose={() => setShowToast(false)}
/>
```

### Inline Success Message

```jsx
<div className="success-message">
  <div className="success-checkmark">
    <i className="fas fa-check"></i>
  </div>
  Event published successfully!
</div>
```

### Success Checkmark Only

```jsx
<div className="success-checkmark">
  <i className="fas fa-check"></i>
</div>
```

---

## Loading States

### Spinner
```jsx
<div className="loading-spinner"></div>
```

### Dots
```jsx
<div className="loading-dots">
  <span></span>
  <span></span>
  <span></span>
</div>
```

### Loading Overlay
```jsx
<div style={{ position: 'relative' }}>
  <YourContent />

  {loading && (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
    </div>
  )}
</div>
```

### Pulse Animation
```jsx
<div className="loading-pulse">
  Loading content...
</div>
```

---

## Animation Classes

### Fade In
```jsx
<div className="fade-in">
  Content fades in
</div>
```

### Slide Up
```jsx
<div className="slide-up">
  Content slides up from bottom
</div>
```

### Scale In
```jsx
<div className="scale-in">
  Content scales in with bounce
</div>
```

---

## Button Loading States

**Before:**
```jsx
<button onClick={handleSave}>Save</button>
```

**After:**
```jsx
<button onClick={handleSave} disabled={saving}>
  {saving ? (
    <>
      <div className="loading-spinner" style={{ marginRight: '8px' }}></div>
      Saving...
    </>
  ) : (
    'Save'
  )}
</button>
```

---

## Best Practices

### 1. **Always Show Loading States**
```jsx
// ❌ Bad - No loading state
function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  return data.map(...);
}

// ✅ Good - Clear loading state
function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <QuestionSkeleton />;
  return data.map(...);
}
```

### 2. **Provide Success Feedback**
```jsx
// ❌ Bad - Silent save
const handleSave = async () => {
  await saveData();
};

// ✅ Good - Clear feedback
const handleSave = async () => {
  setSaving(true);
  try {
    await saveData();
    setShowToast(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setSaving(false);
  }
};
```

### 3. **Use Consistent Spacing**
```jsx
// ❌ Bad - Magic numbers
<div style={{ padding: '17px', margin: '23px' }}>

// ✅ Good - Design system variables
<div style={{
  padding: 'var(--spacing-xl)',
  margin: 'var(--spacing-2xl)'
}}>
```

### 4. **Match Animation Duration**
```css
/* All cards should use same duration */
.card {
  transition: all var(--duration-normal) var(--ease-in-out);
}
```

---

## Quick Reference

### Import Design System
```jsx
import './Components/design-system.css';
```

### Import Components
```jsx
import Toast from './Components/Toast';
import { QuestionSkeleton, Skeleton } from './Components/SkeletonLoader';
```

### Common Patterns

**Form Submission:**
```jsx
const [saving, setSaving] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  try {
    await saveData();
    setShowSuccess(true);
  } catch (error) {
    // Handle error
  } finally {
    setSaving(false);
  }
};

return (
  <>
    <form onSubmit={handleSubmit}>
      <button disabled={saving}>
        {saving ? <div className="loading-spinner" /> : 'Save'}
      </button>
    </form>

    {showSuccess && (
      <Toast
        title="Saved!"
        onClose={() => setShowSuccess(false)}
      />
    )}
  </>
);
```

**Data Fetching:**
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

if (loading) return <QuestionSkeleton />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```
