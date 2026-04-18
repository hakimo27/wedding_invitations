import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetGuestBySlug,
  useGetSettings,
  useMarkInvitationOpened,
  useSubmitRsvp,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FloatingPetals } from "@/components/FloatingPetals";
import Game from "@/components/Game";

export default function Invitation() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug;
  const { toast } = useToast();

  const { data: guest, isLoading: guestLoading, error: guestError } = useGetGuestBySlug(
    slug || "",
    { query: { enabled: !!slug } }
  );

  const { data: settings, isLoading: settingsLoading } = useGetSettings();
  const markOpened = useMarkInvitationOpened();
  const submitRsvp = useSubmitRsvp();

  const [step, setStep] = useState<"welcome" | "game" | "invitation">("welcome");
  const [rsvpComment, setRsvpComment] = useState("");

  const hasMarkedRef = useRef(false);
  const markMutateRef = useRef(markOpened.mutate);
  markMutateRef.current = markOpened.mutate;

  useEffect(() => {
    if (guest && !hasMarkedRef.current) {
      hasMarkedRef.current = true;
      if (!guest.invitationOpened) {
        markMutateRef.current({ id: guest.id });
      }
    }
  }, [guest]);

  useEffect(() => {
    if (guest && settings) {
      const skipGame = !settings.gameEnabled || guest.gameCompleted;
      if (skipGame && step === "welcome") {
        // just leave on welcome — user taps the button
      }
    }
  }, [guest, settings, step]);

  useEffect(() => {
    if (!guest || !settings) return;
    const title = `Приглашение для ${guest.firstName} — ${settings.brideName} & ${settings.groomName}`;
    const description = `${guest.salutationType} ${guest.firstName}, вас приглашают на свадебное торжество ${settings.brideName} и ${settings.groomName}`;
    const url = window.location.href;

    document.title = title;
    const setMeta = (id: string, attr: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, value);
    };
    setMeta("meta-description", "content", description);
    setMeta("og-title", "content", title);
    setMeta("og-description", "content", description);
    setMeta("og-url", "content", url);
    setMeta("twitter-title", "content", title);
    setMeta("twitter-description", "content", description);
  }, [guest, settings]);

  const handleStartGame = () => setStep("game");
  const handleGameComplete = () => setStep("invitation");

  const handleRsvp = (status: "attending" | "not_attending") => {
    if (!guest) return;
    submitRsvp.mutate(
      { id: guest.id, data: { rsvpStatus: status, rsvpComment } },
      {
        onSuccess: () => {
          toast({
            title: "Спасибо!",
            description:
              status === "attending" ? "С нетерпением ждём вас!" : "Нам будет вас не хватать.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Не удалось отправить ответ.",
          });
        },
      }
    );
  };

  if (guestLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (guestError || !guest || !settings) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-4xl font-serif text-primary">Приглашение не найдено</div>
        <p className="text-primary/60 max-w-sm">
          Проверьте правильность ссылки или обратитесь к организатору.
        </p>
      </div>
    );
  }

  const showGame = settings.gameEnabled && !guest.gameCompleted;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-accent/30 text-primary">
      <FloatingPetals />

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6 opacity-60">
                <path d="M32 54 C32 54 6 38 6 22 C6 13 12 6 20 6 C25 6 29 9 32 13 C35 9 39 6 44 6 C52 6 58 13 58 22 C58 38 32 54 32 54Z" fill="#C9A96E" opacity="0.7"/>
              </svg>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-6xl font-serif text-primary mb-4 drop-shadow-sm"
            >
              Здравствуйте,<br className="sm:hidden" /> {guest.firstName}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-base md:text-xl text-primary/70 max-w-md mb-10 leading-relaxed px-2"
            >
              Мы рады пригласить вас на наше торжество.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {showGame ? (
                <Button
                  onClick={handleStartGame}
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
                  data-testid="button-start-game"
                >
                  Открыть приглашение
                </Button>
              ) : (
                <Button
                  onClick={() => setStep("invitation")}
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
                  data-testid="button-open-invitation"
                >
                  Открыть приглашение
                </Button>
              )}
            </motion.div>
            {showGame && (
              <p className="mt-4 text-xs text-primary/40">Вас ждёт небольшое задание</p>
            )}
          </motion.div>
        )}

        {step === "game" && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative z-10"
          >
            <div className="w-full max-w-3xl mx-auto h-[85vh] max-h-[680px] bg-white/40 p-2 sm:p-3 rounded-2xl backdrop-blur-md shadow-2xl border border-white/50">
              <Game guestId={guest.id} guestSlug={guest.slug} onComplete={handleGameComplete} />
            </div>
          </motion.div>
        )}

        {step === "invitation" && (
          <motion.div
            key="invitation"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="min-h-screen py-10 px-4 relative z-10"
          >
            <div className="max-w-2xl mx-auto space-y-10">

              <div className="text-center space-y-5 pt-10">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl md:text-2xl font-serif italic text-accent"
                >
                  {guest.salutationType} {guest.firstName},
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="py-6"
                >
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-primary tracking-wide leading-tight">
                    {settings.brideName}{" "}
                    <span className="text-accent">&amp;</span>{" "}
                    {settings.groomName}
                  </h1>
                </motion.div>
                <div className="h-px w-28 bg-accent/40 mx-auto" />
                <p className="text-sm md:text-base font-sans tracking-widest uppercase mt-4 text-primary/70">
                  Приглашают вас
                </p>
              </div>

              <Card className="glass-card border-0 shadow-2xl overflow-hidden rounded-3xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20 pointer-events-none" />
                <CardContent className="p-6 sm:p-8 md:p-12 relative space-y-10 text-center">

                  <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-serif text-primary">{settings.weddingTitle}</h2>
                    <p className="text-base md:text-xl leading-relaxed text-primary/80">{settings.invitationText}</p>
                    <div className="py-5 flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-serif">
                        {settings.weddingDate.split("-").reverse().join(".")}
                      </div>
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
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${settings.venueLng - 0.01},${settings.venueLat - 0.01},${settings.venueLng + 0.01},${settings.venueLat + 0.01}&layer=mapnik&marker=${settings.venueLat},${settings.venueLng}`}
                        title="Карта"
                      />
                    </div>
                  </div>

                  {(settings.dressCode || settings.contacts) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left border-t border-accent/20 pt-8">
                      {settings.dressCode && (
                        <div>
                          <h4 className="font-serif text-lg md:text-xl mb-2 text-accent">Дресс-код</h4>
                          <p className="text-sm leading-relaxed text-primary/80">{settings.dressCode}</p>
                        </div>
                      )}
                      {settings.contacts && (
                        <div>
                          <h4 className="font-serif text-lg md:text-xl mb-2 text-accent">Контакты</h4>
                          <p className="text-sm leading-relaxed text-primary/80">{settings.contacts}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-xl rounded-3xl">
                <CardContent className="p-6 sm:p-8 md:p-12 text-center space-y-6">
                  <h3 className="text-2xl md:text-3xl font-serif text-primary">Присутствие</h3>
                  <p className="text-primary/70 text-sm md:text-base">
                    Пожалуйста, подтвердите ваше присутствие, чтобы мы могли всё подготовить.
                  </p>

                  {guest.rsvpStatus !== "pending" && (
                    <div className="p-3 bg-white/50 rounded-xl inline-block">
                      <span className="text-sm font-semibold">Ваш ответ: </span>
                      <span
                        className={
                          guest.rsvpStatus === "attending" ? "text-green-600" : "text-red-500"
                        }
                      >
                        {guest.rsvpStatus === "attending" ? "С радостью приду" : "К сожалению, не смогу"}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 max-w-md mx-auto">
                    <Textarea
                      placeholder="Комментарий (опционально)..."
                      value={rsvpComment}
                      onChange={(e) => setRsvpComment(e.target.value)}
                      className="bg-white/50 border-accent/30 focus-visible:ring-accent resize-none rounded-xl"
                      rows={3}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleRsvp("attending")}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl py-5 text-sm md:text-base"
                        disabled={submitRsvp.isPending}
                        data-testid="button-rsvp-yes"
                      >
                        С радостью приду
                      </Button>
                      <Button
                        onClick={() => handleRsvp("not_attending")}
                        variant="outline"
                        className="border-accent text-accent hover:bg-accent/10 rounded-xl py-5 text-sm md:text-base"
                        disabled={submitRsvp.isPending}
                        data-testid="button-rsvp-no"
                      >
                        Не смогу
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="pb-12 text-center text-primary/40 font-serif italic">
                Ждём встречи с вами!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountdownTimer({ date, time }: { date: string; time: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date(`${date}T${time}`).getTime();
    const tick = () => {
      const distance = targetDate - Date.now();
      if (distance < 0) return;
      setTimeLeft({
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [date, time]);

  return (
    <div className="flex justify-center gap-3 sm:gap-6 md:gap-10">
      <TimeUnit value={timeLeft.days} label="Дней" />
      <TimeUnit value={timeLeft.hours} label="Часов" />
      <TimeUnit value={timeLeft.minutes} label="Минут" />
      <TimeUnit value={timeLeft.seconds} label="Секунд" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl sm:text-3xl md:text-5xl font-serif text-primary mb-1 min-w-[2.2ch] text-center tabular-nums">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
