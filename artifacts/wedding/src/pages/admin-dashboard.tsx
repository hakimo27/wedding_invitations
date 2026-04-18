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
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { LogOut, Copy, Edit, Trash2, Plus, Users, CheckCircle, Clock, Gamepad2 } from "lucide-react";
import { FloatingPetals } from "@/components/FloatingPetals";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const t = localStorage.getItem("wedding_admin_token");
    if (!t) {
      setLocation("/admin/login");
    } else {
      setToken(t);
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("wedding_admin_token");
    setLocation("/admin/login");
  };

  const { data: guests, isLoading: isLoadingGuests } = useListGuests({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data: stats, isLoading: isLoadingStats } = useGetGuestStats({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: settings, isLoading: isLoadingSettings } = useGetSettings({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const createGuest = useCreateGuest({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const deleteGuest = useDeleteGuest({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const updateSettings = useUpdateSettings({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}invite/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Ссылка скопирована",
      description: "Ссылка на приглашение скопирована в буфер обмена",
    });
  };

  const handleDeleteGuest = (id: number) => {
    if (confirm("Вы уверены, что хотите удалить этого гостя?")) {
      deleteGuest.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
          toast({ title: "Гость удален" });
        }
      });
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background relative pb-20">
      <FloatingPetals />
      
      <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-serif text-primary">Управление свадьбой</h1>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-primary">
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 relative z-10">
        <Tabs defaultValue="guests" className="space-y-8">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-border p-1">
            <TabsTrigger value="guests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Гости</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Всего гостей" value={stats?.total || 0} icon={<Users className="w-5 h-5 text-accent" />} />
              <StatCard title="Подтвердили" value={stats?.attending || 0} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
              <StatCard title="Ожидают" value={stats?.pending || 0} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
              <StatCard title="Прошли игру" value={stats?.gameCompleted || 0} icon={<Gamepad2 className="w-5 h-5 text-secondary" />} />
            </div>

            {/* Guests Table */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-serif">Список гостей</CardTitle>
                <AddGuestDialog token={token!} onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
                  queryClient.invalidateQueries({ queryKey: getGetGuestStatsQueryKey() });
                }} />
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-white/50 backdrop-blur-sm overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Имя</TableHead>
                        <TableHead>Обращение</TableHead>
                        <TableHead>Персон</TableHead>
                        <TableHead>Статус RSVP</TableHead>
                        <TableHead>Игра</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guests?.map(guest => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-medium">{guest.firstName} {guest.lastName}</TableCell>
                          <TableCell>{guest.salutationType}</TableCell>
                          <TableCell>{guest.guestsCount}</TableCell>
                          <TableCell>
                            {guest.rsvpStatus === 'attending' && <span className="text-green-600 font-semibold">Придут</span>}
                            {guest.rsvpStatus === 'not_attending' && <span className="text-red-500">Не придут</span>}
                            {guest.rsvpStatus === 'pending' && <span className="text-yellow-600">Ожидание</span>}
                          </TableCell>
                          <TableCell>{guest.gameCompleted ? 'Да' : 'Нет'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => copyLink(guest.slug)} title="Копировать ссылку">
                                <Copy className="w-4 h-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteGuest(guest.id)} title="Удалить">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!guests?.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Гости пока не добавлены
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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
                      updateSettings.mutate({ data }, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
                          toast({ title: "Настройки сохранены" });
                        }
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

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-primary">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function AddGuestDialog({ token, onSuccess }: { token: string, onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    salutationType: "Дорогой" as any,
    guestsCount: 1,
    slug: ""
  });
  
  const createGuest = useCreateGuest({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGuest.mutate({ data: formData }, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ firstName: "", lastName: "", salutationType: "Дорогой", guestsCount: 1, slug: "" });
        onSuccess();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Добавить гостя
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-primary">Новый гость</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Фамилия</Label>
              <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Обращение</Label>
            <Select value={formData.salutationType} onValueChange={(val: any) => setFormData({...formData, salutationType: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Дорогой">Дорогой</SelectItem>
                <SelectItem value="Дорогая">Дорогая</SelectItem>
                <SelectItem value="Дорогие">Дорогие</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Количество персон</Label>
            <Input type="number" min="1" required value={formData.guestsCount} onChange={e => setFormData({...formData, guestsCount: parseInt(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label>Свой slug (опционально)</Label>
            <Input placeholder="Например: ivanov-family" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
            <p className="text-xs text-muted-foreground">Если оставить пустым, сгенерируется автоматически</p>
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={createGuest.isPending}>
            {createGuest.isPending ? "Добавление..." : "Добавить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({ initialData, onSubmit, isPending }: { initialData: any, onSubmit: (data: any) => void, isPending: boolean }) {
  const [data, setData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Заголовок свадьбы</Label>
          <Input value={data.weddingTitle} onChange={e => setData({...data, weddingTitle: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Имя жениха</Label>
          <Input value={data.groomName} onChange={e => setData({...data, groomName: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Имя невесты</Label>
          <Input value={data.brideName} onChange={e => setData({...data, brideName: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Дата (YYYY-MM-DD)</Label>
          <Input type="date" value={data.weddingDate} onChange={e => setData({...data, weddingDate: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Время (HH:MM)</Label>
          <Input type="time" value={data.weddingTime} onChange={e => setData({...data, weddingTime: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Название площадки</Label>
          <Input value={data.venueName} onChange={e => setData({...data, venueName: e.target.value})} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Адрес площадки</Label>
          <Input value={data.venueAddress} onChange={e => setData({...data, venueAddress: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Широта (Lat)</Label>
          <Input type="number" step="any" value={data.venueLat} onChange={e => setData({...data, venueLat: parseFloat(e.target.value)})} required />
        </div>
        <div className="space-y-2">
          <Label>Долгота (Lng)</Label>
          <Input type="number" step="any" value={data.venueLng} onChange={e => setData({...data, venueLng: parseFloat(e.target.value)})} required />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label>Текст приглашения</Label>
          <Textarea rows={4} value={data.invitationText} onChange={e => setData({...data, invitationText: e.target.value})} required />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label>Дресс-код</Label>
          <Textarea rows={2} value={data.dressCode || ""} onChange={e => setData({...data, dressCode: e.target.value})} />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label>Контакты организатора</Label>
          <Input value={data.contacts || ""} onChange={e => setData({...data, contacts: e.target.value})} />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="game-enabled" checked={data.gameEnabled} onCheckedChange={c => setData({...data, gameEnabled: c})} />
          <Label htmlFor="game-enabled">Включить игру</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="countdown-enabled" checked={data.countdownEnabled} onCheckedChange={c => setData({...data, countdownEnabled: c})} />
          <Label htmlFor="countdown-enabled">Показывать таймер</Label>
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isPending}>
        {isPending ? "Сохранение..." : "Сохранить настройки"}
      </Button>
    </form>
  );
}
