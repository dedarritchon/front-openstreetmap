# Conversation-Based Filtering Feature

## Overview
This feature adds conversation-based filtering to the OpenStreetMap application, allowing users to:
- Associate each pinned location and saved route with a Front conversation ID
- Filter displayed routes and points by conversation
- View a selector showing all conversations that have saved routes or points
- Switch between viewing all conversations or a specific conversation

## Changes Made

### 1. Data Model Updates

#### `PinnedLocation` Interface (`pinnedLocationsStorage.ts`)
- Added optional `conversationId?: string` field to store the Front conversation ID

#### `SavedRoute` Interface (`savedRoutesStorage.ts`)
- Added optional `conversationId?: string` field to store the Front conversation ID

### 2. New Utilities

#### `conversationFiltering.ts`
- `getAllConversations()`: Retrieves all unique conversations from saved routes and pinned locations
- Returns `ConversationInfo[]` with conversation ID, label, and counts of points/routes
- `getAllConversationsLabel()`: Generates label for "All Conversations" option

### 3. New Components

#### `ConversationFilter.tsx`
A dropdown component that displays:
- Current selected conversation or "All Conversations"
- List of all conversations with their route and point counts
- Styled with gradient when filtering is active
- Dropdown menu with conversation list

### 4. Component Updates

#### `OpenStreetMapApp.tsx`
- Imported and integrated `ConversationFilter` component
- Added state for `selectedConversationId` and `conversations`
- Added `ConversationFilterWrapper` styled component (positioned top-left)
- Integrated Front context via `useFrontContext()` hook
- Updated map click handler to capture `conversationId` when creating pinned locations
- Added effect to update conversations list when routes/locations change
- Updated route rendering to filter by selected conversation
- Updated markers to filter pinned locations by selected conversation
- Passed `conversationId` to DirectionsPanel
- Updated LocationsList to show only filtered pinned locations
- Updated SavedRoutesList with filtered routes prop
- Updated CSV import to associate imported points with current conversation

#### `DirectionsPanel.tsx`
- Added optional `conversationId` prop to interface
- Updated all three `addSavedRoute()` calls to include `conversationId`

#### `SavedRoutesList.tsx`
- Added optional `filteredRoutes` prop
- Updated to use filtered routes instead of loading all routes

#### `usePinnedLocations.ts`
- Updated hook to accept optional `conversationId` parameter
- Modified `handlePinLocation()` to include `conversationId` when adding locations

#### `csvExport.ts`
- Updated `importPointsFromCSV()` to accept optional `conversationId` parameter
- Associates imported CSV points with the current conversation

### 5. UI Layout

The conversation filter is positioned:
- **Top-left corner** of the map (z-index: 1500)
- Above the map but below modals/panels
- Compact button design with dropdown
- Active state shown with gradient background

## How It Works

### Creating Points/Routes
1. When a user creates a point (by clicking the map) or a route (via DirectionsPanel):
   - The current Front conversation ID is retrieved from `frontContext`
   - The `conversationId` is saved with the point/route

### Filtering Display
1. User clicks the conversation filter dropdown
2. Sees a list of all conversations that have saved data
3. Selects a specific conversation or "All Conversations"
4. The app filters:
   - Map markers (pinned locations)
   - Route polylines on the map
   - Items in LocationsList
   - Items in SavedRoutesList

### Filter States
- **All Conversations (default)**: Shows everything regardless of conversation
- **Specific Conversation**: Only shows routes and points associated with that conversation

## Technical Details

### Conversation ID Source
The conversation ID comes from the Front SDK's `WebViewContext`:
- Accessed via `useFrontContext()` hook
- Checked with type guard: `frontContext && 'conversation' in frontContext`
- Extracted as: `frontContext.conversation?.id`

### Storage
- All data persists in localStorage (same as before)
- Conversation IDs are stored with each route/point
- No migration needed - existing items without `conversationId` are treated as "no conversation"

### Filtering Logic
- Filter applied at render time in `OpenStreetMapApp`
- Routes: `savedRoutes.filter(r => selectedConversationId === null || r.conversationId === selectedConversationId)`
- Points: `pinnedLocations.filter(p => selectedConversationId === null || p.conversationId === selectedConversationId)`

## Benefits

1. **Organization**: Users can organize routes and points by conversation context
2. **Context-aware**: Automatically associates data with the current conversation
3. **Easy Switching**: Quick filter to focus on specific conversation's data
4. **Backward Compatible**: Existing data without conversation IDs still works
5. **Import/Export**: CSV imports are associated with current conversation

## Future Enhancements

Possible improvements:
- Show conversation subject instead of ID in the filter
- Add conversation colors to differentiate visually on map
- Export conversation ID in CSV for backup/restore
- Bulk operations (move points between conversations)
