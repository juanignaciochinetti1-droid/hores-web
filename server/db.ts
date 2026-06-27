import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";
import { verifyPassword } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "hores.db");

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cv_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    area TEXT,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    product TEXT,
    quantity INTEGER,
    dimensions TEXT,
    material TEXT,
    transport TEXT,
    notes TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'cliente' CHECK(role IN ('admin', 'empleado', 'cliente')),
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed default users if table is empty
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
if (userCount === 0) {
  const insert = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
  insert.run("Juan", "juan@gmail.com", hashPassword("1234"), "admin");
  insert.run("Leandro", "leandro@gmail.com", hashPassword("5678"), "admin");
  insert.run("Carlos Empleado", "carlos@hores.com", hashPassword("emp123"), "empleado");
  insert.run("Lucía Empleada", "lucia@hores.com", hashPassword("emp123"), "empleado");
  insert.run("Diego Empleado", "diego@hores.com", hashPassword("emp123"), "empleado");
  console.log("Usuarios de prueba creados.");
}

// Ensure correct admin accounts always exist (upsert by email)
// Only rehash if the stored password no longer matches, to avoid slow scrypt on every boot
const adminAccounts = [
  { name: "Juan", email: "juan@gmail.com", password: "1234" },
  { name: "Leandro", email: "leandro@gmail.com", password: "5678" },
];
for (const a of adminAccounts) {
  const existing = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(a.email) as any;
  if (existing) {
    const passwordCorrect = verifyPassword(a.password, existing.password_hash);
    if (!passwordCorrect) {
      db.prepare("UPDATE users SET name = ?, password_hash = ?, role = 'admin' WHERE email = ?")
        .run(a.name, hashPassword(a.password), a.email);
    } else {
      db.prepare("UPDATE users SET name = ?, role = 'admin' WHERE email = ?")
        .run(a.name, a.email);
    }
  } else {
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run(a.name, a.email, hashPassword(a.password));
  }
}

// Remove old default admin accounts if they exist
for (const oldEmail of ["admin@hores.com", "admin2@hores.com"]) {
  db.prepare("DELETE FROM users WHERE email = ?").run(oldEmail);
}

// Safe migrations
function addColumnIfMissing(table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

for (const table of ["contact_messages", "cv_applications", "orders"]) {
  addColumnIfMissing(table, "read", "INTEGER DEFAULT 0");
}
addColumnIfMissing("orders", "user_id", "INTEGER");
addColumnIfMissing("orders", "status", "TEXT DEFAULT 'pendiente'");
addColumnIfMissing("orders", "product_id", "TEXT");
addColumnIfMissing("orders", "variant", "TEXT");

// Products table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    short_desc TEXT,
    full_desc TEXT,
    image TEXT,
    specs TEXT DEFAULT '[]',
    features TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed products if table is empty
const MOLD_1 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663723930343/HjyBo5a6eNuvRBjtzxbuL5/mold-product-1-5vT3QTNw6BxBkwMSygYHDA.webp";
const MOLD_2 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663723930343/HjyBo5a6eNuvRBjtzxbuL5/mold-product-2-cRRW7whFyGNvUVhPQNHcA7.webp";
const MOLD_3 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663723930343/HjyBo5a6eNuvRBjtzxbuL5/mold-product-3-noA5DzgpnzWafwHiKCsiQT.webp";

const productCount = (db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }).c;
if (productCount === 0) {
  const ins = db.prepare(
    "INSERT INTO products (id, code, name, category, short_desc, full_desc, image, specs, features, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  ins.run(
    "p1", "HC-PD-001", "Molde Pan Dulce", "Pan Dulce",
    "Molde de cartón para pan dulce tradicional, disponible en tamaños de 500g, 1kg y 2kg.",
    "Molde de cartón de alta resistencia para pan dulce tradicional. Fabricado en cartulina especial de 400 g/m², resistente al calor del horno y a la humedad de la masa. Disponible en formatos de 500 g, 1 kg y 2 kg. Apto para líneas de producción automáticas.",
    MOLD_1,
    JSON.stringify([
      { label: "Código", value: "HC-PD-001" },
      { label: "Formatos", value: "500 g / 1 kg / 2 kg" },
      { label: "Material", value: "Cartulina 400 g/m²" },
      { label: "Resistencia térmica", value: "Hasta 220°C" },
      { label: "Resistencia humedad", value: "Alta" },
    ]),
    JSON.stringify([
      "Resistente al calor del horno",
      "Compatible con líneas automáticas",
      "Imprimible en offset y flexografía",
      "Varios formatos disponibles",
    ]),
    1
  );
  ins.run(
    "p2", "HC-PP-002", "Molde Pan de Pascua", "Pan de Pascua",
    "Molde de cartón para pan de pascua, forma cilíndrica alta con base reforzada.",
    "Molde cilíndrico de cartón para pan de pascua. Su forma alta y base reforzada garantizan una cocción pareja y una presentación impecable. Fabricado en cartulina estucada de alta blancura, ideal para impresión a full color.",
    MOLD_2,
    JSON.stringify([
      { label: "Código", value: "HC-PP-002" },
      { label: "Formatos", value: "500 g / 1 kg" },
      { label: "Material", value: "Cartulina estucada 380 g/m²" },
      { label: "Resistencia térmica", value: "Hasta 210°C" },
      { label: "Forma", value: "Cilíndrica alta" },
    ]),
    JSON.stringify([
      "Base reforzada para mayor estabilidad",
      "Forma cilíndrica alta tradicional",
      "Apto para impresión full color",
      "Alta resistencia a la humedad",
    ]),
    2
  );
  ins.run(
    "p3", "HC-BU-003", "Molde Budín", "Budín",
    "Molde rectangular de cartón para budín inglés y budín de pan, con tapa incluida.",
    "Molde rectangular de cartón para budín inglés y budín de pan. Diseño con bordes altos y esquinas reforzadas para mantener la forma durante la cocción. Disponible con tapa de cartón plastificado para protección y presentación en góndola.",
    MOLD_3,
    JSON.stringify([
      { label: "Código", value: "HC-BU-003" },
      { label: "Formatos", value: "400 g / 750 g / 1 kg" },
      { label: "Material", value: "Cartulina 350 g/m² plastificada" },
      { label: "Resistencia térmica", value: "Hasta 200°C" },
      { label: "Incluye", value: "Tapa de cartón" },
    ]),
    JSON.stringify([
      "Incluye tapa para presentación en góndola",
      "Esquinas reforzadas",
      "Diseño rectangular clásico",
      "Apto para freezer",
    ]),
    3
  );
  ins.run(
    "p4", "HC-RB-004", "Molde Rosca / Bizcochuelo", "Rosca / Bizcochuelo",
    "Molde de cartón redondo para rosca de reyes y bizcochuelo, con orificio central.",
    "Molde redondo de cartón para rosca de reyes y bizcochuelo. El orificio central garantiza una cocción uniforme en el interior. Disponible en diámetros de 20, 24 y 28 cm. La base rigidizada soporta la masa sin deformarse durante el horneado.",
    MOLD_1,
    JSON.stringify([
      { label: "Código", value: "HC-RB-004" },
      { label: "Diámetros", value: "20 / 24 / 28 cm" },
      { label: "Material", value: "Cartulina 420 g/m²" },
      { label: "Resistencia térmica", value: "Hasta 220°C" },
      { label: "Forma", value: "Redonda con orificio central" },
    ]),
    JSON.stringify([
      "Orificio central para cocción uniforme",
      "Base rigidizada antideformación",
      "Tres diámetros disponibles",
      "Apto para decoración y presentación directa",
    ]),
    4
  );
  console.log("Productos iniciales creados.");
}

// Products column migrations — must run BEFORE the sync loop below reads these columns
addColumnIfMissing("products", "updated_at", "TEXT");
addColumnIfMissing("products", "updated_by", "TEXT");
addColumnIfMissing("products", "deleted_at", "TEXT");
addColumnIfMissing("products", "active", "INTEGER DEFAULT 1");
addColumnIfMissing("products", "variants", "TEXT DEFAULT '[]'");
addColumnIfMissing("products", "subcategory", "TEXT");

// Always sync correct specs/features/descriptions for seed products
const seedProductSpecs = [
  {
    id: "p1",
    shortDesc: "Molde de papel kraft para pan dulce tradicional, en múltiples tamaños.",
    fullDesc: "Molde de papel kraft para pan dulce tradicional. Lateral de papel kraft puro calandrado o monolúcido micro-perforado que permite una cocción uniforme. Fondo liso o micro corrugado. Impresión en un color con diseño flor estándar. Personalizable según especificación del cliente.",
    specs: JSON.stringify([
      { label: "Lateral",                  value: "Papel kraft puro calandrado / monolúcido de 80 / 100 grs. micro-perforado" },
      { label: "Fondo",                    value: "Papel kraft puro monolúcido, calandrado o virgen de 60 / 80 ó 100 grs. Liso o micro corrugado." },
      { label: "Impresión",                value: "En un color. Diseño flor estándar color blanco." },
      { label: "Personalización",          value: "Según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1000, 800 y 600 unidades" },
    ]),
    features: JSON.stringify([
      "Papel kraft puro calandrado / monolúcido micro-perforado",
      "Fondo liso o micro corrugado",
      "Impresión en un color, diseño flor estándar",
      "Personalización según especificación del cliente",
      "Presentación en cajas de 600 a 1000 unidades",
    ]),
  },
  {
    id: "p2",
    shortDesc: "Molde de papel kraft para pan de pascua, con fondo reforzado.",
    fullDesc: "Molde de papel kraft para pan de pascua. Lateral de papel kraft calandrado o monolúcido. Impresión en uno o dos colores con motivo flor estándar o a pedido del cliente.",
    specs: JSON.stringify([
      { label: "Lateral",                  value: "Papel kraft puro calandrado o monolúcido de 80 grs." },
      { label: "Fondo",                    value: "Papel kraft puro calandrado de 100 / 80 grs." },
      { label: "Impresión",                value: "En uno o dos colores según especificación del cliente" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1200, 1000, 800 y 600 unidades" },
    ]),
    features: JSON.stringify([
      "Papel kraft puro calandrado",
      "Impresión en uno o dos colores",
      "Motivos estándar o a pedido del cliente",
      "Presentación en cajas de 600 a 1200 unidades",
    ]),
  },
  {
    id: "p3",
    shortDesc: "Molde de papel kraft supercalandrado para budín. Registro de diseño industrial nº 68.399.",
    fullDesc: "Molde de papel kraft puro supercalandrado para budín. Impresión en uno o dos colores con motivo flor estándar o a pedido. Cuenta con registro de diseño industrial nº 68.399.",
    specs: JSON.stringify([
      { label: "Lateral",                  value: "Papel kraft puro supercalandrado de 150 / 190 grs." },
      { label: "Impresión",                value: "En uno o 2 colores" },
      { label: "Motivo",                   value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1500, 1000 y 600 unidades" },
      { label: "Registro",                 value: "Diseño industrial nº 68.399" },
    ]),
    features: JSON.stringify([
      "Papel kraft puro supercalandrado de 150 / 190 grs.",
      "Impresión en uno o 2 colores",
      "Motivos estándar o a pedido del cliente",
      "Presentación en cajas de 600 a 1500 unidades",
      "Registro de diseño industrial nº 68.399",
    ]),
  },
  {
    id: "p4",
    shortDesc: "Molde de papel kraft para rosca y bizcochuelo, con cono central.",
    fullDesc: "Molde de papel kraft puro para rosca. Lateral calandrado o monolúcido, fondo monolúcido y cono supercalandrado. Impresión en dos colores con motivo flor estándar o a pedido del cliente.",
    specs: JSON.stringify([
      { label: "Lateral",                  value: "Papel kraft puro calandrado o monolucido de 100 grs." },
      { label: "Fondo",                    value: "Papel kraft puro monolúcido de 100 grs." },
      { label: "Cono",                     value: "Papel kraft puro supercalandrado de 80 grs." },
      { label: "Impresión",                value: "En 2 (dos) colores" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1000, 800, 600 y 100 unidades" },
    ]),
    features: JSON.stringify([
      "Papel kraft puro calandrado o monolucido de 100 grs.",
      "Cono de papel kraft supercalandrado de 80 grs.",
      "Impresión en 2 colores",
      "Motivos estándar o a pedido del cliente",
      "Presentación en cajas de 100 a 1000 unidades",
    ]),
  },
];

// Variants for seed products — only applied if still empty
const seedProductVariants: Record<string, { weight: string; code: string; dimensions: string; image: string }[]> = {
  "p1": [
    { weight: "100gr",  code: "PD70X60",   dimensions: "70x60mm",   image: "" },
    { weight: "250gr",  code: "PD90X70",   dimensions: "90x70mm",   image: "" },
    { weight: "400gr",  code: "PD100X100", dimensions: "100x100mm", image: "" },
    { weight: "500gr",  code: "PD110X110", dimensions: "110x110mm", image: "" },
    { weight: "550gr",  code: "PD115X105", dimensions: "115x105mm", image: "" },
    { weight: "600gr",  code: "PD120X110", dimensions: "120x110mm", image: "" },
    { weight: "700gr",  code: "PD130X120", dimensions: "130x120mm", image: "" },
    { weight: "1000gr", code: "PD140X120", dimensions: "140x120mm", image: "" },
  ],
  "p2": [
    { weight: "130x50", code: "PDP130X50", dimensions: "130x50mm", image: "" },
    { weight: "140x50", code: "PDP140X50", dimensions: "140x50mm", image: "" },
    { weight: "150x50", code: "PDP150X50", dimensions: "150x50mm", image: "" },
    { weight: "160x50", code: "PDP160X50", dimensions: "160x50mm", image: "" },
    { weight: "170x50", code: "PDP170X50", dimensions: "170x50mm", image: "" },
    { weight: "180x60", code: "PDP180X60", dimensions: "180x60mm", image: "" },
    { weight: "190x90", code: "PDP190X90", dimensions: "190x90mm", image: "" },
  ],
  "p3": [
    { weight: "500gr", code: "BUD180X80X60",    dimensions: "180x80x60mm", image: "" },
    { weight: "300gr", code: "BUD185X50X50",    dimensions: "185x50x50mm", image: "" },
    { weight: "300gr", code: "BUD185X50X50RCM", dimensions: "185x50x50mm", image: "" },
    { weight: "250gr", code: "BUD185X50X40",    dimensions: "185x50x40mm", image: "" },
    { weight: "250gr", code: "BUD185X50X40RCM", dimensions: "185x50x40mm", image: "" },
    { weight: "220gr", code: "BUD165X70X40",    dimensions: "165x70x40mm", image: "" },
    { weight: "200gr", code: "BUD155X49X41",    dimensions: "155x49x41mm", image: "" },
    { weight: "200gr", code: "BUD155X49X41RCM", dimensions: "155x49x41mm", image: "" },
    { weight: "180gr", code: "BUD135X50X40",    dimensions: "135x50x40mm", image: "" },
  ],
  "p4": [
    { weight: "180x50", code: "ROS180X50", dimensions: "180x50mm", image: "" },
    { weight: "200x50", code: "ROS200X50", dimensions: "200x50mm", image: "" },
    { weight: "220x50", code: "ROS220X50", dimensions: "220x50mm", image: "" },
    { weight: "180x50", code: "BIZ180X50", dimensions: "180x50mm", image: "" },
    { weight: "200x50", code: "BIZ200X50", dimensions: "200x50mm", image: "" },
    { weight: "220x50", code: "BIZ220X50", dimensions: "220x50mm", image: "" },
  ],
};

for (const p of seedProductSpecs) {
  // Only apply seed data if an admin hasn't manually edited this product yet
  const row = db.prepare("SELECT id, variants, updated_by FROM products WHERE id = ?").get(p.id) as any;
  if (row) {
    if (!row.updated_by) {
      db.prepare("UPDATE products SET short_desc=?, full_desc=?, specs=?, features=? WHERE id=?")
        .run(p.shortDesc, p.fullDesc, p.specs, p.features, p.id);
    }
    // Only set variants if currently empty
    const current = (() => { try { return JSON.parse(row.variants ?? "[]"); } catch { return []; } })();
    if (current.length === 0 && seedProductVariants[p.id]) {
      db.prepare("UPDATE products SET variants=? WHERE id=?")
        .run(JSON.stringify(seedProductVariants[p.id]), p.id);
    }
  }
}

// Settings table — generic key/value store for admin-managed site content
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Reviews table
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    quote TEXT NOT NULL,
    approved INTEGER DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);
addColumnIfMissing("reviews", "deleted_at", "TEXT");

// Token blacklist — allows server-side logout by invalidating JWT tokens
db.exec(`
  CREATE TABLE IF NOT EXISTS token_blacklist (
    token TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Categories — normalized list derived from products; keeps category names consistent
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed categories from existing products (safe to run on every start — INSERT OR IGNORE)
{
  const productCats = db.prepare(
    "SELECT DISTINCT category FROM products WHERE deleted_at IS NULL AND category IS NOT NULL ORDER BY category"
  ).all() as { category: string }[];
  const maxOrdRow = db.prepare("SELECT MAX(sort_order) as m FROM categories").get() as any;
  let ord: number = maxOrdRow.m ?? -1;
  for (const { category } of productCats) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = db.prepare("SELECT id FROM categories WHERE name = ?").get(category);
    if (!existing) {
      db.prepare("INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)").run(category, slug, ++ord);
    }
  }
}

// Phone number for users
addColumnIfMissing("users", "phone", "TEXT");

// Invoices table — created by admin, linked to an order
db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    tax REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'pagada', 'cancelada')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT
  );
`);

// Indexes for common queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
  CREATE INDEX IF NOT EXISTS idx_products_active      ON products(active);
  CREATE INDEX IF NOT EXISTS idx_products_deleted     ON products(deleted_at);
  CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_read          ON orders(read);
  CREATE INDEX IF NOT EXISTS idx_contact_read         ON contact_messages(read);
  CREATE INDEX IF NOT EXISTS idx_cv_read              ON cv_applications(read);
  CREATE INDEX IF NOT EXISTS idx_token_blacklist_exp  ON token_blacklist(expires_at);
  CREATE INDEX IF NOT EXISTS idx_categories_sort      ON categories(sort_order);
  CREATE INDEX IF NOT EXISTS idx_invoices_order       ON invoices(order_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_reviews_deleted      ON reviews(deleted_at);
`);

// Unique product code among non-deleted products
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_unique
  ON products(code) WHERE deleted_at IS NULL;
`);
