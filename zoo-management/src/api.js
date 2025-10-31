const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export async function fetchFoodItems() {
  const res = await fetch(`${API_BASE}/food`);
  if (!res.ok) throw new Error("Failed to fetch food data");
  return res.json();
}

export async function fetchGiftItems() {
  const res = await fetch(`${API_BASE}/gifts`);
  if (!res.ok) throw new Error("Failed to fetch gift shop data");
  return res.json();
}

export async function fetchVets() {
  const res = await fetch(`${API_BASE}/vets`);
  if (!res.ok) throw new Error("Failed to fetch vets data");
  return res.json();
}

export async function fetchZookeepers() {
  const res = await fetch(`${API_BASE}/zookeepers`);
  if (!res.ok) throw new Error("Failed to fetch zookeepers data");
  return res.json();
}
