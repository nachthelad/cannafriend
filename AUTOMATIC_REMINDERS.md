# 🔔 Automatic Plant Care Reminders

## ✅ Implementation Complete

Your plant care reminders now automatically send **push notifications** when they're due!

## 🔧 How It Works

### 1. **User Creates Reminder**
- User sets up reminder in plant details (watering every 3 days, feeding weekly, etc.)
- Reminder stored with `nextReminder` timestamp in Firestore
- Title and description determined from reminder type or custom text

### 2. **Background Monitoring**
- **Vercel Cron Job** runs every hour: `/api/cron/check-reminders`
- Checks all active reminders across all users
- Finds reminders where `nextReminder <= current time`

### 3. **Push Notification Sent**
- Sends push notification to user's device(s)
- Updates reminder to next occurrence (adds `interval` days)
- Smart notification content based on reminder type

## 📱 Notification Examples

### **Watering Reminder**
- **Title**: "💧 My Tomato Plant needs watering"
- **Body**: "Your plant is ready for its next watering session."
- **Actions**: [View Plant] [Mark Done]

### **Feeding Reminder**
- **Title**: "🌱 My Cannabis needs fertilizer"
- **Body**: "Time to give your plant some nutrients!"
- **Actions**: [View Plant] [Mark Done]

### **Custom Reminder**
- **Title**: "✂️ Check for pests" (custom title)
- **Body**: "Look under leaves for spider mites" (custom description)
- **Actions**: [View Plant] [Mark Done]

## ⚙️ Setup Required

### 1. Environment Variables
Add to your `.env.local`:
```bash
# VAPID Keys (already provided)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BCJZ-Q7XTd_t8XxGdURzoiS3qyHyNRBmzILhoV_voh5L3SXOKp9CtyGn39v8IaF_lBDQd8eJrl_ADSdwolVeuU8
VAPID_PRIVATE_KEY=rJogIsdlGoGfpyOmT8uw7zm30fVgk0f2kQNuV6I3pjc
VAPID_EMAIL=nacho.vent@gmail.com

# Cron Security (generate a random string)
CRON_SECRET=your-random-secret-key-here
```

### 2. Vercel Deployment
The `vercel.json` file configures the cron job:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-reminders",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

**⚠️ Cron jobs only work on Vercel Pro plans** - but you can manually trigger for testing.

## 🧪 Testing

### Manual Testing (Development)
You can manually trigger the cron job:
```bash
curl -X POST http://localhost:3001/api/cron/check-reminders \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### User Testing Flow
1. **Enable notifications** in Settings → Notifications
2. **Create a reminder** with short interval (e.g., 1 day)
3. **Wait for reminder** to become overdue
4. **Check phone** for push notification

## 🔍 Monitoring & Logs

### Vercel Function Logs
Check Vercel dashboard → Functions → `/api/cron/check-reminders` for:
- How many reminders were checked
- How many notifications were sent
- Any errors that occurred

### Expected Log Output
```
Checking for overdue reminders...
Found 3 overdue reminders
Sent notification for reminder abc123 to user def456
Processed 3 overdue reminders, sent: 3, errors: 0
```

## 📊 Database Schema

### Reminders Structure
```
users/{userId}/reminders/{reminderId}
{
  plantId: "plant123",
  plantName: "My Tomato Plant",
  type: "watering" | "feeding" | "training" | "custom",
  title: "Custom title" | null,
  description: "Custom description" | null,
  interval: 3, // days
  nextReminder: "2025-01-15T10:00:00.000Z",
  lastReminder: "2025-01-12T10:00:00.000Z",
  isActive: true,
  createdAt: "2025-01-01T10:00:00.000Z"
}
```

### Push Subscriptions
```
pushSubscriptions/{userId}
{
  userId: "def456",
  endpoint: "https://fcm.googleapis.com/...",
  keys: {
    p256dh: "...",
    auth: "..."
  },
  createdAt: "2025-01-01T10:00:00.000Z"
}
```

## 🚀 Deployment Checklist

- [ ] Add environment variables to Vercel
- [ ] Deploy to Vercel (cron jobs require deployment)
- [ ] Test cron job manually via API
- [ ] Create test reminder with short interval
- [ ] Verify push notification received
- [ ] Check Vercel function logs for errors

## 🔮 Future Enhancements

### Smart Scheduling
- **Optimal Times**: Send reminders at user's preferred times (morning for watering)
- **Weather Integration**: Delay watering reminders during rainy days
- **Growth Stage**: Adjust reminder frequency based on plant growth phase

### Enhanced Notifications
- **Rich Content**: Include plant photos in notifications
- **Multiple Actions**: [Water Now] [Delay 2h] [Mark Sick] [Skip Today]
- **Grouped Reminders**: "3 plants need watering" instead of 3 separate notifications

### User Preferences
- **Quiet Hours**: Don't send notifications during sleep hours
- **Reminder Types**: Choose which types of reminders to receive
- **Frequency Limits**: Max 1 notification per hour to avoid spam

## 🎯 Notification Click Actions

When users click notifications, they navigate to:
- **Default Click**: Plant details page (`/plants/{plantId}`)
- **View Plant Action**: Same as default click
- **Mark Done Action**: Could mark reminder as completed (future feature)

## 💡 Tips

1. **Test Thoroughly**: Create reminders with 1-day intervals for quick testing
2. **Monitor Usage**: Check Vercel function execution time and costs
3. **User Education**: Show users how to enable notifications in settings
4. **Gradual Rollout**: Start with active users who have enabled notifications

---

**Your plants will never go thirsty again! 🌱💧📱**