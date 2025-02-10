import React, { useState } from 'react';
import { Bell, Package, AlertTriangle, Clock, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success';
  message: string;
  time: string;
  read: boolean;
  details?: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      message: 'Low stock alert: Laptop-001',
      details: 'Current stock: 2 units. Minimum required: 5 units.',
      time: '5 minutes ago',
      read: false
    },
    {
      id: '2',
      type: 'info',
      message: 'New inventory items added',
      details: '15 new items have been added to the Electronics category',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'success',
      message: 'Stock count completed',
      details: 'Warehouse A inventory count has been completed successfully',
      time: '2 hours ago',
      read: false
    },
    {
      id: '4',
      type: 'alert',
      message: 'Stock level critical: USB-C Cable',
      details: 'Stock has fallen below minimum threshold',
      time: '3 hours ago',
      read: true
    },
    {
      id: '5',
      type: 'info',
      message: 'System maintenance scheduled',
      details: 'System will undergo maintenance on Saturday at 2 AM',
      time: '1 day ago',
      read: true
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'success':
        return <Package className="w-6 h-6 text-green-500" />;
      default:
        return <Bell className="w-6 h-6 text-blue-500" />;
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Notifications</h1>
        <p className="text-gray-600">View and manage your notifications</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="font-medium">All Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 md:p-6 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => markAsRead(notification.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                          {notification.message}
                        </p>
                        {notification.details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.details}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3" />
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;