import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "./db.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Simple in-memory rate limiter for login: max 10 attempts per IP per 15 min
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

function resetLoginLimit(ip: string) {
  loginAttempts.delete(ip);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));

  // Allow cross-origin requests from Vite dev server
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (_req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // Cleanup expired blacklisted tokens on startup and every hour
  db.exec("DELETE FROM token_blacklist WHERE expires_at < datetime('now')");
  setInterval(() => {
    try { db.exec("DELETE FROM token_blacklist WHERE expires_at < datetime('now')"); } catch {}
  }, 60 * 60 * 1000);

  // Helper: extract verified user from Authorization header (returns null if missing/invalid/blacklisted)
  function getTokenUser(req: express.Request) {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return null;
    const blacklisted = db.prepare("SELECT token FROM token_blacklist WHERE token = ?").get(token);
    if (blacklisted) return null;
    return verifyToken(token);
  }

  // --- Auth routes ---

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone } = req.body as Record<string, string>;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "El formato del email es inválido" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim());
    if (existing) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese email" });
    }
    const stmt = db.prepare("INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'cliente', ?)");
    const result = stmt.run(name, email, hashPassword(password), phone?.trim() ?? null);
    const user = db.prepare("SELECT id, name, email, role, phone FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
    res.json({ token: signToken(user), user });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body as Record<string, string>;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    if (!checkLoginLimit(ip)) {
      return res.status(429).json({ error: "Demasiados intentos fallidos. Intentá de nuevo en 15 minutos." });
    }
    const user = db.prepare("SELECT id, name, email, role, phone, password_hash FROM users WHERE email = ?").get(email) as any;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    resetLoginLimit(ip);
    const { password_hash: _, ...userWithoutHash } = user;
    res.json({ token: signToken(userWithoutHash), user: userWithoutHash });
  });

  app.get("/api/auth/me", (req, res) => {
    const payload = getTokenUser(req);
    if (!payload) return res.status(401).json({ error: "No autenticado" });
    const user = db.prepare("SELECT id, name, email, role, phone FROM users WHERE id = ?").get(payload.id);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });
    res.json(user);
  });

  app.post("/api/auth/logout", (req, res) => {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const exp = (payload as any).exp
          ? new Date((payload as any).exp * 1000).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare("INSERT OR IGNORE INTO token_blacklist (token, expires_at) VALUES (?, ?)").run(token, exp);
      }
    }
    res.json({ ok: true });
  });

  // --- API routes ---

  app.post("/api/contact", (req, res) => {
    const { name, email, company, subject, message } = req.body as Record<string, string>;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "Nombre, email y mensaje son requeridos" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "El formato del email es inválido" });
    }
    const stmt = db.prepare(
      "INSERT INTO contact_messages (name, email, company, subject, message) VALUES (?, ?, ?, ?, ?)"
    );
    const result = stmt.run(name, email, company ?? null, subject ?? null, message);
    res.json({ ok: true, id: result.lastInsertRowid });
  });

  app.post("/api/curriculum", (req, res) => {
    const { name, phone, email, area, message } = req.body as Record<string, string>;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "Nombre y email son requeridos" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "El formato del email es inválido" });
    }
    const stmt = db.prepare(
      "INSERT INTO cv_applications (name, phone, email, area, message) VALUES (?, ?, ?, ?, ?)"
    );
    const result = stmt.run(name, phone ?? null, email, area ?? null, message ?? null);
    res.json({ ok: true, id: result.lastInsertRowid });
  });

  app.post("/api/orders", (req, res) => {
    const { name, company, email, phone, product, productId, variant, quantity, dimensions, material, transport, notes } =
      req.body as Record<string, string>;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "Nombre y email son requeridos" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "El formato del email es inválido" });
    }
    const qty = quantity ? Number(quantity) : null;
    if (qty !== null && (isNaN(qty) || qty < 1)) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }
    // Derive userId from the authenticated session, never from the request body
    const tokenUser = getTokenUser(req);
    const resolvedUserId = tokenUser ? tokenUser.id : null;
    const stmt = db.prepare(
      "INSERT INTO orders (name, company, email, phone, product, product_id, variant, quantity, dimensions, material, transport, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const result = stmt.run(
      name, company ?? null, email, phone ?? null, product ?? null,
      productId ?? null, variant ?? null,
      qty, dimensions ?? null,
      material ?? null, transport ?? null, notes ?? null,
      resolvedUserId
    );
    res.json({ ok: true, id: result.lastInsertRowid });
  });

  // Update order status (empleado / admin only)
  app.patch("/api/orders/:id/status", (req, res) => {
    const user = getTokenUser(req);
    if (!user || (user.role !== "admin" && user.role !== "empleado")) {
      return res.status(403).json({ error: "Sin permiso" });
    }
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: "ID inválido" });
    const orderExists = db.prepare("SELECT id FROM orders WHERE id = ?").get(orderId);
    if (!orderExists) return res.status(404).json({ error: "Pedido no encontrado" });
    const { status } = req.body as { status: string };
    const valid = ["pendiente", "en_proceso", "listo", "entregado", "rechazado"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Estado inválido" });
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
    res.json({ ok: true });
  });

  // Client: my orders
  app.get("/api/my-orders", (req, res) => {
    const user = getTokenUser(req);
    if (!user) return res.status(401).json({ error: "No autenticado" });
    const rows = db.prepare(
      "SELECT id, product, product_id, variant, quantity, dimensions, material, transport, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC"
    ).all(user.id);
    res.json(rows);
  });

  // --- Notification endpoints ---

  app.get("/api/notifications/unread", (req, res) => {
    const user = getTokenUser(req);
    if (!user) return res.status(401).json({ error: "No autenticado" });

    if (user.role === "admin") {
      const contacts = db.prepare(
        "SELECT id, 'contact' as type, name, email, created_at, NULL as status FROM contact_messages WHERE read = 0 ORDER BY created_at DESC LIMIT 10"
      ).all();
      const cvs = db.prepare(
        "SELECT id, 'curriculum' as type, name, email, created_at, NULL as status FROM cv_applications WHERE read = 0 ORDER BY created_at DESC LIMIT 10"
      ).all();
      const orders = db.prepare(
        "SELECT id, 'order' as type, name, email, created_at, status FROM orders WHERE read = 0 ORDER BY created_at DESC LIMIT 10"
      ).all();
      const all = [...contacts, ...cvs, ...orders]
        .sort((a: any, b: any) => (b.created_at as string).localeCompare(a.created_at as string))
        .slice(0, 10);
      return res.json({ count: all.length, items: all });
    }

    if (user.role === "empleado") {
      const orders = db.prepare(
        "SELECT id, 'order' as type, name, email, created_at, status FROM orders WHERE read = 0 ORDER BY created_at DESC LIMIT 10"
      ).all();
      return res.json({ count: orders.length, items: orders });
    }

    // cliente: no badge — orders visible in Portal
    return res.json({ count: 0, items: [] });
  });

  app.post("/api/notifications/read", (req, res) => {
    const user = getTokenUser(req);
    if (!user) return res.status(401).json({ error: "No autenticado" });

    if (user.role === "admin") {
      db.exec("UPDATE contact_messages SET read = 1 WHERE read = 0");
      db.exec("UPDATE cv_applications SET read = 1 WHERE read = 0");
      db.exec("UPDATE orders SET read = 1 WHERE read = 0");
    } else if (user.role === "empleado") {
      db.exec("UPDATE orders SET read = 1 WHERE read = 0");
    }
    res.json({ ok: true });
  });

  // --- Products CRUD ---

  function safeParseJSON(value: string | null, fallback: any[] = []) {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function parseProduct(row: any) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory ?? null,
      shortDesc: row.short_desc ?? "",
      fullDesc: row.full_desc ?? "",
      image: row.image ?? "",
      specs: safeParseJSON(row.specs),
      features: safeParseJSON(row.features),
      variants: safeParseJSON(row.variants),
      active: row.active !== 0,
      updatedAt: row.updated_at ?? null,
      updatedBy: row.updated_by ?? null,
    };
  }

  function validateProductBody(body: any): string | null {
    const { code, name, category } = body;
    if (!code?.trim() || !name?.trim() || !category?.trim())
      return "code, name y category son requeridos";
    if (code.length > 50)   return "El código no puede superar 50 caracteres";
    if (name.length > 200)  return "El nombre no puede superar 200 caracteres";
    if (category.length > 100) return "La categoría no puede superar 100 caracteres";
    if (body.shortDesc && body.shortDesc.length > 500)
      return "La descripción corta no puede superar 500 caracteres";
    return null;
  }

  // Public: returns active + non-deleted products
  app.get("/api/products", (_req, res) => {
    const rows = db.prepare(
      "SELECT * FROM products WHERE deleted_at IS NULL AND active = 1 ORDER BY sort_order ASC, created_at ASC"
    ).all();
    res.json((rows as any[]).map(parseProduct));
  });

  // Admin: returns ALL products including inactive and soft-deleted
  app.get("/api/products/all", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const rows = db.prepare("SELECT * FROM products ORDER BY sort_order ASC, created_at ASC").all();
    res.json((rows as any[]).map(parseProduct));
  });

  app.post("/api/products", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });

    const { id, code, name, category, subcategory, shortDesc, fullDesc, image, specs, features, variants } = req.body as any;
    if (!id) return res.status(400).json({ error: "id es requerido" });

    const validationError = validateProductBody(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const duplicate = db.prepare(
      "SELECT id FROM products WHERE code = ? AND deleted_at IS NULL"
    ).get(code.trim());
    if (duplicate) return res.status(409).json({ error: `Ya existe un producto con el código "${code.trim()}"` });

    const maxOrder = (db.prepare("SELECT MAX(sort_order) as m FROM products WHERE deleted_at IS NULL").get() as any).m ?? 0;
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO products (id, code, name, category, subcategory, short_desc, full_desc, image, specs, features, variants, sort_order, active, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)"
    ).run(
      id, code.trim(), name.trim(), category.trim(),
      subcategory?.trim() || null,
      shortDesc ?? "", fullDesc ?? "", image ?? "",
      JSON.stringify(specs ?? []), JSON.stringify(features ?? []),
      JSON.stringify(variants ?? []),
      maxOrder + 1, now, user.name
    );

    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    res.status(201).json(parseProduct(row));
  });

  app.put("/api/products/:id", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });

    const existing = db.prepare("SELECT id FROM products WHERE id = ? AND deleted_at IS NULL").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Producto no encontrado" });

    const validationError = validateProductBody(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const { code, name, category, subcategory, shortDesc, fullDesc, image, specs, features, variants, active } = req.body as any;

    const duplicate = db.prepare(
      "SELECT id FROM products WHERE code = ? AND id != ? AND deleted_at IS NULL"
    ).get(code.trim(), req.params.id);
    if (duplicate) return res.status(409).json({ error: `Ya existe otro producto con el código "${code.trim()}"` });

    const now = new Date().toISOString();
    db.prepare(
      "UPDATE products SET code=?, name=?, category=?, subcategory=?, short_desc=?, full_desc=?, image=?, specs=?, features=?, variants=?, active=?, updated_at=?, updated_by=? WHERE id=?"
    ).run(
      code.trim(), name.trim(), category.trim(),
      subcategory?.trim() || null,
      shortDesc ?? "", fullDesc ?? "", image ?? "",
      JSON.stringify(specs ?? []), JSON.stringify(features ?? []),
      JSON.stringify(variants ?? []),
      active === false ? 0 : 1,
      now, user.name, req.params.id
    );

    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    res.json(parseProduct(row));
  });

  // Soft delete — recoverable
  app.delete("/api/products/:id", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const existing = db.prepare("SELECT id FROM products WHERE id = ? AND deleted_at IS NULL").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Producto no encontrado" });
    const now = new Date().toISOString();
    db.prepare("UPDATE products SET deleted_at=?, updated_by=? WHERE id=?")
      .run(now, user.name, req.params.id);
    res.json({ ok: true });
  });

  // Restore a soft-deleted product
  app.post("/api/products/:id/restore", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id) as any;
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    const conflict = db.prepare(
      "SELECT id FROM products WHERE code = ? AND id != ? AND deleted_at IS NULL"
    ).get(product.code, req.params.id);
    if (conflict) return res.status(409).json({
      error: `No se puede restaurar: el código "${product.code}" ya está en uso por otro producto activo`,
    });

    const now = new Date().toISOString();
    db.prepare("UPDATE products SET deleted_at=NULL, active=1, updated_at=?, updated_by=? WHERE id=?")
      .run(now, user.name, req.params.id);
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    res.json(parseProduct(row));
  });

  // --- Reviews ---
  app.post("/api/reviews", (req, res) => {
    const { name, company, role, quote } = req.body as Record<string, string>;
    if (!name?.trim() || !quote?.trim()) {
      return res.status(400).json({ error: "Nombre y opinión son requeridos" });
    }
    if (name.trim().length > 100) return res.status(400).json({ error: "El nombre no puede superar 100 caracteres" });
    if (quote.length > 1000) return res.status(400).json({ error: "La opinión no puede superar 1000 caracteres" });
    db.prepare("INSERT INTO reviews (name, company, role, quote) VALUES (?, ?, ?, ?)")
      .run(name.trim(), company?.trim() ?? null, role?.trim() ?? null, quote.trim());
    res.json({ ok: true });
  });

  app.get("/api/reviews", (_req, res) => {
    const rows = db.prepare("SELECT * FROM reviews WHERE approved = 1 AND deleted_at IS NULL ORDER BY created_at DESC").all();
    res.json(rows);
  });

  app.get("/api/reviews/pending", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const rows = db.prepare("SELECT * FROM reviews WHERE approved = 0 AND deleted_at IS NULL ORDER BY created_at DESC").all();
    res.json(rows);
  });

  app.patch("/api/reviews/:id/approve", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const reviewId = Number(req.params.id);
    if (isNaN(reviewId)) return res.status(400).json({ error: "ID inválido" });
    const exists = db.prepare("SELECT id FROM reviews WHERE id = ? AND deleted_at IS NULL").get(reviewId);
    if (!exists) return res.status(404).json({ error: "Reseña no encontrada" });
    db.prepare("UPDATE reviews SET approved = 1 WHERE id = ?").run(reviewId);
    res.json({ ok: true });
  });

  // Soft-delete — recoverable
  app.delete("/api/reviews/:id", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const reviewId = Number(req.params.id);
    if (isNaN(reviewId)) return res.status(400).json({ error: "ID inválido" });
    const exists = db.prepare("SELECT id FROM reviews WHERE id = ? AND deleted_at IS NULL").get(reviewId);
    if (!exists) return res.status(404).json({ error: "Reseña no encontrada" });
    const now = new Date().toISOString();
    db.prepare("UPDATE reviews SET deleted_at = ? WHERE id = ?").run(now, reviewId);
    res.json({ ok: true });
  });

  app.post("/api/reviews/:id/restore", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const reviewId = Number(req.params.id);
    if (isNaN(reviewId)) return res.status(400).json({ error: "ID inválido" });
    const exists = db.prepare("SELECT id FROM reviews WHERE id = ?").get(reviewId);
    if (!exists) return res.status(404).json({ error: "Reseña no encontrada" });
    db.prepare("UPDATE reviews SET deleted_at = NULL WHERE id = ?").run(reviewId);
    res.json({ ok: true });
  });

  // --- Categories ---

  app.get("/api/categories", (_req, res) => {
    const rows = db.prepare("SELECT * FROM categories ORDER BY sort_order ASC, name ASC").all();
    res.json(rows);
  });

  app.post("/api/categories", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const { name } = req.body as { name: string };
    if (!name?.trim()) return res.status(400).json({ error: "name es requerido" });
    if (name.trim().length > 100) return res.status(400).json({ error: "El nombre no puede superar 100 caracteres" });
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      const maxOrder = (db.prepare("SELECT MAX(sort_order) as m FROM categories").get() as any).m ?? 0;
      const result = db.prepare("INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)").run(name.trim(), slug, maxOrder + 1);
      res.status(201).json(db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid));
    } catch (e: any) {
      if (e.message?.includes("UNIQUE")) return res.status(409).json({ error: "Ya existe esa categoría" });
      throw e;
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const cat = db.prepare("SELECT name FROM categories WHERE id = ?").get(Number(req.params.id)) as any;
    if (!cat) return res.status(404).json({ error: "Categoría no encontrada" });
    const count = (db.prepare("SELECT COUNT(*) as c FROM products WHERE category = ? AND deleted_at IS NULL").get(cat.name) as any).c;
    if (count > 0) return res.status(409).json({ error: `No se puede eliminar: hay ${count} producto${count !== 1 ? "s" : ""} en esta categoría` });
    db.prepare("DELETE FROM categories WHERE id = ?").run(Number(req.params.id));
    res.json({ ok: true });
  });

  // --- Invoices ---

  function nextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const count = (db.prepare("SELECT COUNT(*) as c FROM invoices WHERE number LIKE ?").get(`FAC-${year}-%`) as any).c;
    return `FAC-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  app.get("/api/invoices", (req, res) => {
    const user = getTokenUser(req);
    if (!user || (user.role !== "admin" && user.role !== "empleado")) return res.status(403).json({ error: "Sin permiso" });
    const rows = db.prepare(
      "SELECT i.*, o.name as order_client, o.product as order_product FROM invoices i LEFT JOIN orders o ON i.order_id = o.id ORDER BY i.created_at DESC"
    ).all();
    res.json(rows);
  });

  app.post("/api/invoices", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const { orderId, subtotal, tax, total, notes } = req.body as any;
    if (subtotal == null || total == null) return res.status(400).json({ error: "subtotal y total son requeridos" });
    if (Number(subtotal) < 0 || Number(total) < 0) return res.status(400).json({ error: "subtotal y total deben ser valores positivos" });
    const number = nextInvoiceNumber();
    const now = new Date().toISOString();
    const result = db.prepare(
      "INSERT INTO invoices (number, order_id, subtotal, tax, total, notes, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(number, orderId ?? null, Number(subtotal), Number(tax ?? 0), Number(total), notes ?? null, now, user.name);
    res.status(201).json(db.prepare("SELECT * FROM invoices WHERE id = ?").get(result.lastInsertRowid));
  });

  app.patch("/api/invoices/:id/status", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const invoiceId = Number(req.params.id);
    if (isNaN(invoiceId)) return res.status(400).json({ error: "ID inválido" });
    const invoiceExists = db.prepare("SELECT id FROM invoices WHERE id = ?").get(invoiceId);
    if (!invoiceExists) return res.status(404).json({ error: "Factura no encontrada" });
    const { status } = req.body as { status: string };
    const valid = ["pendiente", "pagada", "cancelada"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Estado inválido" });
    db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(status, invoiceId);
    res.json({ ok: true });
  });

  // Settings: get certificate image (public)
  app.get("/api/settings/certificate-image", (_req, res) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'certificate_image'").get() as any;
    if (!row?.value) return res.status(404).end();
    const [header, base64Data] = (row.value as string).split(",");
    const mime = header.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
    const buffer = Buffer.from(base64Data, "base64");
    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.send(buffer);
  });

  // Settings: upload certificate image (admin only)
  app.post("/api/settings/certificate-image", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const { data } = req.body as { data: string };
    if (!data?.startsWith("data:")) return res.status(400).json({ error: "data URL inválida" });
    const now = new Date().toISOString();
    db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('certificate_image', ?, ?)").run(data, now);
    res.json({ ok: true });
  });

  // Admin-only read endpoints
  app.get("/api/contact", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const rows = db.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
    res.json(rows);
  });

  app.get("/api/curriculum", (req, res) => {
    const user = getTokenUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sin permiso" });
    const rows = db.prepare("SELECT * FROM cv_applications ORDER BY created_at DESC").all();
    res.json(rows);
  });

  app.get("/api/orders", (req, res) => {
    const user = getTokenUser(req);
    if (!user || (user.role !== "admin" && user.role !== "empleado")) return res.status(403).json({ error: "Sin permiso" });
    const rows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
    res.json(rows);
  });

  // Serve static files in production only
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = isDev ? (process.env.API_PORT ?? 3001) : (process.env.PORT ?? 3000);

  server.listen(Number(port), () => {
    console.log(`API server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
