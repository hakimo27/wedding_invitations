import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useGetGuestBySlug, 
  useGetSettings, 
  useMarkInvitationOpened,
  useSubmitRsvp
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FloatingPetals } from "@/components/FloatingPetals";
import Game from "@/components/Game";

export default function Invitation() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug;
  const { toast } = useToast();

  const { data: guest, isLoading: guestLoading, error: guestError } = useGetGuestBySlug(slug || "", {
    query: { enabled: !!slug }
  });

  const { data: settings, isLoading: settingsLoading } = useGetSettings();
  const markOpened = useMarkInvitationOpened();
  const submitRsvp = useSubmitRsvp();

  const [step, setStep] = useState<"welcome" | "game" | "invitation">("welcome");
  const [rsvpComment, setRsvpComment] = useState("");

  useEffect(() => {
    if (guest && !guest.invitationOpened) {
      markOpened.mutate({ id: guest.id });
    }
  }, [guest, markOpened]);

  useEffect(() => {
    if (guest && settings) {
      if (settings.gameEnabled && !guest.gameCompleted) {
        // stay on welcome, button to start game
      } else {
        // if game disabled or already completed, skip game step
        if (step === "game") setStep("invitation");
      }
    }
  }, [guest, settings, step]);

  const handleStartGame = () => {
    setStep("game");
  };

  const handleGameComplete = () => {
    setStep("invitation");
  };

  const handleRsvp = (status: "attending" | "not_attending") => {
    if (!guest) return;
    submitRsvp.mutate(
      { id: guest.id, data: { rsvpStatus: status, rsvpComment } },
      {
        onSuccess: () => {
          toast({
            title: "Спасибо!",
            description: status === "attending" ? "С нетерпением ждем вас!" : "Нам будет вас не хватать.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Не удалось отправить ответ.",
          });
        }
      }
    );
  };

  if (guestLoading || settingsLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (guestError || !guest || !settings) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-serif text-2xl text-primary">
      Приглашение не найдено
    </div>;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-accent/30 text-primary">
      <FloatingPetals />
      
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10 text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif text-primary mb-6 drop-shadow-sm">
              Здравствуйте, {guest.firstName}!
            </h1>
            <p className="text-lg md:text-xl text-primary/80 max-w-lg mb-12 leading-relaxed">
              Мы рады пригласить вас на наше торжество.
            </p>
            {settings.gameEnabled && !guest.gameCompleted ? (
              <Button 
                onClick={handleStartGame}
                className="bg-accent hover:bg-accent/90 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
                data-testid="button-start-game"
              >
                Открыть приглашение
              </Button>
            ) : (
              <Button 
                onClick={() => setStep("invitation")}
                className="bg-accent hover:bg-accent/90 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
                data-testid="button-open-invitation"
              >
                Открыть приглашение
              </Button>
            )}
          </motion.div>
        )}

        {step === "game" && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 relative z-10"
          >
            <div className="w-full max-w-4xl mx-auto h-[80vh] bg-white/40 p-2 rounded-2xl backdrop-blur-md shadow-2xl border border-white/50">
              <Game guestId={guest.id} guestSlug={guest.slug} onComplete={handleGameComplete} />
            </div>
          </motion.div>
        )}

        {step === "invitation" && (
          <motion.div
            key="invitation"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="min-h-screen py-12 px-4 relative z-10"
          >
            <div className="max-w-2xl mx-auto space-y-12">
              
              {/* Header Section */}
              <div className="text-center space-y-6 pt-12">
                <p className="text-2xl font-serif italic text-accent">{guest.salutationType} {guest.firstName},</p>
                <div className="py-8">
                  <h1 className="text-5xl md:text-7xl font-serif text-primary tracking-wide">
                    {settings.brideName} <span className="text-accent">&</span> {settings.groomName}
                  </h1>
                </div>
                <div className="h-px w-32 bg-accent/50 mx-auto"></div>
                <p className="text-lg md:text-xl font-sans tracking-widest uppercase mt-6">
                  Приглашают вас
                </p>
              </div>

              {/* Main Content Card */}
              <Card className="glass-card border-0 shadow-2xl overflow-hidden rounded-3xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20 pointer-events-none"></div>
                <CardContent className="p-8 md:p-12 relative space-y-12 text-center">
                  
                  {/* Date & Time */}
                  <div className="space-y-4">
                    <h2 className="text-3xl font-serif text-primary">{settings.weddingTitle}</h2>
                    <p className="text-xl">{settings.invitationText}</p>
                    <div className="py-6 flex justify-center items-center gap-6">
                      <div className="text-2xl md:text-4xl font-serif">{settings.weddingDate.split("-").reverse().join(".")}</div>
                      <div className="w-px h-12 bg-accent/50"></div>
                      <div className="text-2xl md:text-4xl font-serif">{settings.weddingTime}</div>
                    </div>
                  </div>

                  {/* Countdown */}
                  {settings.countdownEnabled && (
                    <div className="py-8 border-y border-accent/20">
                      <CountdownTimer date={settings.weddingDate} time={settings.weddingTime} />
                    </div>
                  )}

                  {/* Venue */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-serif text-primary">Место проведения</h3>
                    <p className="text-lg font-semibold">{settings.venueName}</p>
                    <p className="text-muted-foreground">{settings.venueAddress}</p>
                    <div className="w-full h-64 mt-6 rounded-xl overflow-hidden border border-accent/20 shadow-inner">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${settings.venueLng-0.01},${settings.venueLat-0.01},${settings.venueLng+0.01},${settings.venueLat+0.01}&layer=mapnik&marker=${settings.venueLat},${settings.venueLng}`}
                      ></iframe>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-t border-accent/20 pt-8">
                    {settings.dressCode && (
                      <div>
                        <h4 className="font-serif text-xl mb-2 text-accent">Дресс-код</h4>
                        <p className="text-sm leading-relaxed text-primary/80">{settings.dressCode}</p>
                      </div>
                    )}
                    {settings.contacts && (
                      <div>
                        <h4 className="font-serif text-xl mb-2 text-accent">Контакты</h4>
                        <p className="text-sm leading-relaxed text-primary/80">{settings.contacts}</p>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>

              {/* RSVP Section */}
              <Card className="glass-card border-0 shadow-xl rounded-3xl">
                <CardContent className="p-8 md:p-12 text-center space-y-6">
                  <h3 className="text-3xl font-serif text-primary">Присутствие</h3>
                  <p className="text-primary/80">Пожалуйста, подтвердите ваше присутствие, чтобы мы могли все подготовить.</p>
                  
                  {guest.rsvpStatus !== "pending" && (
                    <div className="p-4 bg-white/50 rounded-xl mb-6 inline-block">
                      <span className="font-semibold">Ваш ответ: </span>
                      <span className={guest.rsvpStatus === "attending" ? "text-green-600" : "text-red-500"}>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button 
                        onClick={() => handleRsvp("attending")}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl py-6 text-base"
                        disabled={submitRsvp.isPending}
                        data-testid="button-rsvp-yes"
                      >
                        С радостью приду
                      </Button>
                      <Button 
                        onClick={() => handleRsvp("not_attending")}
                        variant="outline"
                        className="border-accent text-accent hover:bg-accent/10 rounded-xl py-6 text-base"
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
                Ждем встречи с вами!
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountdownTimer({ date, time }: { date: string, time: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date(`${date}T${time}`).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [date, time]);

  return (
    <div className="flex justify-center gap-4 md:gap-8">
      <TimeUnit value={timeLeft.days} label="Дней" />
      <TimeUnit value={timeLeft.hours} label="Часов" />
      <TimeUnit value={timeLeft.minutes} label="Минут" />
      <TimeUnit value={timeLeft.seconds} label="Секунд" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl md:text-5xl font-serif text-primary mb-1 min-w-[3ch] text-center">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-xs md:text-sm font-sans uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
