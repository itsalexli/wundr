import React from 'react';

interface InventoryProps {
  onClose: () => void;
  items?: string[]; // Placeholder for now
  onUseItem?: (item: string, index: number) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ onClose, items = [], onUseItem }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#8B4513', // Brown background as requested contextually (leather/wood feel)
        padding: '30px',
        borderRadius: '15px',
        border: '4px solid #D2691E',
        width: '80%',
        maxWidth: '600px',
        minHeight: '400px',
        color: 'white',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ 
          textAlign: 'center', 
          marginTop: 0, 
          marginBottom: '20px',
          fontFamily: 'serif',
          fontSize: '32px',
          textShadow: '2px 2px 0px #3E2723'
        }}>
          🎒 Inventory
        </h2>

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {/* Content Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '15px',
          padding: '10px'
        }}>
          {items.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '40px',
              color: '#deb887' 
            }}>
              Your inventory is empty.
            </div>
          ) : (
            items.map((item, index) => (
              <div 
                key={index} 
                onClick={() => onUseItem?.(item, index)}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  aspectRatio: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid #D2691E',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src={item} alt="Item" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              </div>
            ))
          )}
          
          {/* Filler slots to look like a grid */}
          {Array.from({ length: Math.max(0, 12 - items.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              aspectRatio: '1',
              border: '1px dashed #A0522D'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
};
