import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getGreeting, type TemplateProps } from "./types";

export default function ClassicTemplate({ guest, settings, onRsvp, rsvpPending }: TemplateProps) {
  const [comment, setComment] = useState(guest.rsvpComment ?? "");
  const greeting = getGreeting(guest);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "linear-gradient(135deg, #FAF7F0 0%, #F0E8D8 100%)", color: "#1C2B4A" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute text-[#D4AF37] text-5xl"
            style={{ left: `${(i % 4) * 26 + 2}%`, top: `${Math.floor(i / 4) * 35 + 5}%`, transform: `rotate(${i * 30}deg)`, fontSize: "3rem" }}>
            ✦
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
        className="min-h-screen py-12 px-4 relative z-10">
        <div className="max-w-2xl mx-auto space-y-10">

          <div className="text-center space-y-6 pt-10">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
              <span className="text-[#D4AF37] text-2xl">✦</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
            </div>

            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl italic" style={{ color: "#D4AF37", fontFamily: "Georgia, serif" }}>
              {greeting},
            </motion.p>

            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.7 }}>
              <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#1C2B4A", fontSize: "clamp(2.2rem, 6vw, 4.5rem)", letterSpacing: "0.08em", lineHeight: 1.15, fontWeight: 400 }}>
                {settings.brideName}
                <br />
                <span style={{ color: "#D4AF37", fontSize: "0.6em", letterSpacing: "0.2em" }}>& </span>
                <br />
                {settings.groomName}
              </h1>
            </motion.div>

            <div className="flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
              <span style={{ color: "#D4AF37", fontSize: "0.7rem", letterSpacing: "0.3em" }}>✦ ПРИГЛАШАЮТ ВАС ✦</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
            </div>
          </div>

          <div className="border border-[#D4AF37]/30 rounded-none p-8 sm:p-10 md:p-14 space-y-10 text-center relative"
            style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)" }}>
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]/50" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]/50" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]/50" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]/50" />

            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl tracking-widest uppercase" style={{ color: "#D4AF37", fontFamily: "Georgia, serif", letterSpacing: "0.15em", fontWeight: 400 }}>
                {settings.weddingTitle}
              </h2>
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "#1C2B4A", opacity: 0.85 }}>{settings.invitationText}</p>

              <div className="py-6 flex flex-wrap justify-center items-center gap-6">
                <div className="text-center">
                  <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "#D4AF37", opacity: 0.8 }}>Дата</div>
                  <div className="text-2xl sm:text-3xl font-serif" style={{ color: "#1C2B4A" }}>{settings.weddingDate.split("-").reverse().join(".")}</div>
                </div>
                <div className="w-px h-12 bg-[#D4AF37]/30 hidden sm:block" />
                <div className="text-center">
                  <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "#D4AF37", opacity: 0.8 }}>Время</div>
                  <div className="text-2xl sm:text-3xl font-serif" style={{ color: "#1C2B4A" }}>{settings.weddingTime}</div>
                </div>
              </div>
            </div>

            {settings.countdownEnabled && (
              <div className="py-6 border-y border-[#D4AF37]/20">
                <div className="text-xs tracking-widest uppercase mb-4" style={{ color: "#D4AF37", opacity: 0.7 }}>До торжества</div>
                <ClassicCountdown date={settings.weddingDate} time={settings.weddingTime} />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#D4AF37]/30" />
                <h3 className="text-sm tracking-widest uppercase" style={{ color: "#D4AF37" }}>Место проведения</h3>
                <div className="h-px flex-1 bg-[#D4AF37]/30" />
              </div>
              <p className="text-lg font-semibold" style={{ color: "#1C2B4A" }}>{settings.venueName}</p>
              <p className="text-sm" style={{ color: "#1C2B4A", opacity: 0.7 }}>{settings.venueAddress}</p>
              <div className="w-full h-52 sm:h-64 mt-4 rounded overflow-hidden border border-[#D4AF37]/20">
                <iframe width="100%" height="100%" frameBorder="0" scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${settings.venueLng - 0.01},${settings.venueLat - 0.01},${settings.venueLng + 0.01},${settings.venueLat + 0.01}&layer=mapnik&marker=${settings.venueLat},${settings.venueLng}`}
                  title="Карта" />
              </div>
            </div>

            {(settings.dressCode || settings.contacts) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left pt-4 border-t border-[#D4AF37]/20">
                {settings.dressCode && (
                  <div>
                    <h4 className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>Дресс-код</h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#1C2B4A", opacity: 0.85 }}>{settings.dressCode}</p>
                  </div>
                )}
                {settings.contacts && (
                  <div>
                    <h4 className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>Контакты</h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#1C2B4A", opacity: 0.85 }}>{settings.contacts}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-[#D4AF37]/30 p-8 sm:p-10 text-center space-y-6 relative"
            style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)" }}>
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37]/40" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37]/40" />
            <h3 className="text-xl tracking-widest uppercase" style={{ color: "#1C2B4A", fontFamily: "Georgia, serif" }}>Подтверждение</h3>
            <p className="text-sm" style={{ color: "#1C2B4A", opacity: 0.7 }}>Пожалуйста, подтвердите ваше присутствие.</p>
            {guest.rsvpStatus !== "pending" && (
              <div className="inline-block px-4 py-2 border border-[#D4AF37]/40 text-sm">
                <span>Ваш ответ: </span>
                <span className={guest.rsvpStatus === "attending" ? "text-green-700" : "text-red-600"}>
                  {guest.rsvpStatus === "attending" ? "С радостью приду" : "К сожалению, не смогу"}
                </span>
              </div>
            )}
            <div className="max-w-md mx-auto space-y-3">
              <Textarea placeholder="Комментарий..." value={comment} onChange={(e) => setComment(e.target.value)}
                className="bg-white/50 resize-none rounded-none border-[#D4AF37]/30" rows={3} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => onRsvp("attending", comment)} disabled={rsvpPending}
                  style={{ background: "#1C2B4A", color: "white", padding: "14px 24px", fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, border: "none", cursor: "pointer", opacity: rsvpPending ? 0.7 : 1 }}>
                  С радостью приду
                </button>
                <button onClick={() => onRsvp("not_attending", comment)} disabled={rsvpPending}
                  style={{ background: "transparent", color: "#1C2B4A", padding: "14px 24px", fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, border: "1px solid #D4AF37", cursor: "pointer", opacity: rsvpPending ? 0.7 : 1 }}>
                  К сожалению, нет
                </button>
              </div>
            </div>
          </div>

          <div className="pb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12 bg-[#D4AF37]/40" />
              <span className="text-[#D4AF37]">✦</span>
              <div className="h-px w-12 bg-[#D4AF37]/40" />
            </div>
            <p style={{ color: "#1C2B4A", opacity: 0.5, fontStyle: "italic", fontFamily: "Georgia, serif" }}>Ждём встречи с вами</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ClassicCountdown({ date, time }: { date: string; time: string }) {
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
    <div className="flex justify-center gap-6 sm:gap-10">
      {[{ v: t.days, l: "Дней" }, { v: t.hours, l: "Часов" }, { v: t.minutes, l: "Минут" }, { v: t.seconds, l: "Секунд" }].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <div className="text-3xl sm:text-4xl tabular-nums" style={{ color: "#1C2B4A", fontFamily: "Georgia, serif" }}>{v.toString().padStart(2, "0")}</div>
          <div className="text-[10px] tracking-widest uppercase mt-1" style={{ color: "#D4AF37", opacity: 0.8 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}
