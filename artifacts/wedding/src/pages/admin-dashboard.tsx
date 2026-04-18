import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useListGuests,
  useGetGuestStats,
  useGetSettings,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
  useUpdateSettings,
  getListGuestsQueryKey,
  getGetGuestStatsQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Gamepad2,
  Search,
  Edit,
  Mail,
  MessageSquare,
  Eye,
} from "lucide-react";
import { FloatingPetals } from "@/components/FloatingPetals";

function getInviteUrl(slug: string): string {
  const base = import.meta.env.BASE_URL as string;
  return `${window.location.origin}${base}invite/${slug}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error("No clipboard API");
  } catch {
    const el = document.createElement("input");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("wedding_admin_token");
    if (!t) setLocation("/admin/login");
    else setToken(t);
  }, [setLocation]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: guests } = useListGuests({ request: { headers: authHeaders } });
  const { data: stats } = useGetGuestStats({ request: { headers: authHeaders } });
  const { data: settings } = useGetSettings({ request: { headers: authHeaders } });

  const deleteGuest = useDeleteGuest({ request: { headers: authHeaders } });
  const updateSettings = useUpdateSettings({ request: { headers: authHeaders } });

  const handleLogout = () => {
    localStorage.removeItem("wedding_admin_token");
    setLocation("/admin/login");
  };

  const handleCopyLink = async (slug: string) => {
    const url = getInviteUrl(slug);
    const ok = await copyToClipboard(url);
    toast({
      title: ok ? "Ссылка скопирована" : "Ошибка копирования",
      description: ok ? url : "Попробуйте скопировать вручную",
      variant: ok ? "default" : "destructive",
    });
  };

  const handleCopyMessage = async (guest: { slug: string; firstName: string }) => {
    const url = getInviteUrl(guest.slug);
    const text = `Ваше персональное приглашение на нашу свадьбу\n${url}`;
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? "Сообщение скопировано" : "Ошибка",
      description: ok ? "Готово к отправке" : "Не удалось скопировать",
      variant: ok ? "default" : "destructive",
    });
  };

  const handleTelegram = (slug: string) => {
    const url = getInviteUrl(slug);
    const text = "Ваше персональное приглашение на нашу свадьбу";
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenLink = (slug: string) => {
    window.open(getInviteUrl(slug), "_blank", "noopener,noreferrer");
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Удалить гостя "${name}"?`)) return;
    deleteGuest.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
          toast({ title: "Гость удалён" });
        },
      }
    );
  };

  const filteredGuests = guests?.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.slug.toLowerCase().includes(q)
    );
  });

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background relative pb-20">
      <FloatingPetals />

      <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-2xl font-serif text-primary whitespace-nowrap">Управление свадьбой</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-primary shrink-0">
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 pt-6 relative z-10">
        <Tabs defaultValue="guests" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-border p-1">
            <TabsTrigger value="guests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
              Гости
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard title="Всего" value={stats?.total || 0} icon={<Users className="w-4 h-4 text-accent" />} />
              <StatCard title="Придут" value={stats?.attending || 0} icon={<CheckCircle className="w-4 h-4 text-green-500" />} />
              <StatCard title="Ожидают" value={stats?.pending || 0} icon={<Clock className="w-4 h-4 text-yellow-500" />} />
              <StatCard title="Прошли игру" value={stats?.gameCompleted || 0} icon={<Gamepad2 className="w-4 h-4 text-secondary" />} />
            </div>

            <Card className="glass-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
                <CardTitle className="text-xl font-serif">Список гостей</CardTitle>
                <AddGuestDialog
                  token={token}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
                    queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
                  }}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени или slug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white/50 border-accent/30"
                  />
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {filteredGuests?.map((guest) => (
                    <GuestCard
                      key={guest.id}
                      guest={guest}
                      onCopyLink={() => handleCopyLink(guest.slug)}
                      onCopyMessage={() => handleCopyMessage(guest)}
                      onTelegram={() => handleTelegram(guest.slug)}
                      onOpen={() => handleOpenLink(guest.slug)}
                      onDelete={() => handleDelete(guest.id, `${guest.firstName} ${guest.lastName}`)}
                      token={token}
                      onEditSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
                        toast({ title: "Гость обновлён" });
                      }}
                    />
                  ))}
                  {filteredGuests?.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground text-sm">
                      {search ? "Ничего не найдено" : "Гости пока не добавлены"}
                    </p>
                  )}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block rounded-xl border bg-white/50 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Гость</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Обращение</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">RSVP</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">
                          <span title="Открыл приглашение"><Eye className="w-4 h-4 mx-auto" /></span>
                        </th>
                        <th className="text-center p-3 font-medium text-muted-foreground">
                          <span title="Прошёл игру"><Gamepad2 className="w-4 h-4 mx-auto" /></span>
                        </th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Ссылка</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGuests?.map((guest) => (
                        <tr key={guest.id} className="border-b border-border/30 last:border-0 hover:bg-white/40 transition-colors">
                          <td className="p-3 font-medium">
                            {guest.firstName} {guest.lastName}
                            <div className="text-xs text-muted-foreground">{guest.guestsCount} персон</div>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{guest.salutationType}</td>
                          <td className="p-3 text-center">
                            <RsvpBadge status={guest.rsvpStatus} />
                          </td>
                          <td className="p-3 text-center">
                            {guest.invitationOpened
                              ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                              : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 mx-auto" />}
                          </td>
                          <td className="p-3 text-center">
                            {guest.gameCompleted
                              ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                              : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 mx-auto" />}
                          </td>
                          <td className="p-3">
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px] block">
                              /invite/{guest.slug}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1">
                              <IconBtn title="Копировать ссылку" onClick={() => handleCopyLink(guest.slug)}>
                                <Copy className="w-3.5 h-3.5" />
                              </IconBtn>
                              <IconBtn title="Открыть в новой вкладке" onClick={() => handleOpenLink(guest.slug)}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </IconBtn>
                              <IconBtn title="Поделиться в Telegram" onClick={() => handleTelegram(guest.slug)}>
                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                              </IconBtn>
                              <IconBtn title="Скопировать текст + ссылку" onClick={() => handleCopyMessage(guest)}>
                                <Mail className="w-3.5 h-3.5 text-accent" />
                              </IconBtn>
                              <EditGuestDialog
                                guest={guest}
                                token={token}
                                onSuccess={() => {
                                  queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
                                  toast({ title: "Гость обновлён" });
                                }}
                              />
                              <IconBtn
                                title="Удалить"
                                onClick={() => handleDelete(guest.id, `${guest.firstName} ${guest.lastName}`)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </IconBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredGuests?.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-muted-foreground">
                            {search ? "Ничего не найдено по запросу" : "Гости пока не добавлены"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-card max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl font-serif">Настройки приглашения</CardTitle>
              </CardHeader>
              <CardContent>
                {settings && (
                  <SettingsForm
                    initialData={settings}
                    onSubmit={(data) => {
                      updateSettings.mutate(
                        { data },
                        {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
                            toast({ title: "Настройки сохранены" });
                          },
                        }
                      );
                    }}
                    isPending={updateSettings.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-primary transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function RsvpBadge({ status }: { status: string }) {
  if (status === "attending")
    return <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">Придут</span>;
  if (status === "not_attending")
    return <span className="text-red-500 text-xs bg-red-50 px-2 py-0.5 rounded-full">Не придут</span>;
  return <span className="text-yellow-600 text-xs bg-yellow-50 px-2 py-0.5 rounded-full">Ожидание</span>;
}

function GuestCard({
  guest,
  onCopyLink,
  onCopyMessage,
  onTelegram,
  onOpen,
  onDelete,
  token,
  onEditSuccess,
}: {
  guest: any;
  onCopyLink: () => void;
  onCopyMessage: () => void;
  onTelegram: () => void;
  onOpen: () => void;
  onDelete: () => void;
  token: string;
  onEditSuccess: () => void;
}) {
  return (
    <div className="bg-white/60 rounded-xl border border-border/50 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-primary">
            {guest.firstName} {guest.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {guest.salutationType} · {guest.guestsCount} персон
          </p>
        </div>
        <RsvpBadge status={guest.rsvpStatus} />
      </div>

      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className={`flex items-center gap-1 ${guest.invitationOpened ? "text-green-600" : ""}`}>
          <Eye className="w-3.5 h-3.5" />
          {guest.invitationOpened ? "Открыл" : "Не открыл"}
        </span>
        <span className={`flex items-center gap-1 ${guest.gameCompleted ? "text-green-600" : ""}`}>
          <Gamepad2 className="w-3.5 h-3.5" />
          {guest.gameCompleted ? "Игра пройдена" : "Не играл"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground font-mono bg-white/50 px-2 py-1 rounded truncate">
        /invite/{guest.slug}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="text-xs" onClick={onCopyLink}>
          <Copy className="w-3 h-3 mr-1.5" /> Копировать ссылку
        </Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={onOpen}>
          <ExternalLink className="w-3 h-3 mr-1.5" /> Открыть
        </Button>
        <Button size="sm" variant="outline" className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={onTelegram}>
          <MessageSquare className="w-3 h-3 mr-1.5" /> Telegram
        </Button>
        <Button size="sm" variant="outline" className="text-xs text-accent border-accent/30 hover:bg-accent/10" onClick={onCopyMessage}>
          <Mail className="w-3 h-3 mr-1.5" /> Текст + ссылка
        </Button>
      </div>

      <div className="flex gap-2 pt-1">
        <EditGuestDialog guest={guest} token={token} onSuccess={onEditSuccess} />
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-destructive hover:bg-destructive/10 flex-1"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3 mr-1.5" /> Удалить
        </Button>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">{title}</p>
          <h3 className="text-2xl font-bold text-primary">{value}</h3>
        </div>
        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function AddGuestDialog({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    salutationType: "Дорогой" as any,
    guestsCount: 1,
    slug: "",
  });

  const createGuest = useCreateGuest({ request: { headers: { Authorization: `Bearer ${token}` } } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGuest.mutate(
      { data: form },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ firstName: "", lastName: "", salutationType: "Дорогой", guestsCount: 1, slug: "" });
          onSuccess();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-white" size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Добавить гостя
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background max-w-md w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-primary">Новый гость</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Имя</Label>
              <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Фамилия</Label>
              <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Обращение</Label>
            <Select value={form.salutationType} onValueChange={(v: any) => setForm({ ...form, salutationType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Дорогой">Дорогой</SelectItem>
                <SelectItem value="Дорогая">Дорогая</SelectItem>
                <SelectItem value="Дорогие">Дорогие</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Количество персон</Label>
            <Input type="number" min="1" required value={form.guestsCount} onChange={(e) => setForm({ ...form, guestsCount: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Свой slug <span className="text-muted-foreground">(опционально)</span></Label>
            <Input placeholder="ivanov-family" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <p className="text-xs text-muted-foreground">Если оставить пустым — сгенерируется автоматически</p>
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={createGuest.isPending}>
            {createGuest.isPending ? "Добавление..." : "Добавить гостя"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditGuestDialog({ guest, token, onSuccess }: { guest: any; token: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: guest.firstName,
    lastName: guest.lastName,
    salutationType: guest.salutationType,
    guestsCount: guest.guestsCount,
  });

  const updateGuest = useUpdateGuest({ request: { headers: { Authorization: `Bearer ${token}` } } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateGuest.mutate(
      { id: guest.id, data: form },
      {
        onSuccess: () => {
          setOpen(false);
          onSuccess();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Редактировать"
          className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-xs sm:flex-none"
        >
          <Edit className="w-3.5 h-3.5" />
          <span className="sm:hidden">Редактировать</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-background max-w-md w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">Редактировать гостя</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Имя</Label>
              <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Фамилия</Label>
              <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Обращение</Label>
            <Select value={form.salutationType} onValueChange={(v: any) => setForm({ ...form, salutationType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Дорогой">Дорогой</SelectItem>
                <SelectItem value="Дорогая">Дорогая</SelectItem>
                <SelectItem value="Дорогие">Дорогие</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Количество персон</Label>
            <Input type="number" min="1" required value={form.guestsCount} onChange={(e) => setForm({ ...form, guestsCount: parseInt(e.target.value) || 1 })} />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={updateGuest.isPending}>
            {updateGuest.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({
  initialData,
  onSubmit,
  isPending,
}: {
  initialData: any;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [data, setData] = useState(initialData);
  const f = (key: string, val: any) => setData((d: any) => ({ ...d, [key]: val }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Заголовок свадьбы</Label>
          <Input value={data.weddingTitle} onChange={(e) => f("weddingTitle", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Имя жениха</Label>
          <Input value={data.groomName} onChange={(e) => f("groomName", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Имя невесты</Label>
          <Input value={data.brideName} onChange={(e) => f("brideName", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Дата свадьбы</Label>
          <Input type="date" value={data.weddingDate} onChange={(e) => f("weddingDate", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Время</Label>
          <Input type="time" value={data.weddingTime} onChange={(e) => f("weddingTime", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Название площадки</Label>
          <Input value={data.venueName} onChange={(e) => f("venueName", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Адрес площадки</Label>
          <Input value={data.venueAddress} onChange={(e) => f("venueAddress", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Широта</Label>
          <Input type="number" step="any" value={data.venueLat} onChange={(e) => f("venueLat", parseFloat(e.target.value))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Долгота</Label>
          <Input type="number" step="any" value={data.venueLng} onChange={(e) => f("venueLng", parseFloat(e.target.value))} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Текст приглашения</Label>
          <Textarea rows={4} value={data.invitationText} onChange={(e) => f("invitationText", e.target.value)} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Дресс-код</Label>
          <Textarea rows={2} value={data.dressCode || ""} onChange={(e) => f("dressCode", e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Контакты организатора</Label>
          <Input value={data.contacts || ""} onChange={(e) => f("contacts", e.target.value)} />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="game-enabled" checked={data.gameEnabled} onCheckedChange={(c) => f("gameEnabled", c)} />
          <Label htmlFor="game-enabled">Включить игру</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="countdown-enabled" checked={data.countdownEnabled} onCheckedChange={(c) => f("countdownEnabled", c)} />
          <Label htmlFor="countdown-enabled">Показывать таймер</Label>
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isPending}>
        {isPending ? "Сохранение..." : "Сохранить настройки"}
      </Button>
    </form>
  );
}
