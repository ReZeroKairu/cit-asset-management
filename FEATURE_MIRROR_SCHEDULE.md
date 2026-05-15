# Mirror Schedule Feature - UX Design Document

## Overview

Added an intelligent **Mirror Schedule** feature to the SetScheduleModal component that allows users to duplicate selected maintenance weeks across corresponding weeks in other quarters of the fiscal year.

---

## User Experience Flow

### 1. **Selection & Discovery**

- Users select servicing weeks for any quarter (Q1, Q2, Q3, Q4)
- The "Selected weeks overview" section displays all selected weeks for that quarter
- On hover, a subtle **copy icon** appears next to each week

### 2. **Mirroring Action**

- User clicks the copy icon next to a selected week (e.g., "Week 6")
- The system intelligently:
  - Identifies the source week and quarter
  - Attempts to mirror it to all other quarters
  - Validates that the target quarter's date range includes that week number

### 3. **Smart Validation**

The mirror feature respects date boundaries:

- ✅ Only mirrors to quarters where the week actually exists
- ✅ Skips quarters where Week 6 doesn't exist (due to different date ranges)
- ✅ Prevents duplicate selections (won't add if week already selected)
- ✅ Provides clear feedback on success/partial success

### 4. **User Feedback**

After mirroring, users see an inline notification:

- **Success (green)**: "Week 6 mirrored to 3 quarters"
- **Partial Success (green)**: "Week 6 mirrored to 2 quarters. 1 quarter doesn't have Week 6"
- **Failed (amber)**: "Week 6 is not available in other quarters"

The message auto-dismisses after 3 seconds.

---

## Technical Implementation

### New State

```typescript
const [mirrorFeedback, setMirrorFeedback] = useState<{
  success: boolean;
  message: string;
  week?: number;
} | null>(null);
```

### Core Function: `mirrorWeekToOtherQuarters()`

```typescript
mirrorWeekToOtherQuarters(sourceQuarter: string, week: number)
```

- Takes source quarter and week number
- Iterates through all 4 quarters
- Validates week availability using `getWeeksInDateRange()`
- Updates state with new selections
- Generates contextual feedback message

### UI Components Updated

1. **Import Statement**: Added `Copy` and `CheckCircle` icons from lucide-react
2. **Selected Weeks Overview**:
   - Added hover group styling for better interactivity
   - Copy button appears on hover (opacity animation)
   - Week details restructured in flexbox for better alignment
3. **Feedback Toast**:
   - Displays above the data table
   - Green styling for success, amber for warnings
   - Uses icon indicator for visual clarity
   - Smooth transitions

---

## Key Features

### ✅ Intelligent Validation

- Respects date range constraints per quarter
- Won't mirror if week doesn't exist in target quarter
- Prevents duplicate week selections

### ✅ Clear User Feedback

- Real-time confirmation with specific counts
- Explains why some quarters were skipped
- Auto-dismissing notification (no UI clutter)

### ✅ Accessibility

- Tooltip on hover: "Mirror Week X to other quarters"
- Clear visual affordances (copy icon)
- Works with keyboard navigation (button-based interaction)

### ✅ Performance

- Efficient state updates using functional setState
- Single re-render per mirror action
- No unnecessary API calls

---

## Usage Example

**Scenario**: Maintenance team wants to service Week 6 for all quarters

1. Select Week 6 in Q1 (checkbox)
   - "Selected weeks overview" shows: **Week 6: Jan 5-11**

2. Hover over Week 6 entry
   - Copy icon appears

3. Click copy icon
   - System mirrors Week 6 to Q2, Q3, Q4 (if date ranges allow)
   - Toast shows: "✓ Week 6 mirrored to 3 quarters"

4. Users can continue editing or submit the form

---

## Edge Cases Handled

| Case                                 | Behavior                                                      |
| ------------------------------------ | ------------------------------------------------------------- |
| Week doesn't exist in target quarter | Skipped, reported in feedback                                 |
| Week already selected in target      | Not duplicated, counts in "already selected"                  |
| No valid targets                     | Shows amber warning: "Week X not available in other quarters" |
| Multiple weeks selected              | Each can be independently mirrored                            |
| Date range changed after mirroring   | Mirrors remain until user manually removes them               |

---

## Visual Design Notes

- **Copy Icon**: Blue color (#3b82f6) on hover background
- **Feedback Toast**: Uses semantic colors (green #16a34a for success, amber #d97706 for warnings)
- **Animation**: Smooth opacity transition on button visibility
- **Typography**: Maintained consistent sizing and weight hierarchy

---

## Future Enhancements

1. **Batch Mirror**: "Mirror all selected weeks to all quarters" button
2. **Mirror Patterns**: Pre-built patterns (e.g., "every 2 weeks")
3. **Undo/Redo**: Quick reversal of mirror actions
4. **Keyboard Shortcuts**: Alt+M to mirror selected week
5. **Conflict Detection**: Warn if mirroring creates overlapping schedules

---

## Files Modified

- **[SetScheduleModal.tsx](SetScheduleModal.tsx)**
  - Added `mirrorFeedback` state
  - Added `mirrorWeekToOtherQuarters()` function
  - Updated selected weeks UI with mirror buttons
  - Added feedback toast notification
  - Imported additional icons: `Copy`, `CheckCircle`
