import { useRoute } from "wouter";
import DefaultTemplate from "@/templates/DefaultTemplate";
import ClassicTemplate from "@/templates/ClassicTemplate";
import FloralTemplate from "@/templates/FloralTemplate";
import type { TemplateGuest, TemplateSettings } from "@/templates/types";

const SAMPLE_GUEST: TemplateGuest = {
  id: 0,
  firstName: "Мария",
  lastName: "Иванова",
  salutationType: "Дорогая",
  guestsCount: 2,
  rsvpStatus: "pending",
  rsvpComment: null,
  primaryFirstName: null,
  secondaryFirstName: null,
  sharedLastName: null,
  coupleDisplayMode: "first_names_only",
};

const SAMPLE_GUEST_COUPLE: TemplateGuest = {
  ...SAMPLE_GUEST,
  firstName: "Светлана",
  lastName: "Петрова",
  salutationType: "Дорогие",
  secondaryFirstName: "Дмитрий",
  sharedLastName: "Петровы",
  coupleDisplayMode: "full_shared_last_name",
  guestsCount: 2,
};

const SAMPLE_SETTINGS: TemplateSettings = {
  brideName: "Анна",
  groomName: "Александр",
  weddingTitle: "Наша Свадьба",
  weddingDate: "2025-08-15",
  weddingTime: "16:00",
  venueName: "Ресторан «Белые Ночи»",
  venueAddress: "г. Москва, ул. Арбат, 1",
  venueLat: 55.7558,
  venueLng: 37.6173,
  invitationText:
    "С великой радостью приглашаем вас разделить с нами самый счастливый день нашей жизни. Ваше присутствие сделает наш праздник по-настоящему незабываемым.",
  dressCode: "Дресс-код: вечерний наряд. Цветовая гамма: пастельные тона",
  contacts: "По всем вопросам: +7 (999) 123-45-67",
  countdownEnabled: true,
};

const TEMPLATES: Record<string, { label: string; component: React.ComponentType<any> }> = {
  default: { label: "Классический", component: DefaultTemplate },
  classic: { label: "Элегантный", component: ClassicTemplate },
  floral: { label: "Цветочный", component: FloralTemplate },
};

export default function TemplatePreview() {
  const [, params] = useRoute("/preview/template/:key");
  const key = params?.key ?? "default";

  const entry = TEMPLATES[key];

  if (!entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 gap-4">
        <h1 className="text-2xl font-serif">Шаблон не найден</h1>
        <p className="text-muted-foreground">Доступные шаблоны: default, classic, floral</p>
        <div className="flex gap-3 mt-2">
          {Object.keys(TEMPLATES).map((k) => (
            <a key={k} href={`${import.meta.env.BASE_URL}preview/template/${k}`}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm">
              {TEMPLATES[k].label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  const useCouple = key === "default";
  const guest = useCouple ? SAMPLE_GUEST_COUPLE : SAMPLE_GUEST;
  const Template = entry.component;

  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 text-white text-xs flex items-center gap-4 px-4 py-2">
        <span className="font-medium">Предпросмотр: {entry.label}</span>
        <span className="text-white/60">|</span>
        {Object.entries(TEMPLATES).map(([k, v]) => (
          <a key={k} href={`${import.meta.env.BASE_URL}preview/template/${k}`}
            className={`hover:text-white/80 transition-colors ${k === key ? "text-[#C9A96E] font-semibold" : "text-white/60"}`}>
            {v.label}
          </a>
        ))}
        <span className="text-white/40 ml-auto text-[10px]">Данные — тестовые</span>
      </div>
      <div style={{ paddingTop: "32px" }}>
        <Template guest={guest} settings={SAMPLE_SETTINGS} onRsvp={() => {}} rsvpPending={false} />
      </div>
    </div>
  );
}
