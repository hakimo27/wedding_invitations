import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetGuestBySlug,
  useGetSettings,
  useMarkInvitationOpened,
  useSubmitRsvp,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FloatingPetals } from "@/components/FloatingPetals";
import Game from "@/components/Game";
import { getGreeting } from "@/templates/types";
import DefaultTemplate from "@/templates/DefaultTemplate";
import ClassicTemplate from "@/templates/ClassicTemplate";
import FloralTemplate from "@/templates/FloralTemplate";

function getTemplate(key: string | null | undefined) {
  if (key === "classic") return ClassicTemplate;
  if (key === "floral") return FloralTemplate;
  return DefaultTemplate;
}

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

  const handleRsvp = (status: "attending" | "not_attending", comment: string) => {
    if (!guest) return;
    submitRsvp.mutate(
      { id: guest.id, data: { rsvpStatus: status, rsvpComment: comment || null } },
      {
        onSuccess: () => {
          toast({
            title: "Спасибо!",
            description: status === "attending" ? "С нетерпением ждём вас!" : "Нам будет вас не хватать.",
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Ошибка", description: "Не удалось отправить ответ." });
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
        <p className="text-primary/60 max-w-sm">Проверьте правильность ссылки или обратитесь к организатору.</p>
      </div>
    );
  }

  const showGame = settings.gameEnabled && !guest.gameCompleted;
  const greeting = getGreeting(guest);

  const InvitationTemplate = getTemplate(settings.activeTemplate);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-accent/30 text-primary">
      <FloatingPetals />

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10 text-center"
          >
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6 opacity-60">
                <path d="M32 54 C32 54 6 38 6 22 C6 13 12 6 20 6 C25 6 29 9 32 13 C35 9 39 6 44 6 C52 6 58 13 58 22 C58 38 32 54 32 54Z" fill="#C9A96E" opacity="0.7"/>
              </svg>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-6xl font-serif text-primary mb-4 drop-shadow-sm">
              Здравствуйте,<br className="sm:hidden" /> {guest.firstName}!
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
              className="text-base md:text-xl text-primary/70 max-w-md mb-10 leading-relaxed px-2">
              Мы рады пригласить вас на наше торжество.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
              {showGame ? (
                <Button onClick={() => setStep("game")}
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
                  data-testid="button-start-game">
                  Открыть приглашение
                </Button>
              ) : (
                <Button onClick={() => setStep("invitation")}
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
                  data-testid="button-open-invitation">
                  Открыть приглашение
                </Button>
              )}
            </motion.div>
            {showGame && <p className="mt-4 text-xs text-primary/40">Вас ждёт небольшое задание</p>}
          </motion.div>
        )}

        {step === "game" && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative z-10">
            <div className="w-full max-w-3xl mx-auto h-[85vh] max-h-[680px] bg-white/40 p-2 sm:p-3 rounded-2xl backdrop-blur-md shadow-2xl border border-white/50">
              <Game guestId={guest.id} guestSlug={guest.slug} onComplete={() => setStep("invitation")} />
            </div>
          </motion.div>
        )}

        {step === "invitation" && (
          <motion.div key="invitation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <InvitationTemplate
              guest={guest}
              settings={settings}
              onRsvp={handleRsvp}
              rsvpPending={submitRsvp.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
