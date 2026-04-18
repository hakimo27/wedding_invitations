import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, guestsTable, activityLogsTable } from "@workspace/db";
import {
  CreateGuestBody,
  UpdateGuestBody,
  GetGuestParams,
  UpdateGuestParams,
  DeleteGuestParams,
  GetGuestBySlugParams,
  MarkInvitationOpenedParams,
  MarkGameCompletedParams,
  SubmitRsvpParams,
  SubmitRsvpBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function logActivity(
  guestId: number,
  guestName: string,
  eventType: string,
  payload?: string
) {
  try {
    await db.insert(activityLogsTable).values({ guestId, guestName, eventType, payload: payload ?? null });
  } catch {
    // non-critical, swallow
  }
}

function generateSlug(firstName: string, lastName: string): string {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",
        к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",
        ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",
        ю:"yu",я:"ya"
      };
      return map[ch] ?? ch;
    })
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

router.get("/guests/stats", async (req, res): Promise<void> => {
  const guests = await db.select().from(guestsTable);
  const attending = guests.filter((g) => g.rsvpStatus === "attending");
  const notAttending = guests.filter((g) => g.rsvpStatus === "not_attending");
  const pending = guests.filter((g) => g.rsvpStatus === "pending");
  const stats = {
    total: guests.length,
    attending: attending.length,
    notAttending: notAttending.length,
    pending: pending.length,
    gameCompleted: guests.filter((g) => g.gameCompleted).length,
    invitationOpened: guests.filter((g) => g.invitationOpened).length,
    totalPersons: guests.reduce((sum, g) => sum + g.guestsCount, 0),
    attendingPersons: attending.reduce((sum, g) => sum + g.guestsCount, 0),
    notAttendingPersons: notAttending.reduce((sum, g) => sum + g.guestsCount, 0),
    pendingPersons: pending.reduce((sum, g) => sum + g.guestsCount, 0),
  };
  res.json(stats);
});

router.get("/guests/slug/:slug", async (req, res): Promise<void> => {
  const params = GetGuestBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.slug, params.data.slug));
  if (!guest) {
    res.status(404).json({ error: "Гость не найден" });
    return;
  }
  res.json(guest);
});

router.get("/guests", async (_req, res): Promise<void> => {
  const guests = await db
    .select()
    .from(guestsTable)
    .orderBy(guestsTable.createdAt);
  res.json(guests);
});

router.post("/guests", async (req, res): Promise<void> => {
  const parsed = CreateGuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const slug = parsed.data.slug ?? generateSlug(parsed.data.firstName, parsed.data.lastName);
  const [guest] = await db
    .insert(guestsTable)
    .values({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      salutationType: parsed.data.salutationType,
      guestsCount: parsed.data.guestsCount ?? 1,
      slug,
    })
    .returning();
  res.status(201).json(guest);
});

router.get("/guests/:id", async (req, res): Promise<void> => {
  const params = GetGuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.id, params.data.id));
  if (!guest) {
    res.status(404).json({ error: "Гость не найден" });
    return;
  }
  res.json(guest);
});

router.patch("/guests/:id", async (req, res): Promise<void> => {
  const params = UpdateGuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [guest] = await db
    .update(guestsTable)
    .set(parsed.data)
    .where(eq(guestsTable.id, params.data.id))
    .returning();
  if (!guest) {
    res.status(404).json({ error: "Гость не найден" });
    return;
  }

  if (parsed.data.rsvpStatus && parsed.data.rsvpStatus !== "pending") {
    const guestName = `${guest.firstName} ${guest.lastName}`;
    const eventType = parsed.data.rsvpStatus === "attending" ? "rsvp_yes" : "rsvp_no";
    await logActivity(guest.id, guestName, eventType);
  }

  res.json(guest);
});

router.delete("/guests/:id", async (req, res): Promise<void> => {
  const params = DeleteGuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [guest] = await db
    .delete(guestsTable)
    .where(eq(guestsTable.id, params.data.id))
    .returning();
  if (!guest) {
    res.status(404).json({ error: "Гость не найден" });
    return;
  }
  res.sendStatus(204);
});

router.post("/guests/:id/open-invitation", async (req, res): Promise<void> => {
  const params = MarkInvitationOpenedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(guestsTable).where(eq(guestsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Гость не найден" }); return; }

  const [guest] = await db
    .update(guestsTable)
    .set({ invitationOpened: true })
    .where(eq(guestsTable.id, params.data.id))
    .returning();

  if (!existing.invitationOpened) {
    await logActivity(guest.id, `${guest.firstName} ${guest.lastName}`, "invitation_opened");
  }
  res.json(guest);
});

router.post("/guests/:id/complete-game", async (req, res): Promise<void> => {
  const params = MarkGameCompletedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(guestsTable).where(eq(guestsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Гость не найден" }); return; }

  const [guest] = await db
    .update(guestsTable)
    .set({ gameCompleted: true })
    .where(eq(guestsTable.id, params.data.id))
    .returning();

  if (!existing.gameCompleted) {
    await logActivity(guest.id, `${guest.firstName} ${guest.lastName}`, "game_completed");
  }
  res.json(guest);
});

router.post("/guests/:id/rsvp", async (req, res): Promise<void> => {
  const params = SubmitRsvpParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SubmitRsvpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [guest] = await db
    .update(guestsTable)
    .set({
      rsvpStatus: parsed.data.rsvpStatus,
      rsvpComment: parsed.data.rsvpComment ?? null,
    })
    .where(eq(guestsTable.id, params.data.id))
    .returning();
  if (!guest) {
    res.status(404).json({ error: "Гость не найден" });
    return;
  }

  const eventType = parsed.data.rsvpStatus === "attending" ? "rsvp_yes" : "rsvp_no";
  await logActivity(
    guest.id,
    `${guest.firstName} ${guest.lastName}`,
    eventType,
    parsed.data.rsvpComment ?? undefined
  );

  res.json(guest);
});

export default router;
