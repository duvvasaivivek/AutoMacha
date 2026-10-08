import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  Loader2,
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  MessageCircle,
  BellOff,
  Inbox,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { respondRideShare } from '@/services/travelRequest.service';
import type { Notification, NotificationType, TravelRequestUser } from '@/types';
import { RideConnectModal } from '@/components/RideConnectModal';
import { formatDateTime } from '@/utils/date';
import { useNotifications } from '@/hooks';
import { EmptyState } from '@/components/common/EmptyState';
import axios from 'axios';

type NotificationFilter = 'ALL' | 'UNREAD' | 'REQUESTS' | 'MATCHES';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
};

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case 'RIDE_SHARE_REQUEST_RECEIVED':
      return {
        label: 'Ride Share Request',
        icon: Share2,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'RIDE_SHARE_REQUEST_ACCEPTED':
      return {
        label: 'Request Accepted',
        icon: CheckCircle2,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'RIDE_SHARE_REQUEST_DECLINED':
      return {
        label: 'Request Declined',
        icon: XCircle,
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'TRAVEL_REQUEST_EXPIRED':
      return {
        label: 'Expired',
        icon: AlertTriangle,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'NEW_MATCH_FOUND':
      return {
        label: 'New Match',
        icon: Sparkles,
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    default:
      return {
        label: 'Notification',
        icon: Bell,
        className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      };
  }
}

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, isLoading, error, refetch, markAsRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [markingIds, setMarkingIds] = useState<Record<number, boolean>>({});
  const [respondingId, setRespondingId] = useState<Record<number, boolean>>({});
  const [responseStatus, setResponseStatus] = useState<Record<number, 'ACCEPTED' | 'DECLINED'>>({});
  const [selectedPartner, setSelectedPartner] = useState<{ user: TravelRequestUser; destName: string; dateStr: string; reqId: number } | null>(null);

  const handleRespond = async (notif: Notification, action: 'ACCEPT' | 'DECLINE') => {
    if (!notif.related_object_id) return;
    const senderUsername = notif.sender_user?.username || notif.message.split(' ')[0];
    setRespondingId((prev) => ({ ...prev, [notif.id]: true }));
    try {
      await respondRideShare(notif.related_object_id, senderUsername, action);
      setResponseStatus((prev) => ({ ...prev, [notif.id]: action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' }));
      if (!notif.is_read) {
        await markAsRead(notif.id);
        window.dispatchEvent(new Event('notifications-updated'));
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.response?.data?.detail) : null;
      toast.error(msg || 'Failed to respond to ride share request.');
    } finally {
      setRespondingId((prev) => ({ ...prev, [notif.id]: false }));
    }
  };

  const handleMarkAsRead = async (id: number) => {
    if (markingIds[id]) return;
    setMarkingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await markAsRead(id);
      window.dispatchEvent(new Event('notifications-updated'));
    } catch {
      // Silently ignore
    } finally {
      setMarkingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllRead();
      window.dispatchEvent(new Event('notifications-updated'));
    } catch {
      // Handle failure
    } finally {
      setIsMarkingAll(false);
    }
  };

  const requestCount = notifications.filter((n) => n.notification_type.startsWith('RIDE_SHARE_REQUEST_')).length;
  const matchCount = notifications.filter((n) => n.notification_type === 'NEW_MATCH_FOUND').length;

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'UNREAD') return !notif.is_read;
    if (filter === 'REQUESTS') return notif.notification_type.startsWith('RIDE_SHARE_REQUEST_');
    if (filter === 'MATCHES') return notif.notification_type === 'NEW_MATCH_FOUND';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
              Notifications
            </h1>
            {!isLoading && !error && unreadCount > 0 && (
              <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-neutral-500">
            Stay updated on ride share requests, matches, and trip status.
          </p>
        </div>

        {!isLoading && !error && notifications.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="gap-1.5 font-semibold text-neutral-700 hover:text-black border-neutral-200"
              title="Refresh notifications"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || isMarkingAll}
              size="sm"
              className="bg-black text-white hover:bg-neutral-800 font-semibold gap-1.5 disabled:opacity-50 transition-all shadow-xs"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              <span>Mark All as Read</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs Bar */}
      {!isLoading && !error && notifications.length > 0 && (
        <div className="w-full flex items-center gap-2 pb-5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'ALL' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              {notifications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('UNREAD')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === 'UNREAD'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === 'UNREAD' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter('REQUESTS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === 'REQUESTS'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Share2 className="h-3 w-3" />
            <span>Ride Requests</span>
            {requestCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === 'REQUESTS' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {requestCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter('MATCHES')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === 'MATCHES'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Matches</span>
            {matchCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === 'MATCHES' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {matchCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="w-full space-y-4">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="w-full p-5 rounded-2xl border border-neutral-200/60 bg-neutral-50/50 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-neutral-200 rounded-md" />
                <div className="h-4 w-20 bg-neutral-200 rounded-md" />
              </div>
              <div className="h-5 w-48 bg-neutral-300 rounded-md" />
              <div className="h-4 w-3/4 bg-neutral-200 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="w-full max-w-md mx-auto my-12 p-8 rounded-2xl border border-red-200 bg-red-50 text-center space-y-4 shadow-xs">
          <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900 text-base">Unable to Load Notifications</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <Button
            onClick={refetch}
            size="sm"
            variant="outline"
            className="font-semibold border-red-300 text-red-900 hover:bg-red-100 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Total Empty State */}
      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          icon={<BellOff className="h-8 w-8 text-neutral-400" />}
          title="No notifications yet."
          description="When you receive ride requests, matches, or trip updates, they will show up here."
        />
      )}

      {/* Filtered Empty State */}
      {!isLoading && !error && notifications.length > 0 && filteredNotifications.length === 0 && (
        <div className="w-full max-w-md mx-auto my-12 p-8 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-center space-y-4">
          <Inbox className="h-9 w-9 text-neutral-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-neutral-900 text-base">
              {filter === 'UNREAD' ? "You're all caught up!" : 'No notifications in this view'}
            </h3>
            <p className="text-xs text-neutral-500">
              {filter === 'UNREAD'
                ? 'There are no unread notifications right now.'
                : 'There are no items matching the selected filter category.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilter('ALL')}
            className="gap-1.5 font-semibold text-xs border-neutral-300"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>View All Notifications</span>
          </Button>
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && !error && filteredNotifications.length > 0 && (
        <motion.div
          className="w-full space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((notif) => {
              const badge = getNotificationBadge(notif.notification_type);
              const BadgeIcon = badge.icon;
              const isMarking = markingIds[notif.id];

              return (
                <motion.div
                  key={notif.id}
                  variants={itemVariants}
                  layout
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`w-full transition-all duration-200 rounded-2xl border shadow-xs overflow-hidden ${
                      notif.is_read
                        ? 'bg-white border-neutral-200/80 opacity-80 hover:opacity-100 hover:border-neutral-300'
                        : 'bg-blue-50/20 border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}
                          >
                            <BadgeIcon className="h-3 w-3" />
                            <span>{badge.label}</span>
                          </span>

                          <span className="text-[11px] font-semibold text-neutral-500">
                            {formatDateTime(notif.created_at)}
                          </span>

                          {!notif.is_read && (
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm sm:text-base font-bold ${notif.is_read ? 'text-neutral-800' : 'text-black'}`}>
                          {notif.title}
                        </h3>
                        <p className={`text-xs sm:text-sm leading-relaxed ${notif.is_read ? 'text-neutral-500' : 'text-neutral-700'}`}>
                          {notif.message}
                        </p>

                        {notif.notification_type === 'RIDE_SHARE_REQUEST_RECEIVED' && notif.related_object_id && (
                          <div className="pt-3 mt-3 border-t border-neutral-200/80 flex flex-wrap items-center gap-2.5">
                            {responseStatus[notif.id] ? (
                              <div
                                className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                                  responseStatus[notif.id] === 'ACCEPTED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-300'
                                }`}
                              >
                                {responseStatus[notif.id] === 'ACCEPTED' ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>🎉 You accepted this ride share request! An in-app confirmation has been sent to the student.</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                    <span>You declined this ride share request.</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRespond(notif, 'ACCEPT')}
                                    disabled={respondingId[notif.id]}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8 px-3.5 shadow-2xs"
                                  >
                                    {respondingId[notif.id] ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    <span>Accept Ride Request</span>
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRespond(notif, 'DECLINE')}
                                    disabled={respondingId[notif.id]}
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs gap-1.5 h-8 px-3.5"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Decline</span>
                                  </Button>
                                </motion.div>
                              </>
                            )}

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="ml-auto">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const senderUsername = notif.sender_user?.username || notif.message.split(' ')[0];
                                  const partnerObj = notif.sender_user || { id: 0, username: senderUsername };
                                  setSelectedPartner({
                                    user: partnerObj,
                                    destName: 'Requested Ride',
                                    dateStr: formatDateTime(notif.created_at),
                                    reqId: notif.related_object_id!,
                                  });
                                }}
                                className="bg-black hover:bg-neutral-800 text-white font-bold text-xs gap-1.5 h-8 px-3.5 shadow-2xs"
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Connect & Chat</span>
                              </Button>
                            </motion.div>
                          </div>
                        )}

                        {notif.notification_type === 'NEW_MATCH_FOUND' && notif.related_object_id && (
                          <div className="pt-2 mt-2">
                            <Link to={`/travel-requests/${notif.related_object_id}/matches`}>
                              <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-bold text-xs gap-1.5 h-8 px-3 shadow-2xs">
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                <span>View Match Details</span>
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>

                      {!notif.is_read && (
                        <div className="shrink-0 flex items-center self-end sm:self-center">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notif.id)}
                              disabled={isMarking}
                              className="font-semibold text-xs border-neutral-300 hover:bg-black hover:text-white hover:border-black transition-colors gap-1.5 shadow-2xs"
                            >
                              {isMarking ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5 text-emerald-600 group-hover:text-white" />
                              )}
                              <span>Mark as Read</span>
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {selectedPartner && (
        <RideConnectModal
          isOpen={Boolean(selectedPartner)}
          onClose={() => setSelectedPartner(null)}
          partner={selectedPartner.user}
          destinationName={selectedPartner.destName}
          travelDate={selectedPartner.dateStr}
          requestId={selectedPartner.reqId}
        />
      )}
    </div>
  );
};

export default NotificationsPage;
