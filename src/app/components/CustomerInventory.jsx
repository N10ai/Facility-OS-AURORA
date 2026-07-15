import { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Building2, PackageCheck, Search } from 'lucide-react';

export function CustomerInventory({ profile, data }) {
  const [facilityId, setFacilityId] = useState('all');
  const [query, setQuery] = useState('');
  const facilities = (data.facilities || []).filter(f => f.customer_id === profile.customer_id);
  const facilityIds = new Set(facilities.map(f => f.id));

  const rows = useMemo(() => (data.inventory || []).filter(row =>
    facilityIds.has(row.facility_id) &&
    (facilityId === 'all' || row.facility_id === facilityId)
  ).map(row => {
    const supply = (data.supplies || []).find(item => item.id === row.supply_item_id);
    const facility = facilities.find(item => item.id === row.facility_id);
    const quantity = Number(row.quantity_on_hand || 0);
    const reorder = Number(row.reorder_level || 0);
    const status = quantity <= 0 ? 'out' : quantity <= reorder ? 'low' : 'in-stock';
    return { ...row, supply, facility, quantity, reorder, status };
  }).filter(row => `${row.supply?.name || ''} ${row.supply?.category || ''} ${row.facility?.name || ''}`.toLowerCase().includes(query.toLowerCase())), [data.inventory, data.supplies, facilityId, query, profile.customer_id]);

  const low = rows.filter(row => row.status !== 'in-stock').length;

  return <div className="page customerInventoryPage">
    <div className="pageHeader"><div><p className="eyebrow">Customer portal</p><h1>Inventory</h1><p>Current cleaning supplies and consumables across your facilities.</p></div></div>
    <div className="stats">
      <div className="stat"><Boxes size={19}/><strong>{rows.length}</strong><span>Tracked items</span><small>Visible inventory</small></div>
      <div className="stat"><Building2 size={19}/><strong>{facilities.length}</strong><span>Facilities</span><small>With customer access</small></div>
      <div className="stat pastelYellow"><AlertTriangle size={19}/><strong>{low}</strong><span>Need attention</span><small>Low or out of stock</small></div>
      <div className="stat pastelGreen"><PackageCheck size={19}/><strong>{rows.filter(row => row.status === 'in-stock').length}</strong><span>In stock</span><small>Above reorder level</small></div>
    </div>
    <section className="panel customerInventoryToolbar">
      <label><Building2 size={17}/><select value={facilityId} onChange={event => setFacilityId(event.target.value)}><option value="all">All facilities</option>{facilities.map(facility => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
      <label className="customerInventorySearch"><Search size={17}/><input placeholder="Search inventory" value={query} onChange={event => setQuery(event.target.value)}/></label>
    </section>
    <section className="customerInventoryGrid">
      {rows.map(row => <article className="customerInventoryCard" key={row.id}>
        <div className="customerInventoryCardHead"><div className="inventoryObjectIcon"><Boxes size={20}/></div><span className={`customerStockStatus ${row.status}`}>{row.status === 'in-stock' ? 'In stock' : row.status === 'low' ? 'Low' : 'Out'}</span></div>
        <h2>{row.supply?.name || 'Supply item'}</h2>
        <p>{row.facility?.name || 'Facility'} · {row.storage_location || 'Location not set'}</p>
        <div className="customerInventoryQuantity"><strong>{row.quantity}</strong><span>{row.supply?.unit || 'units'}</span></div>
        <div className="customerInventoryMeta"><span>Reorder at {row.reorder}</span><span>Target {row.target_level || '—'}</span></div>
      </article>)}
      {!rows.length && <div className="panel customerInventoryEmpty"><Boxes size={30}/><strong>No inventory found</strong><span>Inventory assigned to your facilities will appear here.</span></div>}
    </section>
  </div>;
}
