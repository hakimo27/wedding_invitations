import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { getGreeting, type TemplateProps } from "./types";

const ROSE = "#8B4458";
const BLUSH = "#FDF0F4";
const PINK = "#E8A0B4";
const MAUVE = "#C47A8A";

function FloralDecor({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} style={style}>
      <ellipse cx="30" cy="30" rx="14" ry="22" fill={PINK} fillOpacity="0.35" transform="rotate(-30 30 30)" />
      <ellipse cx="60" cy="15" rx="12" ry="20" fill={MAUVE} fillOpacity="0.28" transform="rotate(15 60 15)" />
      <ellipse cx="90" cy="35" rx="13" ry="21" fill={PINK} fillOpacity="0.3" transform="rotate(-20 90 35)" />
      <ellipse cx="45" cy="45" rx="10" ry="18" fill={ROSE} fillOpacity="0.2" transform="rotate(40 45 45)" />
      <circle cx="30" cy="30" r="7" fill={MAUVE} fillOpacity="0.5" />
      <circle cx="60" cy="15" r="6" fill={ROSE} fillOpacity="0.45" />
      <circle cx="90" cy="35" r="7" fill={MAUVE} fillOpacity="0.45" />
    </svg>
  );
}

export default function FloralTemplate({ guest, settings, onRsvp, rsvpPending }: TemplateProps) {
  const [comment, setComment] = useState(guest.rsvpComment ?? "");
  const greeting = getGreeting(guest);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: `linear-gradient(160deg, ${BLUSH} 0%, #FAE8F0 50%, #FDF5F8 100%)`, color: ROSE }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <FloralDecor className="absolute top-0 left-0 w-48 opacity-40" style={{ transform: "rotate(0deg)" }} />
        <FloralDecor className="absolute top-0 right-0 w-48 opacity-40" style={{ transform: "scaleX(-1)" }} />
        <FloralDecor className="absolute bottom-0 left-0 w-36 opacity-30" style={{ transform: "scaleY(-1)" }} />
        <FloralDecor className="absolute bottom-0 right-0 w-36 opacity-30" style={{ transform: "scale(-1,-1)" }} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}
        className="min-h-screen py-12 px-4 relative z-10">
        <div className="max-w-xl mx-auto space-y-10">

          <div className="text-center space-y-4 pt-12">
            <FloralDecor className="w-40 mx-auto opacity-60" />

            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: MAUVE, fontStyle: "italic" }}>
              {greeting},
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}>
              <h1 style={{ fontFamily: "Georgia, 'Palatino', serif", color: ROSE, fontSize: "clamp(2rem, 7vw, 4rem)", lineHeight: 1.2, fontWeight: 400 }}>
                {settings.brideName}
                <br />
                <span style={{ color: PINK, fontSize: "0.6em" }}>& </span>
                <br />
                {settings.groomName}
              </h1>
            </motion.div>

            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${PINK})` }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill={PINK}><path d="M12 21s-8-5.5-8-11C4 6.686 7.134 4 10 4c1.06 0 2.23.46 3 1.3C13.77 4.46 14.94 4 16 4c2.866 0 6 2.686 6 6 0 5.5-8 11-8 11z"/></svg>
              <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${PINK})` }} />
            </div>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.25em", color: MAUVE, opacity: 0.8, textTransform: "uppercase" as const }}>приглашают вас</p>
          </div>

          <FloralCard>
            <div className="space-y-5 text-center">
              <h2 style={{ fontFamily: "Georgia, serif", color: ROSE, fontSize: "1.4rem", fontWeight: 400 }}>{settings.weddingTitle}</h2>
              <p style={{ color: ROSE, opacity: 0.85, lineHeight: 1.8, fontSize: "1rem" }}>{settings.invitationText}</p>

              <div className="py-4 flex flex-wrap justify-center items-center gap-5">
                <div className="text-center">
                  <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: MAUVE, opacity: 0.7, textTransform: "uppercase" as const, marginBottom: 4 }}>Дата</div>
                  <div style={{ fontSize: "1.8rem", color: ROSE, fontFamily: "Georgia, serif" }}>{settings.weddingDate.split("-").reverse().join(".")}</div>
                </div>
                <svg width="1" height="40" viewBox="0 0 1 40" className="hidden sm:block"><line x1="0.5" y1="0" x2="0.5" y2="40" stroke={PINK} strokeOpacity="0.5" /></svg>
                <div className="text-center">
                  <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: MAUVE, opacity: 0.7, textTransform: "uppercase" as const, marginBottom: 4 }}>Время</div>
                  <div style={{ fontSize: "1.8rem", color: ROSE, fontFamily: "Georgia, serif" }}>{settings.weddingTime}</div>
                </div>
              </div>
            </div>

            {settings.countdownEnabled && (
              <div className="py-5 border-y" style={{ borderColor: `${PINK}40` }}>
                <FloralCountdown date={settings.weddingDate} time={settings.weddingTime} />
              </div>
            )}

            <div className="space-y-3 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="1.5" className="mx-auto"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <h3 style={{ fontFamily: "Georgia, serif", color: ROSE, fontSize: "1.2rem", fontWeight: 400 }}>Место торжества</h3>
              <p style={{ fontWeight: 600, color: ROSE }}>{settings.venueName}</p>
              <p style={{ fontSize: "0.9rem", color: MAUVE, opacity: 0.8 }}>{settings.venueAddress}</p>
              <div className="w-full h-48 sm:h-56 mt-3 rounded-2xl overflow-hidden" style={{ border: `1px solid ${PINK}40` }}>
                <iframe width="100%" height="100%" frameBorder="0" scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${settings.venueLng - 0.01},${settings.venueLat - 0.01},${settings.venueLng + 0.01},${settings.venueLat + 0.01}&layer=mapnik&marker=${settings.venueLat},${settings.venueLng}`}
                  title="Карта" />
              </div>
            </div>

            {(settings.dressCode || settings.contacts) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left pt-4" style={{ borderTop: `1px solid ${PINK}30` }}>
                {settings.dressCode && (
                  <div>
                    <h4 style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: MAUVE, textTransform: "uppercase" as const, marginBottom: 6 }}>Дресс-код</h4>
                    <p style={{ fontSize: "0.9rem", color: ROSE, opacity: 0.85, lineHeight: 1.7 }}>{settings.dressCode}</p>
                  </div>
                )}
                {settings.contacts && (
                  <div>
                    <h4 style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: MAUVE, textTransform: "uppercase" as const, marginBottom: 6 }}>Контакты</h4>
                    <p style={{ fontSize: "0.9rem", color: ROSE, opacity: 0.85, lineHeight: 1.7 }}>{settings.contacts}</p>
                  </div>
                )}
              </div>
            )}
          </FloralCard>

          <FloralCard>
            <div className="text-center space-y-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill={PINK} className="mx-auto"><path d="M12 21s-8-5.5-8-11C4 6.686 7.134 4 10 4c1.06 0 2.23.46 3 1.3C13.77 4.46 14.94 4 16 4c2.866 0 6 2.686 6 6 0 5.5-8 11-8 11z"/></svg>
              <h3 style={{ fontFamily: "Georgia, serif", color: ROSE, fontSize: "1.5rem", fontWeight: 400 }}>Ваш ответ</h3>
              <p style={{ fontSize: "0.9rem", color: MAUVE, opacity: 0.85 }}>Пожалуйста, подтвердите своё присутствие.</p>
              {guest.rsvpStatus !== "pending" && (
                <div className="inline-block px-4 py-2 rounded-full text-sm" style={{ background: `${PINK}20`, color: ROSE }}>
                  Ваш ответ: <strong>{guest.rsvpStatus === "attending" ? "С радостью приду" : "К сожалению, нет"}</strong>
                </div>
              )}
              <div className="max-w-sm mx-auto space-y-3">
                <Textarea placeholder="Комментарий..." value={comment} onChange={(e) => setComment(e.target.value)}
                  className="resize-none rounded-2xl" style={{ background: "rgba(255,255,255,0.6)", borderColor: `${PINK}40` }} rows={3} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => onRsvp("attending", comment)} disabled={rsvpPending}
                    style={{ background: ROSE, color: "white", padding: "14px 20px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: "0.9rem", opacity: rsvpPending ? 0.7 : 1 }}>
                    С радостью приду
                  </button>
                  <button onClick={() => onRsvp("not_attending", comment)} disabled={rsvpPending}
                    style={{ background: "transparent", color: ROSE, padding: "14px 20px", borderRadius: 999, border: `1.5px solid ${PINK}`, cursor: "pointer", fontSize: "0.9rem", opacity: rsvpPending ? 0.7 : 1 }}>
                    К сожалению, нет
                  </button>
                </div>
              </div>
            </div>
          </FloralCard>

          <div className="pb-12 text-center space-y-2">
            <FloralDecor className="w-32 mx-auto opacity-40" style={{ transform: "scaleY(-1)" }} />
            <p style={{ color: MAUVE, opacity: 0.6, fontStyle: "italic", fontFamily: "Georgia, serif" }}>Ждём встречи с вами!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FloralCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-6 sm:p-8 space-y-6"
      style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)", border: `1px solid ${PINK}35`, boxShadow: `0 8px 32px ${PINK}20` }}>
      {children}
    </div>
  );
}

function FloralCountdown({ date, time }: { date: string; time: string }) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date(`${date}T${time}`).getTime();
    const tick = () => {
      const d = target - Date.now();
      if (d < 0) return;
      setT({ days: Math.floor(d / 86400000), hours: Math.floor((d % 86400000) / 3600000), minutes: Math.floor((d % 3600000) / 60000), seconds: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [date, time]);
  return (
    <div className="flex justify-center gap-4 sm:gap-8">
      {[{ v: t.days, l: "Дней" }, { v: t.hours, l: "Часов" }, { v: t.minutes, l: "Минут" }, { v: t.seconds, l: "Секунд" }].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div style={{ fontSize: "2rem", color: ROSE, fontFamily: "Georgia, serif", minWidth: "2.2ch" }} className="tabular-nums">{v.toString().padStart(2, "0")}</div>
          <div style={{ fontSize: "0.6rem", color: MAUVE, opacity: 0.75, letterSpacing: "0.2em", textTransform: "uppercase" as const }}>{l}</div>
        </div>
      ))}
    </div>
  );
}
