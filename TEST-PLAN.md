# 🧪 Test Plan - JSON with GitHub Auto-Commit

## Prerequisites

1. Environment variables set in Render:
   - `GITHUB_TOKEN`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
   - `GITHUB_BRANCH`

2. Backend running on Render (or localhost)

## Test Commands

### 1. Health Check

**Test GitHub connection:**
```bash
curl https://bta3-al3ab-backend.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "API is running",
  "storage": "JSON files",
  "github": {
    "configured": true,
    "connection": "ok",
    "error": null
  }
}
```

### 2. Test GitHub Commit

**Test commit functionality:**
```bash
curl -X POST https://bta3-al3ab-backend.onrender.com/api/debug/commit-test
```

**Expected Response (Success):**
```json
{
  "status": "ok",
  "message": "Test commit successful",
  "result": {
    "commitUrl": "https://github.com/MGaweesh/bta3-al3ab-backend/commit/abc123",
    "sha": "def456",
    "commitSha": "abc123"
  }
}
```

**Expected Response (Failure):**
```json
{
  "status": "error",
  "error": "Test commit failed",
  "details": "Error message",
  "hint": "Check GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, and GITHUB_BRANCH environment variables"
}
```

### 3. Get All Games

```bash
curl https://bta3-al3ab-backend.onrender.com/api/games
```

**Expected Response:**
```json
{
  "readyToPlay": [...],
  "repack": [...],
  "online": [...]
}
```

### 4. Add a Game

```bash
curl -X POST https://bta3-al3ab-backend.onrender.com/api/games/readyToPlay \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Game",
    "size": "1GB",
    "image": "https://example.com/image.jpg",
    "description": "Test game description"
  }'
```

**Expected Response (Success with GitHub):**
```json
{
  "id": 1234567890,
  "name": "Test Game",
  "size": "1GB",
  "image": "https://example.com/image.jpg",
  "description": "Test game description",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "_github": {
    "committed": true,
    "commitUrl": "https://github.com/MGaweesh/bta3-al3ab-backend/commit/abc123"
  }
}
```

**Expected Response (Success, GitHub failed):**
```json
{
  "id": 1234567890,
  "name": "Test Game",
  "size": "1GB",
  "image": "https://example.com/image.jpg",
  "description": "Test game description",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "_github": {
    "committed": false,
    "message": "Saved locally; GitHub commit failed (see server logs)"
  }
}
```

**Verify in GitHub:**
- Go to: `https://github.com/MGaweesh/bta3-al3ab-backend/commits/main`
- Should see commit: "Update games.json from dashboard — add game: Test Game — ..."

### 5. Update a Game

**First, get a game ID from the list, then:**
```bash
curl -X PUT https://bta3-al3ab-backend.onrender.com/api/games/readyToPlay/1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Game",
    "size": "2GB"
  }'
```

**Expected Response:**
```json
{
  "id": 1234567890,
  "name": "Updated Test Game",
  "size": "2GB",
  "image": "https://example.com/image.jpg",
  "description": "Test game description",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:30:00.000Z",
  "_github": {
    "committed": true,
    "commitUrl": "https://github.com/MGaweesh/bta3-al3ab-backend/commit/xyz789"
  }
}
```

### 6. Delete a Game

```bash
curl -X DELETE https://bta3-al3ab-backend.onrender.com/api/games/readyToPlay/1234567890
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Game deleted successfully",
  "_github": {
    "committed": true,
    "commitUrl": "https://github.com/MGaweesh/bta3-al3ab-backend/commit/def456"
  }
}
```

### 7. Add a Movie

```bash
curl -X POST https://bta3-al3ab-backend.onrender.com/api/movies/movies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Movie",
    "year": 2024,
    "rating": 8.5,
    "description": "Test movie description"
  }'
```

**Expected Response:**
```json
{
  "id": 1234567891,
  "name": "Test Movie",
  "year": 2024,
  "rating": 8.5,
  "description": "Test movie description",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "_github": {
    "committed": true,
    "commitUrl": "https://github.com/MGaweesh/bta3-al3ab-backend/commit/ghi012"
  }
}
```

### 8. Update a Movie

```bash
curl -X PUT https://bta3-al3ab-backend.onrender.com/api/movies/movies/1234567891 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Movie",
    "rating": 9.0
  }'
```

### 9. Delete a Movie

```bash
curl -X DELETE https://bta3-al3ab-backend.onrender.com/api/movies/movies/1234567891
```

### 10. Data Status

```bash
curl https://bta3-al3ab-backend.onrender.com/api/data/status
```

**Expected Response:**
```json
{
  "status": "ok",
  "platform": "JSON files with GitHub sync",
  "files": {
    "games": {
      "exists": true,
      "readyToPlay": 5,
      "repack": 3,
      "online": 2
    },
    "movies": {
      "exists": true,
      "movies": 10,
      "tvShows": 5,
      "anime": 8
    }
  },
  "github": {
    "configured": true,
    "connected": true,
    "repo": {
      "name": "bta3-al3ab-backend",
      "full_name": "MGaweesh/bta3-al3ab-backend",
      "default_branch": "main",
      "url": "https://github.com/MGaweesh/bta3-al3ab-backend"
    },
    "error": null
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Test Scenarios

### Scenario 1: Normal Operation
1. Add game → Should commit to GitHub
2. Verify commit in GitHub
3. Update game → Should commit to GitHub
4. Delete game → Should commit to GitHub

### Scenario 2: GitHub Failure (Simulate)
1. Temporarily set wrong `GITHUB_TOKEN`
2. Add game → Should save locally, return success with warning
3. Check logs for: "GitHub commit failed — falling back to local"
4. Fix token → Next operation should commit successfully

### Scenario 3: Conflict Handling
1. Manually edit `data/games.json` in GitHub
2. Add game via API → Should retry and handle conflict
3. Check logs for: "Conflict detected, retrying..."

### Scenario 4: Concurrent Writes
1. Send multiple POST requests simultaneously
2. All should succeed (mutex prevents conflicts)
3. All commits should appear in GitHub

## Verification Checklist

- [ ] Health check returns `github.connection: "ok"`
- [ ] Test commit succeeds
- [ ] Add game commits to GitHub
- [ ] Update game commits to GitHub
- [ ] Delete game commits to GitHub
- [ ] Add movie commits to GitHub
- [ ] Update movie commits to GitHub
- [ ] Delete movie commits to GitHub
- [ ] GitHub commits have correct commit messages
- [ ] Local files are updated even if GitHub fails
- [ ] Error responses are user-friendly
- [ ] Logs don't contain `GITHUB_TOKEN`

## Expected Logs

### Successful Operation:
```
📝 [2024-01-01T12:00:00.000Z] Adding new game to category: readyToPlay
✅ Saved games.json locally
📊 Data summary: { readyToPlay: 6, repack: 3, online: 2 }
✅ Committed games.json to GitHub: https://github.com/.../commit/abc123
✅ [2024-01-01T12:00:00.000Z] Game saved: Test Game (ID: 1234567890)
✅ Committed to GitHub: https://github.com/.../commit/abc123
```

### GitHub Failure:
```
📝 [2024-01-01T12:00:00.000Z] Adding new game to category: readyToPlay
✅ Saved games.json locally
📊 Data summary: { readyToPlay: 6, repack: 3, online: 2 }
⚠️  GitHub commit failed: Bad credentials — falling back to local
✅ [2024-01-01T12:00:00.000Z] Game saved: Test Game (ID: 1234567890)
```

## Notes

- Replace `https://bta3-al3ab-backend.onrender.com` with your actual backend URL
- Replace game/movie IDs with actual IDs from your data
- All timestamps are in ISO format
- GitHub commit URLs are real and clickable

