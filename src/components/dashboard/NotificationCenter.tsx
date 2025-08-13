"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/dashboardActions";

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_lead_id?: string;
  leads?: {
    name: string;
    phone: string;
  } | null;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await getNotifications();
      if (error) {
        setError(error);
      } else {
        setNotifications(data ? data.map((item: any) => ({
          id: item.id,
          message: item.message,
          type: item.type,
          is_read: item.is_read,
          created_at: item.created_at,
          related_lead_id: item.related_lead_id,
          leads: item.leads && item.leads.length > 0 ? { name: item.leads[0].name, phone: item.leads[0].phone } : null,
        })) : []);
      }
    } catch (err) {
      setError("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Recarrega notificações a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { success } = await markNotificationAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { success } = await markAllNotificationsAsRead();
      if (success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
      }
    } catch (err) {
      console.error("Erro ao marcar todas as notificações como lidas:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reuniao_hoje':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'lembrete_1h':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'reuniao_hoje':
        return 'bg-blue-100 text-blue-800';
      case 'lembrete_1h':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando notificações...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Bell className="h-5 w-5" />
            Erro nas Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <CardDescription>
          Lembretes de reuniões e outras notificações importantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma notificação no momento
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      notification.is_read 
                        ? 'bg-muted/30' 
                        : 'bg-primary/5 border border-primary/20'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.is_read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                        >
                          {notification.type === 'reuniao_hoje' ? 'Reunião Hoje' : 
                           notification.type === 'lembrete_1h' ? 'Lembrete 1h' : 
                           'Geral'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex-shrink-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}