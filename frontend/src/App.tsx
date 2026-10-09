import { FormEvent, useCallback, useEffect, useState } from "react";

const API = "http://localhost:8000/api/v1";

type Product = {
  id: number;
  sku: string;
  name: string;
  unit: string;
  min_stock: string;
  is_active: boolean;
  created_at: string;
};

type Balance = {
  product_id: number;
  sku: string;
  name: string;
  unit: string;
  balance: string;
  min_stock: string;
};

type Movement = {
  id: number;
  product_id: number;
  quantity_delta: string;
  reason: string;
  created_at: string;
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("adet");
  const [minStock, setMinStock] = useState("0");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("Sayım / başlangıç stoğu");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, bRes, mRes] = await Promise.all([
        fetch(`${API}/products`),
        fetch(`${API}/stock/balances`),
        fetch(`${API}/stock/movements`),
      ]);
      if (!pRes.ok || !bRes.ok || !mRes.ok) throw new Error("API yanıt vermedi.");
      const [p, b, m] = await Promise.all([pRes.json(), bRes.json(), mRes.json()]);
      setProducts(p);
      setBalances(b);
      setMovements(m);
      setSelectedProduct((current) => current || (p[0] ? String(p[0].id) : ""));
      setError("");
    } catch {
      setError("Sunucuya bağlanılamadı. Docker servislerinin çalıştığını kontrol edin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, name, unit, min_stock: minStock }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Ürün eklenemedi.");
      setSku(""); setName(""); setUnit("adet"); setMinStock("0");
      setSelectedProduct(String(body.id));
      setNotice("Ürün başarıyla eklendi.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beklenmeyen hata.");
    }
  }

  async function addMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API}/stock/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: Number(selectedProduct),
          quantity_delta: quantity,
          reason,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Stok hareketi eklenemedi.");
      setNotice("Stok hareketi kaydedildi.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beklenmeyen hata.");
    }
  }

  const moneylessNumber = (value: string) =>
    Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 3 });

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandmark">TS</div>
        <div>
          <p className="eyebrow">İŞLETME YÖNETİMİ · MVP</p>
          <h1>Toptan Stok</h1>
        </div>
        <div className="status"><span /> Geliştirme sürümü</div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">STOK KONTROL MERKEZİ</p>
          <h2>Ürünlerini ve stok hareketlerini tek yerden yönet.</h2>
          <p className="muted">İlk sürüm: ürün kartları, stok giriş/çıkış hareketleri ve anlık bakiye.</p>
        </div>
        <div className="intro-icon" aria-hidden="true">▦</div>
      </section>

      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}

      <section className="stats">
        <article className="stat-card"><span>Aktif ürün</span><strong>{products.length}</strong><small>Ürün kartı sayısı</small></article>
        <article className="stat-card"><span>Stok kalemi</span><strong>{balances.length}</strong><small>Bakiyesi hesaplanan ürün</small></article>
        <article className="stat-card"><span>Son hareketler</span><strong>{movements.length}</strong><small>En fazla son 100 hareket</small></article>
      </section>

      <section className="forms-grid">
        <form className="panel" onSubmit={addProduct}>
          <div className="panel-title"><span className="number">01</span><div><h3>Yeni ürün</h3><p>Ürün kartı oluştur</p></div></div>
          <label>Stok kodu (SKU)<input required value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Örn. URN-1001" maxLength={80} /></label>
          <label>Ürün adı<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Paketleme bandı" maxLength={200} /></label>
          <div className="two-cols">
            <label>Birim<input required value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={20} /></label>
            <label>Minimum stok<input type="number" min="0" step="0.001" required value={minStock} onChange={(e) => setMinStock(e.target.value)} /></label>
          </div>
          <button type="submit">+ Ürün ekle</button>
        </form>

        <form className="panel" onSubmit={addMovement}>
          <div className="panel-title"><span className="number">02</span><div><h3>Stok hareketi</h3><p>Giriş veya çıkış kaydet</p></div></div>
          <label>Ürün<select required value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} disabled={!products.length}>
            {!products.length && <option value="">Önce ürün ekleyin</option>}
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
          </select></label>
          <label>Miktar<input required type="number" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
          <p className="hint">Pozitif değer stok girişi, negatif değer stok çıkışıdır. Örn. 10 veya -2.</p>
          <label>Açıklama<input required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={250} /></label>
          <button type="submit" disabled={!products.length}>Hareketi kaydet</button>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="section-heading"><div><p className="eyebrow">ENVANTER</p><h3>Stok bakiyeleri</h3></div><button className="secondary" onClick={() => void refresh()} type="button">↻ Yenile</button></div>
        {loading ? <p className="empty">Veriler yükleniyor…</p> : balances.length === 0 ? <p className="empty">Henüz ürün yok. İlk ürününü yukarıdan ekle.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Stok kodu</th><th>Ürün</th><th>Birim</th><th className="numeric">Mevcut stok</th><th className="numeric">Min. stok</th><th>Durum</th></tr></thead>
            <tbody>{balances.map((b) => {
              const low = Number(b.balance) <= Number(b.min_stock);
              return <tr key={b.product_id}><td><code>{b.sku}</code></td><td className="product-name">{b.name}</td><td>{b.unit}</td><td className="numeric balance">{moneylessNumber(b.balance)}</td><td className="numeric">{moneylessNumber(b.min_stock)}</td><td><span className={`pill ${low ? "low" : "normal"}`}>{low ? "Düşük stok" : "Normal"}</span></td></tr>;
            })}</tbody>
          </table></div>
        )}
      </section>

      <section className="panel table-panel">
        <div className="section-heading"><div><p className="eyebrow">HAREKET GEÇMİŞİ</p><h3>Son stok hareketleri</h3></div></div>
        {movements.length === 0 ? <p className="empty">Henüz stok hareketi kaydedilmedi.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Hareket no</th><th>Ürün</th><th>Açıklama</th><th className="numeric">Miktar</th><th>Tarih</th></tr></thead>
            <tbody>{movements.map((m) => {
              const p = products.find((item) => item.id === m.product_id);
              return <tr key={m.id}><td>#{m.id}</td><td>{p?.name ?? `Ürün #${m.product_id}`}</td><td>{m.reason}</td><td className={`numeric ${Number(m.quantity_delta) > 0 ? "positive" : "negative"}`}>{Number(m.quantity_delta) > 0 ? "+" : ""}{moneylessNumber(m.quantity_delta)}</td><td>{new Date(m.created_at).toLocaleString("tr-TR")}</td></tr>;
            })}</tbody>
          </table></div>
        )}
      </section>

      <footer>TOPTAN STOK · MVP 0.1.0 <span>İlk prototip — canlı kullanım için hazır değildir.</span></footer>
    </main>
  );
}
