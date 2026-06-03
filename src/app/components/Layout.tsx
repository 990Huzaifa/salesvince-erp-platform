import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  Activity,
  CreditCard,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Wrench,
  Megaphone,
  Flag,
  UserCircle,
  Shield,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router";
import logo from "figma:asset/c9eb705c262b44e040c81098d26d37c195fe9678.png";
import { APP_NAME } from "../utils";
import { clearAuthSession, getAuthSession } from "../utils/auth";
import {
  loadPlatformNotifications,
  markPlatformNotificationAsRead,
  normalizePlatformNotification,
  type PlatformNotification,
} from "../utils/notifications";
import { connectPlatformUserChannel, disconnectPlatformPusher } from "../utils/pusher";

const navigation = [
  { name: "Dashboard", href: "/master", icon: LayoutDashboard },
  { name: "Tenants", href: "/master/tenants", icon: Building2 },
  { name: "Customers", href: "/master/customers", icon: UserCircle },
  { name: "Billing", href: "/master/billing", icon: CreditCard },
  { name: "Modules", href: "/master/modules", icon: Package },
  { name: "Announcements", href: "/master/announcements", icon: Megaphone },
  { name: "Platform Users", href: "/master/users", icon: Users },
  { name: "Roles", href: "/master/roles", icon: Shield },
  { name: "Activity Logs", href: "/master/activity", icon: Activity },
  { name: "Support Tools", href: "/master/support", icon: Wrench },
  { name: "Settings", href: "/master/settings", icon: Settings },
];

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getNotificationTone = (type?: string) => {
  switch ((type || "info").toLowerCase()) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "error":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-blue-50 text-blue-700 border-blue-100";
  }
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAuthSession();
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const bellTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [bellRinging, setBellRinging] = useState(false);
  const displayName = session?.user.fullName || "Super Admin";
  const email = session?.user.email || "admin@salevince.com";
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const reloadNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const items = await loadPlatformNotifications();
      setNotifications(items.sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)));
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Failed to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const playNotificationSound = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextImpl = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextImpl) {
      return;
    }

    const context = audioContextRef.current || new AudioContextImpl();
    audioContextRef.current = context;

    try {
      if (context.state === "suspended") {
        await context.resume();
      }

      const gainNode = context.createGain();
      gainNode.gain.value = 0.0001;
      gainNode.connect(context.destination);

      const now = context.currentTime;
      const tones = [
        { freq: 880, start: 0, duration: 0.12 },
        { freq: 1175, start: 0.14, duration: 0.14 },
      ];

      tones.forEach(({ freq, start, duration }) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = freq;
        oscillator.connect(gainNode);

        gainNode.gain.setValueAtTime(0.0001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(0.06, now + start + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        oscillator.start(now + start);
        oscillator.stop(now + start + duration + 0.02);
      });
    } catch {
      // Ignore sound failures. Notifications should still render.
    }
  };

  useEffect(() => {
    if (!session?.user.id) {
      return;
    }

    const channel = connectPlatformUserChannel(session.user.id);
    const handleNotification = (payload: Partial<PlatformNotification>) => {
      const nextNotification = normalizePlatformNotification({
        ...payload,
        userId: payload.userId || session.user.id,
      });

      setNotifications((current) => [
        nextNotification,
        ...current.filter((item) => item.id !== nextNotification.id),
      ]);

      setBellRinging(true);
      if (bellTimerRef.current) {
        window.clearTimeout(bellTimerRef.current);
      }
      bellTimerRef.current = window.setTimeout(() => {
        setBellRinging(false);
      }, 900);

      void playNotificationSound();
    };

    void reloadNotifications();
    channel?.bind("notification.new", handleNotification);

    return () => {
      if (bellTimerRef.current) {
        window.clearTimeout(bellTimerRef.current);
        bellTimerRef.current = null;
      }
      channel?.unbind("notification.new", handleNotification);
      disconnectPlatformPusher();
    };
  }, [session?.user.id]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationPanelRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }

      const context = audioContextRef.current;
      if (context && context.state === "suspended") {
        void context.resume();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  const handleNotificationClick = async (notification: PlatformNotification) => {
    setNotificationsOpen(false);

    if (notification.isRead) {
      return;
    }

    setMarkingNotificationId(notification.id);

    try {
      await markPlatformNotificationAsRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                isRead: true,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Failed to mark notification as read.");
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const isActive = (href: string) => {
    if (href === "/master") {
      return location.pathname === "/master";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#F8F9FC' }}>
      {/* Sidebar */}
      <div className="w-64 flex flex-col" style={{ backgroundColor: '#21222D' }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Salevince" className="size-8" />
            <div>
              <div className="text-sm font-semibold text-white">{APP_NAME}</div>
              <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Control Panle</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active ? {
                  backgroundColor: '#958CE8',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(149, 140, 232, 0.3)'
                } : {
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(149, 140, 232, 0.1)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }
                }}
              >
                <Icon className="size-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(149, 140, 232, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div className="size-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#958CE8' }}>
              <span className="text-sm font-medium text-white">
                {displayName
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("") || "SA"}
              </span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white">{displayName}</div>
              <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{email}</div>
            </div>
            <ChevronDown className="size-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuthSession();
              navigate("/master/login", { replace: true });
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white flex items-center justify-between px-6" style={{
          borderBottom: '1px solid rgba(219, 219, 229, 0.4)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}>
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5" style={{ color: '#6B6C7E' }} />
              <input
                type="text"
                placeholder="Search tenants, modules, logs..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'rgba(219, 219, 229, 0.6)',
                  backgroundColor: '#F8F9FC',
                  '--tw-ring-color': '#958CE8'
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="relative flex items-center gap-3" ref={notificationPanelRef}>
            <button
              type="button"
              className="relative p-2.5 rounded-xl transition-all"
              style={{ color: '#6B6C7E' }}
              onClick={() => setNotificationsOpen((current) => !current)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8F9FC';
                e.currentTarget.style.color = '#21222D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6B6C7E';
              }}
            >
              <Bell
                className="size-5"
                style={
                  bellRinging
                    ? { animation: "bell-ring 0.9s ease-in-out" }
                    : undefined
                }
              />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-12 z-50 w-[24rem] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    <p className="text-xs text-gray-500">{unreadCount} unread</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void reloadNotifications()}
                    className="text-xs font-medium text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Refresh
                  </button>
                </div>

                {notificationsError ? (
                  <div className="px-4 py-3 text-sm text-red-700">{notificationsError}</div>
                ) : null}

                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleNotificationClick(notification)}
                        className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          notification.isRead ? "bg-white" : "bg-blue-50/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 size-2 rounded-full ${notification.isRead ? "bg-gray-300" : "bg-red-500"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="mt-0.5 text-sm text-gray-600">{notification.message}</p>
                              </div>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getNotificationTone(notification.type)}`}
                              >
                                {notification.type}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                              <span>{formatDateTime(notification.createdAt)}</span>
                              {markingNotificationId === notification.id ? (
                                <span>Updating...</span>
                              ) : notification.isRead ? (
                                <span>Read</span>
                              ) : (
                                <span>Tap to mark read</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <style>
        {`
          @keyframes bell-ring {
            0% { transform: rotate(0deg); }
            15% { transform: rotate(18deg); }
            30% { transform: rotate(-16deg); }
            45% { transform: rotate(12deg); }
            60% { transform: rotate(-8deg); }
            75% { transform: rotate(4deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </div>
  );
}
