import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TalentBooking, Project, ProjectPayment } from './types';

const NOTIFICATION_SETTINGS_KEY = '@talent_manager_notification_settings';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  bookingReminders: boolean;
  paymentReminders: boolean;
  photoUpdateReminders: boolean;
  reminderHoursBefore: number; // Hours before booking to remind
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  bookingReminders: true,
  paymentReminders: true,
  photoUpdateReminders: true,
  reminderHoursBefore: 24, // 24 hours before
};

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// Get notification settings
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

// Save notification settings
export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

// Schedule a booking reminder notification
export async function scheduleBookingReminder(booking: TalentBooking, talentName: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const settings = await getNotificationSettings();
  if (!settings.bookingReminders) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const bookingDate = new Date(booking.startDate);
  const reminderDate = new Date(bookingDate.getTime() - settings.reminderHoursBefore * 60 * 60 * 1000);

  // Don't schedule if reminder date is in the past
  if (reminderDate <= new Date()) return null;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Booking Reminder',
        body: `Upcoming booking with ${talentName}: ${booking.title}${booking.location ? ` at ${booking.location}` : ''}`,
        data: { type: 'booking', bookingId: booking.id, talentId: booking.talentId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling booking reminder:', error);
    return null;
  }
}

// Schedule a payment due reminder
export async function schedulePaymentReminder(
  project: Project,
  dueDate: Date,
  amountDue: number
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const settings = await getNotificationSettings();
  if (!settings.paymentReminders) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  // Remind 1 day before due date
  const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);

  // Don't schedule if reminder date is in the past
  if (reminderDate <= new Date()) return null;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Payment Due Reminder',
        body: `Payment of ${amountDue} KWD due tomorrow for project: ${project.name}`,
        data: { type: 'payment', projectId: project.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling payment reminder:', error);
    return null;
  }
}

// Schedule monthly photo update reminder
export async function schedulePhotoUpdateReminder(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const settings = await getNotificationSettings();
  if (!settings.photoUpdateReminders) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  // Schedule for the 1st of next month at 10:00 AM
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0);

  try {
    // Cancel any existing photo update reminders first
    await cancelPhotoUpdateReminders();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📸 Photo Update Reminder',
        body: 'Time to check and update talent photos for the new month!',
        data: { type: 'photo_update' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextMonth,
      },
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling photo update reminder:', error);
    return null;
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel specific notification
export async function cancelNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel photo update reminders
export async function cancelPhotoUpdateReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'photo_update') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  if (Platform.OS === 'web') return [];
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Send immediate notification (for testing)
export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permission not granted');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Test Notification',
      body: 'Notifications are working correctly!',
      sound: true,
    },
    trigger: null, // Immediate
  });
}

// Listen for notification responses
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Listen for notifications received while app is foregrounded
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}
