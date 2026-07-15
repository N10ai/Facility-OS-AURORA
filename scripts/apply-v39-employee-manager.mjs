import fs from 'node:fs';

const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

function replaceOnce(from,to,label){
  if(!app.includes(from)) throw new Error(`Missing marker: ${label}`);
  app=app.replace(from,to);
}

if(!app.includes('const [managerPhotoIndex,setManagerPhotoIndex]')){
  replaceOnce(
    "  const [verification,setVerification]=useState({summary:'Service completed according to the facility plan.',quality_score:100,return_note:''});",
    "  const [verification,setVerification]=useState({summary:'Service completed according to the facility plan.',quality_score:100,return_note:''});\n  const [managerPhotoIndex,setManagerPhotoIndex]=useState(null);",
    'manager photo state'
  );
  replaceOnce(
    "    const usage=data.supplyUsage.filter(item=>item.work_order_id===current.id);",
    "    const usage=data.supplyUsage.filter(item=>item.work_order_id===current.id);\n    const relatedInspections=data.inspections.filter(i=>i.work_order_id===current.id);\n    const managerPhotos=data.inspectionPhotos.filter(p=>relatedInspections.some(i=>i.id===p.inspection_id));",
    'manager photo collection'
  );
  replaceOnce(
    "      {current.status==='awaiting_verification'&&<section className=\"panel verificationPanel\">",
    "      {managerPhotos.length>0&&<section className=\"panel managerPhotoReview\"><div className=\"panelTitle\"><div><p className=\"eyebrow\">Evidence review</p><h2>Inspection photos</h2></div><span>{managerPhotos.length}</span></div><div className=\"missionPhotoGrid\">{managerPhotos.map((photo,index)=><button key={photo.id||index} onClick={()=>setManagerPhotoIndex(index)}><img src={photo.file_url||photo.public_url||photo.url} alt={photo.photo_type||'Inspection evidence'}/><span>{photo.photo_type||'photo'}</span></button>)}</div></section>}\n      {managerPhotoIndex!==null&&<PhotoLightbox photos={managerPhotos} initialIndex={managerPhotoIndex} onClose={()=>setManagerPhotoIndex(null)}/>}\n      {current.status==='awaiting_verification'&&<section className=\"panel verificationPanel\">",
    'manager photo review'
  );
}

const styles=`

/* Aurora v3.9 manager evidence review */
.managerPhotoReview{margin-top:16px}
`;
if(!css.includes('Aurora v3.9 manager evidence review')) css+=styles;

fs.writeFileSync(appPath,app);
fs.writeFileSync(cssPath,css);
console.log('Applied Aurora v3.9 manager evidence review.');
