import React from 'react';

interface CloudBackdropProps {
  className?: string;
  withBottomFade?: boolean;
  subtle?: boolean;
}

export const CloudBackdrop: React.FC<CloudBackdropProps> = ({
  className = '',
  withBottomFade = true,
  subtle = false,
}) => {
  return (
    <div
      className={`cloud-backdrop ${subtle ? 'opacity-70' : ''} ${className}`}
      aria-hidden="true"
    >
      <div className="cloud-blob cloud-blob-1" />
      <div className="cloud-blob cloud-blob-2" />
      <div className="cloud-blob cloud-blob-3" />
      <div className="cloud-blob cloud-blob-4" />
      <div className="cloud-grid" />
      {withBottomFade && <div className="cloud-bottom-fade" />}
    </div>
  );
};
