import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL не задан");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BASE_URL = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

// ─── вспомогательные функции ───────────────────────────────────────────────

function translit(str: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",
    к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",
    ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return str.toLowerCase().replace(/[а-яё]/g, ch => map[ch] ?? ch).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeSlug(first: string, last: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${translit(first)}-${translit(last)}-${suffix}`;
}

function box(text: string): void {
  const border = "═".repeat(text.length + 4);
  console.log(`╔${border}╗`);
  console.log(`║  ${text}  ║`);
  console.log(`╚${border}╝`);
}

// ─── создание таблиц ───────────────────────────────────────────────────────

async function ensureTables(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id               SERIAL PRIMARY KEY,
      wedding_title    TEXT NOT NULL DEFAULT 'Наша Свадьба',
      bride_name       TEXT NOT NULL DEFAULT 'Анна',
      groom_name       TEXT NOT NULL DEFAULT 'Александр',
      wedding_date     TEXT NOT NULL DEFAULT '2025-08-15',
      wedding_time     TEXT NOT NULL DEFAULT '16:00',
      venue_name       TEXT NOT NULL DEFAULT 'Ресторан «Белые Ночи»',
      venue_address    TEXT NOT NULL DEFAULT 'г. Москва, ул. Арбат, 1',
      venue_lat        REAL NOT NULL DEFAULT 55.7558,
      venue_lng        REAL NOT NULL DEFAULT 37.6173,
      map_link         TEXT,
      invitation_text  TEXT NOT NULL DEFAULT 'С великой радостью приглашаем вас разделить с нами самый счастливый день нашей жизни.',
      dress_code       TEXT DEFAULT 'Дресс-код: вечерний наряд',
      contacts         TEXT DEFAULT 'По всем вопросам: +7 (999) 123-45-67',
      admin_password   TEXT NOT NULL DEFAULT 'wedding2025',
      game_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
      countdown_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      active_template  TEXT NOT NULL DEFAULT 'default',
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS wedding_tables (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      seats_count INTEGER NOT NULL DEFAULT 8,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      note        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id                  SERIAL PRIMARY KEY,
      first_name          TEXT NOT NULL,
      last_name           TEXT NOT NULL,
      salutation_type     TEXT NOT NULL DEFAULT 'Дорогой',
      guests_count        INTEGER NOT NULL DEFAULT 1,
      slug                TEXT NOT NULL UNIQUE,
      invitation_opened   BOOLEAN NOT NULL DEFAULT FALSE,
      game_completed      BOOLEAN NOT NULL DEFAULT FALSE,
      primary_first_name  TEXT,
      secondary_first_name TEXT,
      shared_last_name    TEXT,
      couple_display_mode TEXT DEFAULT 'first_names_only',
      rsvp_status         TEXT NOT NULL DEFAULT 'pending',
      rsvp_comment        TEXT,
      table_id            INTEGER,
      seat_number         INTEGER,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id          SERIAL PRIMARY KEY,
      guest_id    INTEGER NOT NULL,
      guest_name  TEXT NOT NULL,
      event_type  TEXT NOT NULL,
      payload     TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ─── основная логика ────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();

  try {
    console.log("  → Проверка схемы базы данных...");
    await ensureTables(client);

    const { rows: existingGuests } = await client.query("SELECT id FROM guests LIMIT 1");
    const alreadySeeded = existingGuests.length > 0;

    if (!alreadySeeded) {
      console.log("  → Создание тестовых столов...");

      const { rows: tables } = await client.query(`
        INSERT INTO wedding_tables (name, seats_count, sort_order, note)
        VALUES
          ('Стол 1 — Друзья невесты', 8, 1, NULL),
          ('Стол 2 — Друзья жениха',  8, 2, NULL),
          ('VIP-стол — Семья',        6, 0, 'Ближайшие родственники')
        RETURNING id, name
      `);

      const tableId = tables[0]?.id ?? null;

      console.log("  → Создание тестовых гостей...");

      const guests = [
        { first: "Мария",   last: "Петрова",   salutation: "Дорогая",  count: 1, table: tableId, seat: 1 },
        { first: "Иван",    last: "Сидоров",   salutation: "Дорогой",  count: 1, table: tableId, seat: 2 },
        { first: "Елена",   last: "Волкова",   salutation: "Дорогая",  count: 1, table: null,    seat: null },
        { first: "Алексей", last: "Новиков",   salutation: "Дорогой",  count: 3, table: tableId, seat: 3 },
      ];

      for (const g of guests) {
        const slug = makeSlug(g.first, g.last);
        await client.query(`
          INSERT INTO guests
            (first_name, last_name, salutation_type, guests_count, slug, table_id, seat_number)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [g.first, g.last, g.salutation, g.count, slug, g.table, g.seat]);
      }

      // Пара (Дорогие)
      const coupleSlug = makeSlug("Светлана-Дмитрий", "Кузнецовы");
      await client.query(`
        INSERT INTO guests
          (first_name, last_name, salutation_type, guests_count, slug,
           primary_first_name, secondary_first_name, shared_last_name, couple_display_mode)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, ["Светлана", "Кузнецова", "Дорогие", 2, coupleSlug,
          "Светлана", "Дмитрий", "Кузнецовы", "full_shared_last_name"]);

      // Настройки (если нет)
      const { rows: existingSettings } = await client.query("SELECT id FROM settings LIMIT 1");
      if (existingSettings.length === 0) {
        await client.query("INSERT INTO settings DEFAULT VALUES");
      }

      console.log("  ✓ Тестовые данные созданы\n");
    } else {
      console.log("  → База уже содержит данные, пропускаем сид\n");
    }

    // Применить ADMIN_PASSWORD из env если задан
    const envPassword = process.env.ADMIN_PASSWORD;
    if (envPassword) {
      await client.query(
        "UPDATE settings SET admin_password = $1 WHERE id = (SELECT id FROM settings LIMIT 1)",
        [envPassword],
      );
    }

    // ─── Итоговая сводка ────────────────────────────────────────────────────
    const { rows: settings } = await client.query("SELECT admin_password FROM settings LIMIT 1");
    const { rows: guests }   = await client.query("SELECT first_name, last_name, slug FROM guests ORDER BY id");
    const { rows: tables }   = await client.query("SELECT name, seats_count FROM wedding_tables ORDER BY sort_order, id");
    const adminPassword = settings[0]?.admin_password ?? "wedding2025";

    console.log("");
    box("  СВАДЕБНЫЕ ПРИГЛАШЕНИЯ — ИТОГ УСТАНОВКИ  ");
    console.log("");

    console.log("  АДМИНИСТРАТОР");
    console.log(`    Страница:  ${BASE_URL}/admin`);
    console.log(`    Пароль:    ${adminPassword}`);
    console.log("");

    console.log("  ШАБЛОНЫ (предпросмотр)");
    console.log(`    Классический  →  ${BASE_URL}/preview/template/default`);
    console.log(`    Элегантный    →  ${BASE_URL}/preview/template/classic`);
    console.log(`    Цветочный     →  ${BASE_URL}/preview/template/floral`);
    console.log("");

    if (tables.length > 0) {
      console.log("  СТОЛЫ");
      for (const t of tables) {
        console.log(`    ${(t.name as string).padEnd(35)}(${t.seats_count} мест)`);
      }
      console.log("");
    }

    console.log("  ГОСТИ — ССЫЛКИ НА ПРИГЛАШЕНИЯ");
    const nameWidth = Math.max(...guests.map((g: any) => `${g.first_name} ${g.last_name}`.length), 20);
    for (const g of guests) {
      const name = `${g.first_name} ${g.last_name}`.padEnd(nameWidth);
      console.log(`    ${name}  →  ${BASE_URL}/invite/${g.slug}`);
    }

    console.log("");
    console.log("  " + "─".repeat(58));
    console.log("");

  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error("Ошибка сида:", err.message);
  process.exit(1);
});
