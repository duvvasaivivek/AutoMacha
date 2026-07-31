import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Loader2,
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { respondRideShare } from '@/services/travelRequest.service';
import type { Notification, NotificationType, TravelRequestUser } from '@/types';
import { RideConnectModal } from '@/components/RideConnectModal';
import { formatDateTime } from '@/utils/date';
import { useNotifications } from '@/hooks';
import { EmptyState } from '@/components/common/EmptyState';
import axios from 'axios';

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
      alert(msg || 'Failed to respond to ride share request.');
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

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
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

      {/* Empty State */}
      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          title="No notifications yet."
          description="When you receive ride requests, matches, or trip updates, they will show up here."
        />
      )}

      {/* Notifications List */}
      {!isLoading && !error && notifications.length > 0 && (
        <div className="w-full space-y-3.5">
          {notifications.map((notif) => {
            const badge = getNotificationBadge(notif.notification_type);
            const BadgeIcon = badge.icon;
            const isMarking = markingIds[notif.id];

            return (
              <Card
                key={notif.id}
                className={`w-full transition-all duration-200 border-b border-x-0 border-t-0 rounded-none shadow-none ${
                  notif.is_read ? 'bg-transparent opacity-70' : 'bg-neutral-50'
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BadgeIcon className={`h-4 w-4 ${notif.is_read ? 'text-neutral-400' : 'text-blue-600'}`} />
                      <span className="text-[11px] font-semibold text-neutral-500">
                        {formatDateTime(notif.created_at)}
                      </span>
                      {!notif.is_read && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">NEW</span>
                      )}
                    </div>

                    <h3 className={`text-sm font-bold ${notif.is_read ? 'text-neutral-700' : 'text-black'}`}>
                      {notif.title}
                    </h3>
                    <p className={`text-xs ${notif.is_read ? 'text-neutral-500' : 'text-neutral-700'}`}>
                      {notif.message}
                    </p>

                    {notif.notification_type === 'RIDE_SHARE_REQUEST_RECEIVED' && notif.related_object_id && (
                      <div className="pt-3 mt-3 border-t border-neutral-200/80 flex flex-wrap items-center gap-2.5">
                        {responseStatus[notif.id] ? (
                          <div className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                            responseStatus[notif.id] === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
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
                          </>
                        )}

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
                          className="bg-black hover:bg-neutral-800 text-white font-bold text-xs gap-1.5 h-8 px-3.5 shadow-2xs ml-auto"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Connect & Chat</span>
                        </Button>
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
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
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
