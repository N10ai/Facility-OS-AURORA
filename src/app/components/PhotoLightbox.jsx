import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';

export function PhotoLightbox({ photos = [], initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const photo = photos[index];

  useEffect(() => {
    function keydown(event) {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft') setIndex(value => (value - 1 + photos.length) % photos.length);
      if (event.key === 'ArrowRight') setIndex(value => (value + 1) % photos.length);
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [photos.length, onClose]);

  useEffect(() => setZoom(1), [index]);
  if (!photo) return null;

  const source = photo.public_url || photo.url || photo.file_url || photo.storage_url;
  const previous = () => setIndex(value => (value - 1 + photos.length) % photos.length);
  const next = () => setIndex(value => (value + 1) % photos.length);

  return <div className="photoLightbox" role="dialog" aria-modal="true" onClick={onClose}>
    <header onClick={event => event.stopPropagation()}>
      <div><strong>{photo.area_name || photo.proof_type || 'Service photo'}</strong><span>{index + 1} of {photos.length}</span></div>
      <div className="photoLightboxActions">
        <button onClick={() => setZoom(value => Math.max(1, value - .5))}><ZoomOut size={19}/></button>
        <button onClick={() => setZoom(value => Math.min(4, value + .5))}><ZoomIn size={19}/></button>
        {source && <a href={source} target="_blank" rel="noreferrer"><Download size={19}/></a>}
        <button onClick={onClose}><X size={21}/></button>
      </div>
    </header>
    <button className="photoLightboxNav previous" onClick={event => { event.stopPropagation(); previous(); }}><ChevronLeft size={30}/></button>
    <div className="photoLightboxStage" onClick={event => event.stopPropagation()}>
      <img src={source} alt={photo.caption || photo.proof_type || 'Service proof'} style={{ transform: `scale(${zoom})` }}/>
    </div>
    <button className="photoLightboxNav next" onClick={event => { event.stopPropagation(); next(); }}><ChevronRight size={30}/></button>
    <footer onClick={event => event.stopPropagation()}>
      <span>{photo.proof_type ? photo.proof_type.replaceAll('_', ' ') : 'Photo'}</span>
      <span>{photo.created_at ? new Date(photo.created_at).toLocaleString() : ''}</span>
    </footer>
  </div>;
}
