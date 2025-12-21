// src/Components/SkeletonLoader.jsx
import React from 'react';
import './design-system.css';

// Question Card Skeleton
export function QuestionSkeleton() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div className="skeleton skeleton-avatar"></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text skeleton-text-short"></div>
          <div className="skeleton skeleton-text" style={{ width: '30%', height: '0.75rem' }}></div>
        </div>
      </div>
      <div className="skeleton skeleton-text skeleton-text-long"></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
    </div>
  );
}

// Event Card Skeleton
export function EventCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text skeleton-text-long"></div>
      <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <div className="skeleton skeleton-button"></div>
        <div className="skeleton skeleton-button"></div>
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '0.75rem' }}></div>
          <div className="skeleton skeleton-title" style={{ width: '40%', height: '2.5rem' }}></div>
        </div>
      ))}
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="skeleton skeleton-avatar"></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text skeleton-text-short"></div>
            <div className="skeleton skeleton-text" style={{ width: '40%', height: '0.75rem' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic Skeleton
export function Skeleton({ width, height, style, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        ...style
      }}
    ></div>
  );
}
