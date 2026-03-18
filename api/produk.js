import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // 1. BUAT TABEL JIKA BELUM ADA (Auto Run)
  try {
    await sql`CREATE TABLE IF NOT EXISTS XYZ_Products ( id SERIAL PRIMARY KEY, nama TEXT NOT NULL, deskripsi TEXT, harga TEXT, foto TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );`;
  } catch (error) {
    return response.status(500).json({ error: "Gagal buat tabel" });
  }

  // 2. HANDLE REQUEST POST (Simpan Produk Baru)
  if (request.method === 'POST') {
    try {
      const { nama, deskripsi, harga, foto } = request.body;
      
      if (!nama || !harga) {
        return response.status(400).json({ error: 'Nama dan Harga wajib diisi, Min.' });
      }

      await sql`
        INSERT INTO XYZ_Products (nama, deskripsi, harga, foto)
        VALUES (${nama}, ${deskripsi}, ${harga}, ${foto});
      `;
      
      return response.status(200).json({ message: 'Produk berhasil dipost, Min!' });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  // 3. HANDLE REQUEST GET (Ambil Semua Produk untuk Publik)
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM XYZ_Products ORDER BY created_at DESC;`;
      return response.status(200).json({ products: rows });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
