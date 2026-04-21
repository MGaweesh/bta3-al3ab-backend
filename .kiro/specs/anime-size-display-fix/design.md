# Anime Size Display Fix Bugfix Design

## Overview

This document outlines the technical approach to fix a bug where anime items do not display their file size and the size is not calculated in the total storage when sending selections via WhatsApp. The root cause has been identified as anime entries lacking the `size` field that is present in other content types (movies, TV shows). The fix involves adding the `size` field to anime entries in the data source.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when an anime item is displayed or selected and the `size` field is missing from the data
- **Property (P)**: The desired behavior - anime items should display their file size and include it in WhatsApp selections
- **Preservation**: Existing behavior for movies and TV shows that must remain unchanged by the fix
- **size field**: A string property on item objects (e.g., "15 GB", "2.5 GB") that represents the file size of the content
- **MovieCard**: The component in `frontend/src/components/MovieCard/MovieCard.jsx` that displays items with their size badge
- **MovieDetailsModal**: The component in `frontend/src/components/MovieDetailsModal/MovieDetailsModal.jsx` that shows item details including size
- **useMovieSelection**: The hook in `frontend/src/hooks/useMovieSelection.js` that handles selection logic and WhatsApp message generation

## Bug Details

### Bug Condition

The bug manifests when an anime item is displayed in the UI or included in a WhatsApp selection. The `size` field is missing from anime entries in the data source (`backend/data/movies.json`), causing the size badge to not appear and the size to be excluded from selection messages.

**Formal Specification:**
```
FUNCTION isBugCondition(item)
  INPUT: item of type Object (movie, tvShow, or anime entry)
  OUTPUT: boolean
  
  RETURN item.type === 'أنمي'
         AND item.category === 'anime'
         AND NOT hasProperty(item, 'size')
END FUNCTION
```

### Examples

- **Anime item "another" (id: 1)**: Has fields `id`, `name`, `type`, `year`, `rating`, `episodes`, `image` but NO `size` field. Expected: Should display size badge like "15 GB" in MovieCard and include size in WhatsApp message.
- **Anime item in selection**: When selected and sent via WhatsApp, the message shows `${item.name} (${item.year}) - ${item.type} - ${item.episodes} حلقة` without size, while movies show `${item.name} (${item.year}) - ${item.type} - 15 GB`.
- **Movie item with size**: Movies with `size` field correctly display the size badge in MovieCard and include size in WhatsApp messages.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Movie items with `size` field must continue to display the size badge correctly
- TV show items with `size` field must continue to display the size badge correctly
- Items without `size` field must continue to gracefully hide the size display without errors
- The `getSelectedItemsNames()` function must continue to handle items with and without size correctly

**Scope:**
All items that already have the `size` field (movies, TV shows) should be completely unaffected by this fix. The fix only adds the `size` field to anime entries that currently lack it.

## Hypothesized Root Cause

Based on the bug analysis, the root cause is:

1. **Missing Data Field**: Anime entries in `backend/data/movies.json` under the `"anime"` array do not have a `size` property added when the data is created or imported.

2. **Data Entry Process Gap**: The data entry or import process for anime items may not include a step to add the `size` field, unlike the process for movies and TV shows.

3. **No Default Size Handling**: There is no fallback or default size calculation for items missing the `size` field.

The components (MovieCard, MovieDetailsModal, useMovieSelection) correctly check for `item.size` and conditionally render or include it. The issue is purely a data problem - the `size` field is absent from anime entries.

## Correctness Properties

Property 1: Bug Condition - Anime Size Display

_For any_ anime item where the bug condition holds (isBugCondition returns true because size field is missing), after the fix the anime entry SHALL have a `size` field with a valid size value (e.g., "15 GB", "2.5 GB"), enabling the size badge to display in MovieCard and the size to be included in WhatsApp messages.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Size Display

_For any_ item where the bug condition does NOT hold (movies and TV shows that already have size, or items without size that gracefully hide it), the fixed data SHALL produce the same display and WhatsApp message behavior as before, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

**File**: `backend/data/movies.json`

**Specific Changes**:
1. **Add size field to each anime entry**: For each object in the `"anime"` array, add a `size` property with an appropriate value (e.g., "15 GB", "20 GB", etc.)

   Example change for an anime entry:
   ```json
   {
     "id": 1,
     "name": "another",
     "type": "أنمي",
     "year": "2012",
     "rating": "7.5",
     "episodes": 12,
     "size": "15 GB",
     "image": "..."
   }
   ```

2. **Determine appropriate size values**: Size values should be determined based on:
   - File size of the anime content if known
   - Typical size ranges for anime of similar episode count
   - Placeholder values if exact sizes are unknown (to be updated later)

3. **Maintain data consistency**: Ensure all anime entries have the `size` field added, not just some

**No Code Changes Required**:
- `MovieCard.jsx` already correctly checks `item.size` and renders the size badge
- `MovieDetailsModal.jsx` already correctly checks `item.size` and displays it in the info grid
- `useMovieSelection.js` already correctly includes size in the selection message when present

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the bug exists on unfixed data, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Inspect the anime entries in `backend/data/movies.json` and verify that `size` field is missing. Run the application and observe that anime items do not show size badges.

**Test Cases**:
1. **Data Inspection Test**: Open `backend/data/movies.json`, navigate to `"anime"` array, verify entries lack `size` field (will confirm bug on unfixed data)
2. **UI Display Test**: Navigate to anime section in the app, observe that anime cards do not show size badges (will fail on unfixed data)
3. **WhatsApp Message Test**: Select an anime item, trigger WhatsApp send, observe message lacks size for anime (will fail on unfixed data)
4. **Movie Comparison Test**: Select a movie with size, trigger WhatsApp send, observe message includes size (will pass, shows expected behavior)

**Expected Counterexamples**:
- Anime entries in JSON have no `size` property
- MovieCard does not render size badge for anime items
- WhatsApp message for anime selection lacks size information

### Fix Checking

**Goal**: Verify that for all anime items where the bug condition holds, the fixed data produces the expected behavior.

**Pseudocode:**
```
FOR ALL animeItem WHERE isBugCondition(animeItem) BEFORE FIX DO
  ASSERT NOT hasProperty(animeItem, 'size')
END FOR

FOR ALL animeItem WHERE isBugCondition(animeItem) IS FALSE AFTER FIX DO
  result := animeItem.size
  ASSERT result IS NOT EMPTY
  ASSERT result MATCHES sizePattern (e.g., "X GB", "X.Y GB")
END FOR
```

### Preservation Checking

**Goal**: Verify that for all items where the bug condition does NOT hold (movies, TV shows), the fix produces the same result as before.

**Pseudocode:**
```
FOR ALL item WHERE item.type IN ['فيلم', 'مسلسل'] DO
  ASSERT item.size display behavior unchanged
  ASSERT WhatsApp message format unchanged
END FOR
```

**Testing Approach**: Manual verification that existing movie and TV show items continue to display and send correctly.

**Test Cases**:
1. **Movie Size Preservation**: Verify movies with size continue to show size badge after fix
2. **TV Show Size Preservation**: Verify TV shows with size continue to show size badge after fix
3. **No-Size Item Preservation**: Verify items without size continue to gracefully hide size display

### Unit Tests

- Test that `getSelectedItemsNames()` in `useMovieSelection.js` correctly includes size for anime items after fix
- Test that `MovieCard` renders size badge when `item.size` is present
- Test that `MovieDetailsModal` displays size in info grid when `item.size` is present

### Property-Based Tests

- Generate random anime items with size field and verify they display correctly
- Generate random items (movies, TV shows, anime) and verify preservation of existing display behavior
- Test that all content types handle size field consistently

### Integration Tests

- Test full flow: view anime item → see size badge → select item → send via WhatsApp → verify size in message
- Test mixed selection: select movie + anime → send via WhatsApp → verify both sizes in message
- Test anime item details modal: open modal → verify size displayed in info grid
