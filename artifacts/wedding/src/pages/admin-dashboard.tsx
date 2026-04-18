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
  useListTables,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  useListActivity,
  getListGuestsQueryKey,
  getGetGuestStatsQueryKey,
  getGetSettingsQueryKey,
  getListTablesQueryKey,
  getListActivityQueryKey,
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
  LogOut, Copy, ExternalLink, Trash2, Plus, Users, CheckCircle,
  Clock, Gamepad2, Search, Edit, Mail, MessageSquare, Eye,
  XCircle, Activity, Table2, LayoutDashboard, Share2, Palette,
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

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const EVENT_LABELS: Record<string, string> = {
  invitation_opened: "открыл приглашение",
  game_completed: "прошёл игру",
  rsvp_yes: "подтвердил участие",
  rsvp_no: "отказался от участия",
};
const EVENT_COLORS: Record<string, string> = {
  invitation_opened: "text-blue-600",
  game_completed: "text-purple-600",
  rsvp_yes: "text-green-600",
  rsvp_no: "text-red-500",
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const t = localStorage.getItem("wedding_admin_token");
    if (!t) setLocation("/admin/login");
    else setToken(t);
  }, [setLocation]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const { data: guests } = useListGuests({ request: { headers: authHeaders } });
  const { data: stats } = useGetGuestStats({ request: { headers: authHeaders } });
  const { data: settings } = useGetSettings({ request: { headers: authHeaders } });
  const { data: tables } = useListTables({ request: { headers: authHeaders } });
  const { data: activity } = useListActivity({ request: { headers: authHeaders } });

  const deleteGuest = useDeleteGuest({ request: { headers: authHeaders } });
  const updateSettings = useUpdateSettings({ request: { headers: authHeaders } });

  const handleLogout = () => {
    localStorage.removeItem("wedding_admin_token");
    setLocation("/admin/login");
  };

  const handleCopyLink = async (slug: string) => {
    const url = getInviteUrl(slug);
    const ok = await copyToClipboard(url);
    toast({ title: ok ? "Ссылка скопирована" : "Ошибка копирования", variant: ok ? "default" : "destructive" });
  };

  const handleCopyMessage = async (guest: { slug: string; firstName: string }) => {
    const url = getInviteUrl(guest.slug);
    const text = `Ваше персональное приглашение на нашу свадьбу\n${url}`;
    const ok = await copyToClipboard(text);
    toast({ title: ok ? "Сообщение скопировано" : "Ошибка", variant: ok ? "default" : "destructive" });
  };

  const handleTelegram = (slug: string) => {
    const url = getInviteUrl(slug);
    const text = "Ваше персональное приглашение на нашу свадьбу";
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Удалить гостя "${name}"?`)) return;
    deleteGuest.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
        toast({ title: "Гость удалён" });
      },
    });
  };

  const filteredGuests = guests?.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = !search || g.firstName.toLowerCase().includes(q) || g.lastName.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || g.rsvpStatus === statusFilter;
    return matchSearch && matchStatus;
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
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-border p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="guests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Гости
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              <Table2 className="w-3.5 h-3.5 mr-1.5" />
              Столы
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* === DASHBOARD TAB === */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard title="Всего гостей" value={stats?.total ?? 0} sub={`${stats?.totalPersons ?? 0} персон`} icon={<Users className="w-4 h-4 text-accent" />} />
              <StatCard title="Придут" value={stats?.attending ?? 0} sub={`${stats?.attendingPersons ?? 0} персон`} icon={<CheckCircle className="w-4 h-4 text-green-500" />} />
              <StatCard title="Не придут" value={stats?.notAttending ?? 0} sub={`${stats?.notAttendingPersons ?? 0} персон`} icon={<XCircle className="w-4 h-4 text-red-400" />} />
              <StatCard title="Ожидают" value={stats?.pending ?? 0} sub={`${stats?.pendingPersons ?? 0} персон`} icon={<Clock className="w-4 h-4 text-yellow-500" />} />
              <StatCard title="Прошли игру" value={stats?.gameCompleted ?? 0} sub={`из ${stats?.invitationOpened ?? 0} открыли`} icon={<Gamepad2 className="w-4 h-4 text-secondary" />} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <Card className="glass-card sm:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    Расклад RSVP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RsvpBar label="Придут" value={stats?.attending ?? 0} total={stats?.total ?? 1} color="bg-green-400" />
                  <RsvpBar label="Не придут" value={stats?.notAttending ?? 0} total={stats?.total ?? 1} color="bg-red-300" />
                  <RsvpBar label="Ожидание" value={stats?.pending ?? 0} total={stats?.total ?? 1} color="bg-yellow-300" />
                </CardContent>
              </Card>

              <Card className="glass-card sm:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Последние события
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!activity || activity.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Событий пока нет</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {activity.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 text-sm border-b border-border/30 pb-2 last:border-0">
                          <span className="text-muted-foreground text-xs whitespace-nowrap pt-0.5">{fmtTime(log.createdAt)}</span>
                          <span className="font-medium text-primary shrink-0">{log.guestName}</span>
                          <span className={`text-xs ${EVENT_COLORS[log.eventType] ?? "text-muted-foreground"}`}>
                            {EVENT_LABELS[log.eventType] ?? log.eventType}
                          </span>
                          {log.payload && <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={log.payload}>"{log.payload}"</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === GUESTS TAB === */}
          <TabsContent value="guests" className="space-y-6">
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-white/50 border-accent/30"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 bg-white/50 border-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="pending">Ожидание</SelectItem>
                      <SelectItem value="attending">Придут</SelectItem>
                      <SelectItem value="not_attending">Не придут</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {filteredGuests?.map((guest) => (
                    <GuestCard
                      key={guest.id}
                      guest={guest}
                      tables={tables ?? []}
                      onCopyLink={() => handleCopyLink(guest.slug)}
                      onCopyMessage={() => handleCopyMessage(guest)}
                      onTelegram={() => handleTelegram(guest.slug)}
                      onOpen={() => window.open(getInviteUrl(guest.slug), "_blank", "noopener,noreferrer")}
                      onTableChange={() => { queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() }); }}
                      onDelete={() => handleDelete(guest.id, `${guest.firstName} ${guest.lastName}`)}
                      token={token}
                      onEditSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
                        queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
                        toast({ title: "Гость обновлён" });
                      }}
                    />
                  ))}
                  {filteredGuests?.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground text-sm">
                      {search || statusFilter !== "all" ? "Ничего не найдено" : "Гости пока не добавлены"}
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
                        <th className="text-left p-3 font-medium text-muted-foreground">Стол</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Ссылка</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGuests?.map((guest) => {
                        const table = tables?.find((t) => t.id === guest.tableId);
                        return (
                          <tr key={guest.id} className="border-b border-border/30 last:border-0 hover:bg-white/40 transition-colors">
                            <td className="p-3 font-medium">
                              {guest.firstName} {guest.lastName}
                              <div className="text-xs text-muted-foreground">{guest.guestsCount} персон</div>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">{guest.salutationType}</td>
                            <td className="p-3 text-center"><RsvpBadge status={guest.rsvpStatus} /></td>
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
                              <InlineTableSelect
                                guest={guest}
                                tables={tables ?? []}
                                token={token}
                                onSuccess={() => {
                                  queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
                                  queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
                                }}
                              />
                            </td>
                            <td className="p-3">
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px] block">/invite/{guest.slug}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-0.5">
                                <div className="flex items-center gap-0.5 bg-blue-50 rounded-lg px-1 py-0.5 mr-1" title="Поделиться">
                                  <IconBtn title="Скопировать ссылку" onClick={() => handleCopyLink(guest.slug)}><Copy className="w-3.5 h-3.5" /></IconBtn>
                                  <IconBtn title="Отправить в Telegram" onClick={() => handleTelegram(guest.slug)}><MessageSquare className="w-3.5 h-3.5 text-blue-500" /></IconBtn>
                                  <IconBtn title="Скопировать текст + ссылку" onClick={() => handleCopyMessage(guest)}><Mail className="w-3.5 h-3.5 text-accent" /></IconBtn>
                                  <IconBtn title="Открыть приглашение" onClick={() => window.open(getInviteUrl(guest.slug), "_blank", "noopener,noreferrer")}><ExternalLink className="w-3.5 h-3.5" /></IconBtn>
                                </div>
                                <EditGuestDialog
                                  guest={guest}
                                  tables={tables ?? []}
                                  token={token}
                                  onSuccess={() => {
                                    queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
                                    queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
                                    toast({ title: "Гость обновлён" });
                                  }}
                                />
                                <IconBtn title="Удалить гостя" onClick={() => handleDelete(guest.id, `${guest.firstName} ${guest.lastName}`)} className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </IconBtn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredGuests?.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-muted-foreground">
                            {search || statusFilter !== "all" ? "Ничего не найдено по запросу" : "Гости пока не добавлены"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TABLES TAB === */}
          <TabsContent value="tables" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
                <CardTitle className="text-xl font-serif">Рассадка за столами</CardTitle>
                <AddTableDialog
                  token={token}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() })}
                />
              </CardHeader>
              <CardContent>
                {!tables || tables.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">Столы пока не добавлены</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map((table) => {
                      const seated = guests?.filter((g) => g.tableId === table.id) ?? [];
                      const totalPersons = seated.reduce((s, g) => s + g.guestsCount, 0);
                      return (
                        <div key={table.id} className="bg-white/60 rounded-xl border border-border/50 p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-primary text-base">{table.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {totalPersons} / {table.seatsCount} мест занято
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <EditTableDialog
                                table={table}
                                token={token}
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() })}
                              />
                              <DeleteTableBtn
                                tableId={table.id}
                                tableName={table.name}
                                token={token}
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() })}
                              />
                            </div>
                          </div>

                          <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#C9A96E] rounded-full transition-all"
                              style={{ width: `${Math.min(100, (totalPersons / table.seatsCount) * 100)}%` }}
                            />
                          </div>

                          {table.note && <p className="text-xs text-muted-foreground italic">{table.note}</p>}

                          {seated.length > 0 && (
                            <div className="space-y-1">
                              {seated.map((g) => (
                                <div key={g.id} className="flex items-center justify-between text-xs">
                                  <span className="text-primary font-medium">
                                    {g.firstName} {g.lastName}
                                    {g.seatNumber ? <span className="text-muted-foreground ml-1">#{g.seatNumber}</span> : null}
                                  </span>
                                  <span className="text-muted-foreground">{g.guestsCount} pers.</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === SETTINGS TAB === */}
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
                      updateSettings.mutate({ data }, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
                          toast({ title: "Настройки сохранены" });
                        },
                      });
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

function InlineTableSelect({ guest, tables, token, onSuccess }: { guest: any; tables: any[]; token: string; onSuccess: () => void }) {
  const updateGuest = useUpdateGuest({ request: { headers: { Authorization: `Bearer ${token}` } } });
  const current = guest.tableId ? String(guest.tableId) : "none";

  if (tables.length === 0) return <span className="text-muted-foreground/50 text-xs">—</span>;

  return (
    <Select value={current} onValueChange={(v) => {
      const tableId = v !== "none" ? parseInt(v) : null;
      updateGuest.mutate({ id: guest.id, data: { tableId, seatNumber: tableId ? guest.seatNumber : null } }, { onSuccess });
    }}>
      <SelectTrigger className="h-7 text-xs border-0 bg-accent/8 hover:bg-accent/15 focus:ring-0 w-auto min-w-[80px] max-w-[120px] px-2 rounded-full">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none"><span className="text-muted-foreground">Не назначен</span></SelectItem>
        {tables.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RsvpBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, className = "" }: { children: React.ReactNode; title: string; onClick: () => void; className?: string }) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-primary transition-colors ${className}`}>
      {children}
    </button>
  );
}

function RsvpBadge({ status }: { status: string }) {
  if (status === "attending") return <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">Придут</span>;
  if (status === "not_attending") return <span className="text-red-500 text-xs bg-red-50 px-2 py-0.5 rounded-full">Не придут</span>;
  return <span className="text-yellow-600 text-xs bg-yellow-50 px-2 py-0.5 rounded-full">Ожидание</span>;
}

function StatCard({ title, value, sub, icon }: { title: string; value: number; sub?: string; icon: React.ReactNode }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">{title}</p>
          <h3 className="text-2xl font-bold text-primary">{value}</h3>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">{icon}</div>
      </CardContent>
    </Card>
  );
}

function GuestCard({ guest, tables, onCopyLink, onCopyMessage, onTelegram, onOpen, onDelete, token, onEditSuccess, onTableChange }: {
  guest: any; tables: any[]; onCopyLink: () => void; onCopyMessage: () => void; onTelegram: () => void;
  onOpen: () => void; onDelete: () => void; token: string; onEditSuccess: () => void; onTableChange: () => void;
}) {
  const displayName = guest.salutationType === "Дорогие" && guest.secondaryFirstName
    ? `${guest.firstName} и ${guest.secondaryFirstName}`
    : `${guest.firstName} ${guest.lastName}`;

  return (
    <div className="bg-white/60 rounded-xl border border-border/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-primary truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">{guest.salutationType} · {guest.guestsCount} персон</p>
        </div>
        <RsvpBadge status={guest.rsvpStatus} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Стол:</span>
        <InlineTableSelect guest={guest} tables={tables} token={token} onSuccess={onTableChange} />
      </div>

      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className={`flex items-center gap-1 ${guest.invitationOpened ? "text-green-600" : ""}`}>
          <Eye className="w-3.5 h-3.5" />{guest.invitationOpened ? "Открыл" : "Не открыл"}
        </span>
        <span className={`flex items-center gap-1 ${guest.gameCompleted ? "text-green-600" : ""}`}>
          <Gamepad2 className="w-3.5 h-3.5" />{guest.gameCompleted ? "Игра пройдена" : "Не играл"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground font-mono bg-white/50 px-2 py-1 rounded truncate">/invite/{guest.slug}</p>

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Поделиться</p>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="text-xs justify-start" onClick={onCopyLink}><Copy className="w-3 h-3 mr-1.5" />Ссылка</Button>
          <Button size="sm" variant="outline" className="text-xs justify-start text-blue-600 border-blue-200 hover:bg-blue-50" onClick={onTelegram}><MessageSquare className="w-3 h-3 mr-1.5" />Telegram</Button>
          <Button size="sm" variant="outline" className="text-xs justify-start text-accent border-accent/30 hover:bg-accent/10" onClick={onCopyMessage}><Mail className="w-3 h-3 mr-1.5" />Текст+ссылка</Button>
          <Button size="sm" variant="outline" className="text-xs justify-start" onClick={onOpen}><ExternalLink className="w-3 h-3 mr-1.5" />Открыть</Button>
        </div>
        <div className="flex gap-2 pt-1 border-t border-border/30">
          <div className="flex-1"><EditGuestDialog guest={guest} tables={tables} token={token} onSuccess={onEditSuccess} /></div>
          <Button size="sm" variant="ghost" className="text-xs text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="w-3 h-3 mr-1.5" />Удалить
          </Button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_ADD_FORM = { firstName: "", lastName: "", salutationType: "Дорогой" as any, guestsCount: 1, secondaryFirstName: "", sharedLastName: "", coupleDisplayMode: "full_shared_last_name" as any };

function AddGuestDialog({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ADD_FORM);
  const createGuest = useCreateGuest({ request: { headers: { Authorization: `Bearer ${token}` } } });

  const isCouple = form.salutationType === "Дорогие";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      salutationType: form.salutationType,
      guestsCount: form.guestsCount,
    };
    if (isCouple && form.secondaryFirstName) {
      data.primaryFirstName = form.firstName;
      data.secondaryFirstName = form.secondaryFirstName;
      data.sharedLastName = form.sharedLastName || null;
      data.coupleDisplayMode = form.coupleDisplayMode;
    }
    createGuest.mutate({ data }, {
      onSuccess: () => {
        setOpen(false);
        setForm(EMPTY_ADD_FORM);
        onSuccess();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-white" size="sm"><Plus className="w-4 h-4 mr-1.5" />Добавить гостя</Button>
      </DialogTrigger>
      <DialogContent className="bg-background max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-2xl text-primary">Новый гость</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Обращение</Label>
            <Select value={form.salutationType} onValueChange={(v: any) => setForm({ ...form, salutationType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Дорогой">Дорогой (он)</SelectItem>
                <SelectItem value="Дорогая">Дорогая (она)</SelectItem>
                <SelectItem value="Дорогие">Дорогие (пара)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCouple ? (
            <div className="bg-accent/5 rounded-xl p-3 space-y-3 border border-accent/20">
              <p className="text-xs text-muted-foreground font-medium">Пара — оба получат одну ссылку</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Имя 1-го</Label>
                  <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Светлана" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Имя 2-го</Label>
                  <Input value={form.secondaryFirstName} onChange={(e) => setForm({ ...form, secondaryFirstName: e.target.value })} placeholder="Дмитрий" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Общая фамилия</Label>
                  <Input value={form.sharedLastName} onChange={(e) => setForm({ ...form, sharedLastName: e.target.value })} placeholder="Петровы" />
                  <Input className="hidden" value={form.lastName || form.sharedLastName || form.firstName} onChange={() => {}} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Формат обращения</Label>
                  <Select value={form.coupleDisplayMode} onValueChange={(v: any) => setForm({ ...form, coupleDisplayMode: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_names_only">Только имена</SelectItem>
                      <SelectItem value="full_shared_last_name">Имена + фамилия</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs bg-white/60 px-3 py-2 rounded-lg text-primary/70 font-serif italic">
                Пример: «Дорогие {form.firstName || "Имя1"}{form.secondaryFirstName ? ` и ${form.secondaryFirstName}` : ""}
                {form.coupleDisplayMode === "full_shared_last_name" && form.sharedLastName ? ` ${form.sharedLastName}` : ""}»
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">Имя</Label><Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-sm">Фамилия</Label><Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
          )}

          {isCouple && (
            <div className="space-y-1.5">
              <Label className="text-sm">Фамилия (для slug и поиска)</Label>
              <Input required placeholder="petrov" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm">Количество персон</Label>
            <Input type="number" min="1" required value={form.guestsCount} onChange={(e) => setForm({ ...form, guestsCount: parseInt(e.target.value) || 1 })} />
          </div>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={createGuest.isPending}>
            {createGuest.isPending ? "Добавление..." : "Добавить гостя"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditGuestDialog({ guest, tables, token, onSuccess }: { guest: any; tables: any[]; token: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: guest.firstName,
    lastName: guest.lastName,
    salutationType: guest.salutationType,
    guestsCount: guest.guestsCount,
    secondaryFirstName: guest.secondaryFirstName ?? "",
    sharedLastName: guest.sharedLastName ?? "",
    coupleDisplayMode: guest.coupleDisplayMode ?? "full_shared_last_name",
    tableId: guest.tableId ? String(guest.tableId) : "none",
    seatNumber: guest.seatNumber ? String(guest.seatNumber) : "",
  });
  const updateGuest = useUpdateGuest({ request: { headers: { Authorization: `Bearer ${token}` } } });

  const isCouple = form.salutationType === "Дорогие";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tableId = form.tableId !== "none" ? parseInt(form.tableId) : null;
    const seatNumber = form.seatNumber ? parseInt(form.seatNumber) : null;
    const data: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      salutationType: form.salutationType,
      guestsCount: form.guestsCount,
      tableId,
      seatNumber,
    };
    if (isCouple) {
      data.primaryFirstName = form.firstName;
      data.secondaryFirstName = form.secondaryFirstName || null;
      data.sharedLastName = form.sharedLastName || null;
      data.coupleDisplayMode = form.coupleDisplayMode;
    } else {
      data.secondaryFirstName = null;
      data.sharedLastName = null;
      data.primaryFirstName = null;
    }
    updateGuest.mutate({ id: guest.id, data }, {
      onSuccess: () => { setOpen(false); onSuccess(); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button title="Редактировать" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-primary transition-colors">
          <Edit className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-background max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-xl text-primary">Редактировать гостя</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Обращение</Label>
            <Select value={form.salutationType} onValueChange={(v: any) => setForm({ ...form, salutationType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Дорогой">Дорогой (он)</SelectItem>
                <SelectItem value="Дорогая">Дорогая (она)</SelectItem>
                <SelectItem value="Дорогие">Дорогие (пара)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCouple ? (
            <div className="bg-accent/5 rounded-xl p-3 space-y-3 border border-accent/20">
              <p className="text-xs text-muted-foreground font-medium">Пара</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-sm">Имя 1-го</Label><Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-sm">Имя 2-го</Label><Input value={form.secondaryFirstName} onChange={(e) => setForm({ ...form, secondaryFirstName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-sm">Общая фамилия</Label><Input value={form.sharedLastName} onChange={(e) => setForm({ ...form, sharedLastName: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Формат</Label>
                  <Select value={form.coupleDisplayMode} onValueChange={(v: any) => setForm({ ...form, coupleDisplayMode: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_names_only">Только имена</SelectItem>
                      <SelectItem value="full_shared_last_name">Имена + фамилия</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs bg-white/60 px-3 py-2 rounded-lg text-primary/70 font-serif italic">
                «Дорогие {form.firstName}{form.secondaryFirstName ? ` и ${form.secondaryFirstName}` : ""}
                {form.coupleDisplayMode === "full_shared_last_name" && form.sharedLastName ? ` ${form.sharedLastName}` : ""}»
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">Имя</Label><Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-sm">Фамилия</Label><Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
          )}

          {isCouple && (
            <div className="space-y-1.5">
              <Label className="text-sm">Фамилия (для slug)</Label>
              <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          )}

          <div className="space-y-1.5"><Label className="text-sm">Количество персон</Label><Input type="number" min="1" required value={form.guestsCount} onChange={(e) => setForm({ ...form, guestsCount: parseInt(e.target.value) || 1 })} /></div>

          {tables.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Стол</Label>
                <Select value={form.tableId} onValueChange={(v) => setForm({ ...form, tableId: v })}>
                  <SelectTrigger><SelectValue placeholder="Не назначен" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не назначен</SelectItem>
                    {tables.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Место</Label>
                <Input type="number" min="1" placeholder="—" value={form.seatNumber} onChange={(e) => setForm({ ...form, seatNumber: e.target.value })} />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={updateGuest.isPending}>
            {updateGuest.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTableDialog({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", seatsCount: 8, note: "" });
  const createTable = useCreateTable({ request: { headers: { Authorization: `Bearer ${token}` } } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTable.mutate({ data: { name: form.name, seatsCount: form.seatsCount, note: form.note || null } }, {
      onSuccess: () => { setOpen(false); setForm({ name: "", seatsCount: 8, note: "" }); onSuccess(); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-white" size="sm"><Plus className="w-4 h-4 mr-1.5" />Добавить стол</Button>
      </DialogTrigger>
      <DialogContent className="bg-background max-w-sm w-[calc(100vw-2rem)]">
        <DialogHeader><DialogTitle className="font-serif text-xl text-primary">Новый стол</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5"><Label className="text-sm">Название стола</Label><Input required placeholder="Стол 1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-sm">Количество мест</Label><Input type="number" min="1" required value={form.seatsCount} onChange={(e) => setForm({ ...form, seatsCount: parseInt(e.target.value) || 8 })} /></div>
          <div className="space-y-1.5"><Label className="text-sm">Примечание</Label><Input placeholder="Необязательно" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={createTable.isPending}>
            {createTable.isPending ? "Добавление..." : "Добавить стол"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTableDialog({ table, token, onSuccess }: { table: any; token: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: table.name, seatsCount: table.seatsCount, note: table.note ?? "" });
  const updateTable = useUpdateTable({ request: { headers: { Authorization: `Bearer ${token}` } } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTable.mutate({ id: table.id, data: { name: form.name, seatsCount: form.seatsCount, note: form.note || null } }, {
      onSuccess: () => { setOpen(false); onSuccess(); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button title="Редактировать стол" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-primary transition-colors">
          <Edit className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-background max-w-sm w-[calc(100vw-2rem)]">
        <DialogHeader><DialogTitle className="font-serif text-xl text-primary">Редактировать стол</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5"><Label className="text-sm">Название</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-sm">Количество мест</Label><Input type="number" min="1" required value={form.seatsCount} onChange={(e) => setForm({ ...form, seatsCount: parseInt(e.target.value) || 8 })} /></div>
          <div className="space-y-1.5"><Label className="text-sm">Примечание</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={updateTable.isPending}>
            {updateTable.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTableBtn({ tableId, tableName, token, onSuccess }: { tableId: number; tableName: string; token: string; onSuccess: () => void }) {
  const deleteTable = useDeleteTable({ request: { headers: { Authorization: `Bearer ${token}` } } });
  return (
    <button
      title="Удалить стол"
      className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
      onClick={() => {
        if (!confirm(`Удалить стол "${tableName}"?`)) return;
        deleteTable.mutate({ id: tableId }, { onSuccess });
      }}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

const TEMPLATE_OPTIONS = [
  {
    key: "default",
    label: "Классический",
    desc: "Кремовый фон, золото, плавающие лепестки",
    colors: ["#FFF9F5", "#C9A96E", "#D4A5A5", "#2C1810"],
  },
  {
    key: "classic",
    label: "Элегантный",
    desc: "Айвори, глубокий синий, золотые акценты",
    colors: ["#FAF7F0", "#D4AF37", "#1C2B4A", "#F0E8D8"],
  },
  {
    key: "floral",
    label: "Цветочный",
    desc: "Нежно-розовый, пыльная роза, флоральные украшения",
    colors: ["#FDF0F4", "#E8A0B4", "#8B4458", "#FDF5F8"],
  },
] as const;

function SettingsForm({ initialData, onSubmit, isPending }: { initialData: any; onSubmit: (data: any) => void; isPending: boolean }) {
  const [data, setData] = useState(initialData);
  const f = (key: string, val: any) => setData((d: any) => ({ ...d, [key]: val }));
  const baseUrl = import.meta.env.BASE_URL as string;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-6">

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent" />
          <Label className="text-base font-medium">Шаблон приглашения</Label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATE_OPTIONS.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              onClick={() => f("activeTemplate", tpl.key)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                data.activeTemplate === tpl.key
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border/40 bg-white/40 hover:border-accent/40"
              }`}
            >
              <div className="flex gap-1.5 mb-2">
                {tpl.colors.map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ background: c }} />
                ))}
              </div>
              <p className="font-medium text-sm text-primary">{tpl.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tpl.desc}</p>
              {data.activeTemplate === tpl.key && (
                <p className="text-xs text-accent font-medium mt-1.5">Активен</p>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {TEMPLATE_OPTIONS.map((tpl) => (
            <a key={tpl.key} href={`${baseUrl}preview/template/${tpl.key}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-accent underline underline-offset-2 hover:opacity-80">
              Предпросмотр: {tpl.label}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-border/30 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2"><Label>Заголовок свадьбы</Label><Input value={data.weddingTitle} onChange={(e) => f("weddingTitle", e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Имя жениха</Label><Input value={data.groomName} onChange={(e) => f("groomName", e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Имя невесты</Label><Input value={data.brideName} onChange={(e) => f("brideName", e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Дата свадьбы</Label><Input type="date" value={data.weddingDate} onChange={(e) => f("weddingDate", e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Время</Label><Input type="time" value={data.weddingTime} onChange={(e) => f("weddingTime", e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Название площадки</Label><Input value={data.venueName} onChange={(e) => f("venueName", e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Адрес площадки</Label><Input value={data.venueAddress} onChange={(e) => f("venueAddress", e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Широта</Label><Input type="number" step="any" value={data.venueLat} onChange={(e) => f("venueLat", parseFloat(e.target.value))} required /></div>
        <div className="space-y-1.5"><Label>Долгота</Label><Input type="number" step="any" value={data.venueLng} onChange={(e) => f("venueLng", parseFloat(e.target.value))} required /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Текст приглашения</Label><Textarea rows={4} value={data.invitationText} onChange={(e) => f("invitationText", e.target.value)} required /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Дресс-код</Label><Textarea rows={2} value={data.dressCode || ""} onChange={(e) => f("dressCode", e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Контакты организатора</Label><Input value={data.contacts || ""} onChange={(e) => f("contacts", e.target.value)} /></div>
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
