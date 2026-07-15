import { useMemo, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';

function Score({ value }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="customerReportScore"><strong>{Math.round(score)}</strong><span>/100</span></div>;
}

export function CustomerReportGallery({ profile, data }) {
  const [viewer, setViewer] = useState(null);
  const reports = useMemo(() => (data.inspections || [])
    .filter(item => item.status === 'completed' && (!profile.customer_id || item.customer_id === profile.customer_id))
    .sort((a, b) => (b.inspected_at || b.created_at || '').localeCompare(a.inspected_at || a.created_at || '')), [data.inspections, profile.customer_id]);

  return <div className="page customerReportsV39">
    <div className="pageHeader"><div><p className="eyebrow">Quality reports</p><h1>Service reports</h1><p>Open verified results, inspect every photo clearly, and review quality by area.</p></div></div>
    <div className="customerReportStack">
      {reports.map(report => {
        const facility = (data.facilities || []).find(item => item.id === report.facility_id);
        const areas = (data.inspectionAreas || []).filter(item => item.inspection_id === report.id);
        const photos = (data.inspectionPhotos || []).filter(item => item.inspection_id === report.id);
        return <article className="customerReportCard" key={report.id}>
          <header><div><p className="eyebrow">{report.inspected_at ? new Date(report.inspected_at).toLocaleDateString() : 'Verified service'}</p><h2>{facility?.name || report.title}</h2><p>{report.summary || 'Inspection completed and released by management.'}</p></div><Score value={report.overall_score}/></header>
          <div className="customerReportFacts"><span><ShieldCheck size={17}/><b>Verified</b></span><span><CheckCircle2 size={17}/><b>{areas.filter(area => area.status === 'passed').length}/{areas.length}</b> areas passed</span><span><ImageIcon size={17}/><b>{photos.length}</b> photos</span></div>
          <div className="customerAreaScores">{areas.map(area => <div className={`customerAreaScore ${area.status}`} key={area.id}><span>{area.area_name}</span><strong>{Math.round(Number(area.score || 0))}%</strong></div>)}</div>
          {!!photos.length && <div className="customerReportPhotos">{photos.map((photo, index) => <button key={photo.id || index} onClick={() => setViewer({ photos, index })}><img src={photo.file_url || photo.public_url || photo.url} alt={photo.photo_type || 'Service evidence'}/><span>{photo.photo_type || 'photo'}</span></button>)}</div>}
        </article>;
      })}
      {!reports.length && <section className="panel customerReportEmpty"><ShieldCheck size={28}/><h2>No verified reports yet</h2><p>Completed and approved inspections will appear here.</p></section>}
    </div>
    {viewer && <PhotoLightbox photos={viewer.photos} initialIndex={viewer.index} onClose={() => setViewer(null)}/>} 
  </div>;
}
