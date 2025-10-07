import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, getDoc, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import webpush from "web-push";

export const runtime = "nodejs";

// This endpoint can be triggered by Vercel Cron Jobs (paid plans) or manually.
// To enable the scheduled job, add to vercel.json: { "crons": [{ "path": "/api/cron/check-reminders", "schedule": "0 * * * *" }] }

export async function POST(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron (optional security check)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.log("Checking for overdue reminders...");

    // Configure VAPID for web-push
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'your-email@cannafriend.com'),
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Get current time
    const now = new Date();
    const nowString = now.toISOString();

    // Get all users who might have reminders
    const usersSnapshot = await getDocs(collection(db, "users"));
    const overdueReminders: any[] = [];

    // Check each user's reminders subcollection
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      const userRemindersQuery = query(
        collection(db, "users", userId, "reminders"),
        where("isActive", "==", true),
        where("nextReminder", "<=", nowString)
      );

      const userRemindersSnapshot = await getDocs(userRemindersQuery);

      for (const reminderDoc of userRemindersSnapshot.docs) {
        overdueReminders.push({
          id: reminderDoc.id,
          userId: userId, // Add userId to the reminder data
          ...reminderDoc.data()
        });
      }
    }

    console.log(`Found ${overdueReminders.length} overdue reminders`);

    if (overdueReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No overdue reminders found",
        checked: 0,
        sent: 0
      });
    }

    let sentCount = 0;
    let errorCount = 0;

    // Process each overdue reminder
    for (const reminder of overdueReminders) {
      try {
        // Get user's push subscription
        const subscriptionRef = doc(db, "pushSubscriptions", reminder.userId);
        const subscriptionSnap = await getDoc(subscriptionRef);
        const subscription = subscriptionSnap.data();

        if (subscription?.endpoint) {
          // Send push notification
          const notificationPayload = {
            title: getNotificationTitle(reminder),
            body: getNotificationBody(reminder),
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `reminder-${reminder.id}`,
            data: {
              url: `/plants/${reminder.plantId}`,
              reminderId: reminder.id,
              plantId: reminder.plantId
            },
            actions: [
              { action: 'view_plant', title: 'View Plant' },
              { action: 'mark_done', title: 'Mark Done' }
            ]
          };

          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            },
            JSON.stringify(notificationPayload)
          );

          sentCount++;
          console.log(`Sent notification for reminder ${reminder.id} to user ${reminder.userId}`);
        }

        // Update reminder with next occurrence
        const nextReminderDate = new Date(reminder.nextReminder);
        nextReminderDate.setDate(nextReminderDate.getDate() + reminder.interval);

        await updateDoc(doc(db, "users", reminder.userId, "reminders", reminder.id), {
          lastReminder: nowString,
          nextReminder: nextReminderDate.toISOString()
        });

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueReminders.length} overdue reminders`,
      checked: overdueReminders.length,
      sent: sentCount,
      errors: errorCount
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

function getNotificationTitle(reminder: any): string {
  if (reminder.title) {
    return reminder.title;
  }

  // Generate title based on reminder type
  switch (reminder.type) {
    case 'watering':
      return `💧 ${reminder.plantName} needs watering`;
    case 'feeding':
      return `🌱 ${reminder.plantName} needs fertilizer`;
    case 'training':
      return `✂️ ${reminder.plantName} needs training`;
    default:
      return `🔔 ${reminder.plantName} reminder`;
  }
}

function getNotificationBody(reminder: any): string {
  if (reminder.description) {
    return reminder.description;
  }

  // Generate body based on reminder type
  switch (reminder.type) {
    case 'watering':
      return `Your plant is ready for its next watering session.`;
    case 'feeding':
      return `Time to give your plant some nutrients!`;
    case 'training':
      return `Your plant might need some pruning or training.`;
    default:
      return `Don't forget to take care of your plant.`;
  }
}
