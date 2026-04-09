/**
 * SkeletonLoader Component
 * Premium loading placeholder like Blinkit/Zepto
 */

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'product':
        return (
          <div className="skeleton-product">
            <div className="skeleton-image" />
            <div className="p-4">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              <div className="flex justify-between items-center mt-4">
                <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 20 }} />
              </div>
            </div>
          </div>
        );

      case 'shop':
        return (
          <div className="skeleton-shop">
            <div className="skeleton" style={{ height: 120, borderRadius: '12px 12px 0 0' }} />
            <div className="p-4">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="flex gap-4 mt-3">
                <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        );

      case 'order':
        return (
          <div className="skeleton-order">
            <div className="flex items-center gap-4 p-4">
              <div className="skeleton skeleton-avatar" />
              <div className="flex-1">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" style={{ width: '50%' }} />
              </div>
              <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 12 }} />
            </div>
          </div>
        );

      case 'stat':
        return (
          <div className="skeleton-stat p-6">
            <div className="flex justify-between">
              <div>
                <div className="skeleton skeleton-text" style={{ width: 80, marginBottom: 8 }} />
                <div className="skeleton skeleton-title" style={{ width: 60 }} />
              </div>
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
            </div>
          </div>
        );

      case 'text':
        return <div className="skeleton skeleton-text" />;

      case 'avatar':
        return <div className="skeleton skeleton-avatar" />;

      case 'image':
        return <div className="skeleton skeleton-image" />;

      case 'card':
      default:
        return (
          <div className="skeleton-card">
            <div className="skeleton" style={{ height: 160 }} />
            <div className="p-4">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            </div>
          </div>
        );
    }
  };

  // Render multiple skeletons
  if (count > 1) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            {renderSkeleton()}
          </div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
};

export default SkeletonLoader;
