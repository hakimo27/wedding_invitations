export interface TemplateGuest {
  id: number;
  firstName: string;
  lastName: string;
  salutationType: string;
  guestsCount: number;
  rsvpStatus: string;
  rsvpComment?: string | null;
  primaryFirstName?: string | null;
  secondaryFirstName?: string | null;
  sharedLastName?: string | null;
  coupleDisplayMode?: string | null;
}

export interface TemplateSettings {
  brideName: string;
  groomName: string;
  weddingTitle: string;
  weddingDate: string;
  weddingTime: string;
  venueName: string;
  venueAddress: string;
  venueLat: number;
  venueLng: number;
  invitationText: string;
  dressCode?: string | null;
  contacts?: string | null;
  countdownEnabled: boolean;
}

export interface TemplateProps {
  guest: TemplateGuest;
  settings: TemplateSettings;
  onRsvp: (status: "attending" | "not_attending", comment: string) => void;
  rsvpPending: boolean;
}

export function getGreeting(guest: TemplateGuest): string {
  if (guest.salutationType === "Дорогие" && guest.secondaryFirstName) {
    const names = `${guest.firstName} и ${guest.secondaryFirstName}`;
    if (guest.coupleDisplayMode === "full_shared_last_name" && guest.sharedLastName) {
      return `Дорогие ${names} ${guest.sharedLastName}`;
    }
    return `Дорогие ${names}`;
  }
  return `${guest.salutationType} ${guest.firstName}`;
}
