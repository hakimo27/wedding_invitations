import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FloatingPetals } from "@/components/FloatingPetals";
import { getGreeting, type TemplateProps } from "./types";

export default function DefaultTemplate({ guest, settings, onRsvp, rsvpPending }: TemplateProps) {
  const [comment, setComment] = useState(guest.rsvpComment ?? "");
  const greeting = getGreeting(guest);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-accent/30 text-primary">
      <FloatingPetals />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="min-h-screen py-10 px-4 relative z-10"
      >
        <div className="max-w-2xl mx-auto space-y-10">

          <div className="text-center space-y-5 pt-10">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl font-serif italic text-accent">
              {greeting},
            </motion.p>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="py-6">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-primary tracking-wide leading-tight">
                {settings.brideName} <span className="text-accent">&amp;</span> {settings.groomName}
              </h1>
            </motion.div>
            <div className="h-px w-28 bg-accent/40 mx-auto" />
            <p className="text-sm md:text-base font-sans tracking-widest uppercase mt-4 text-primary/70">Приглашают вас</p>
          </div>

          <Card className="glass-card border-0 shadow-2xl overflow-hidden rounded-3xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20 pointer-events-none" />
            <CardContent className="p-6 sm:p-8 md:p-12 relative space-y-10 text-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-serif text-primary">{settings.weddingTitle}</h2>
                <p className="text-base md:text-xl leading-relaxed text-primary/80">{settings.invitationText}</p>
                <div className="py-5 flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-serif">{settings.weddingDate.split("-").reverse().join(".")}</div>
                  <div className="hidden sm:block w-px h-10 bg-accent/40" />
                  <div className="text-2xl sm:text-3xl md:text-4xl font-serif">{settings.weddingTime}</div>
                </div>
              </div>

              {settings.countdownEnabled && (
                <div className="py-6 border-y border-accent/20">
                  <CountdownTimer date={settings.weddingDate} time={settings.weddingTime} />
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-serif text-primary">Место проведения</h3>
                <p className="text-base md:text-lg font-semibold">{settings.venueName}</p>
                <p className="text-sm text-muted-foreground">{settings.venueAddress}</p>
                <div className="w-full h-52 sm:h-64 mt-4 rounded-xl overflow-hidden border border-accent/20 shadow-inner">
                  <iframe width="100%" height="100%" frameBorder="0" scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${settings.venueLng - 0.01},${settings.venueLat - 0.01},${settings.venueLng + 0.01},${settings.venueLat + 0.01}&layer=mapnik&marker=${settings.venueLat},${settings.venueLng}`}
                    title="Карта" />
                </div>
              </div>

              {(settings.dressCode || settings.contacts) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left border-t border-accent/20 pt-8">
                  {settings.dressCode && <div><h4 className="font-serif text-lg md:text-xl mb-2 text-accent">Дресс-код</h4><p className="text-sm leading-relaxed text-primary/80">{settings.dressCode}</p></div>}
                  {settings.contacts && <div><h4 className="font-serif text-lg md:text-xl mb-2 text-accent">Контакты</h4><p className="text-sm leading-relaxed text-primary/80">{settings.contacts}</p></div>}
                </div>
              )}
            </CardContent>
          </Card>

          <RsvpCard guest={guest} onRsvp={onRsvp} rsvpPending={rsvpPending} comment={comment} setComment={setComment} theme="default" />

          <div className="pb-12 text-center text-primary/40 font-serif italic">Ждём встречи с вами!</div>
        </div>
      </motion.div>
    </div>
  );
}

function RsvpCard({ guest, onRsvp, rsvpPending, comment, setComment, theme }: any) {
  const colors = theme === "classic"
    ? { card: "bg-[#FAF7F0] border border-[#D4AF37]/30 shadow-xl rounded-2xl", btn1: "bg-[#1C2B4A] hover:bg-[#1C2B4A]/90 text-white", btn2: "border-[#D4AF37] text-[#1C2B4A] hover:bg-[#D4AF37]/10" }
    : theme === "floral"
    ? { card: "bg-[#FDF0F4] border border-[#E8A0B4]/30 shadow-xl rounded-3xl", btn1: "bg-[#8B4458] hover:bg-[#8B4458]/90 text-white", btn2: "border-[#E8A0B4] text-[#8B4458] hover:bg-[#E8A0B4]/10" }
    : { card: "glass-card border-0 shadow-xl rounded-3xl", btn1: "bg-primary hover:bg-primary/90 text-white", btn2: "border-accent text-accent hover:bg-accent/10" };

  return (
    <div className={colors.card + " p-6 sm:p-8 md:p-12 text-center space-y-6"}>
      <h3 className="text-2xl md:text-3xl font-serif">Ваш ответ</h3>
      <p className="text-sm md:text-base opacity-70">Пожалуйста, подтвердите ваше присутствие, чтобы мы могли всё подготовить.</p>
      {guest.rsvpStatus !== "pending" && (
        <div className="p-3 bg-white/50 rounded-xl inline-block">
          <span className="text-sm font-semibold">Ваш ответ: </span>
          <span className={guest.rsvpStatus === "attending" ? "text-green-600" : "text-red-500"}>
            {guest.rsvpStatus === "attending" ? "С радостью приду" : "К сожалению, не смогу"}
          </span>
        </div>
      )}
      <div className="space-y-4 max-w-md mx-auto">
        <Textarea placeholder="Комментарий..." value={comment} onChange={(e) => setComment(e.target.value)}
          className="bg-white/50 border-accent/30 focus-visible:ring-accent resize-none rounded-xl" rows={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={() => onRsvp("attending", comment)} className={`${colors.btn1} rounded-xl py-5`} disabled={rsvpPending} data-testid="button-rsvp-yes">
            С радостью приду
          </Button>
          <Button onClick={() => onRsvp("not_attending", comment)} variant="outline" className={`${colors.btn2} rounded-xl py-5`} disabled={rsvpPending} data-testid="button-rsvp-no">
            Не смогу
          </Button>
        </div>
      </div>
    </div>
  );
}

function CountdownTimer({ date, time }: { date: string; time: string }) {
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
    <div className="flex justify-center gap-3 sm:gap-6 md:gap-10">
      {[{ v: t.days, l: "Дней" }, { v: t.hours, l: "Часов" }, { v: t.minutes, l: "Минут" }, { v: t.seconds, l: "Секунд" }].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <div className="text-2xl sm:text-3xl md:text-5xl font-serif text-primary mb-1 min-w-[2.2ch] text-center tabular-nums">{v.toString().padStart(2, "0")}</div>
          <div className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-muted-foreground">{l}</div>
        </div>
      ))}
    </div>
  );
}
