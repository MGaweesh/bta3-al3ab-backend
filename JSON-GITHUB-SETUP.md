# 📁 JSON Files with GitHub Auto-Commit Setup

## Overview

The backend now uses **JSON files** for data storage with **automatic GitHub commits** on every write operation.

## Environment Variables (Render)

Set these in Render Dashboard → Environment:

GITHUB_TOKEN=your_token_here
GITHUB_OWNER=MGaweesh
GITHUB_REPO=bta3-al3ab-backend
GITHUB_BRANCH=main
```

**⚠️ Security:** Never log or expose `GITHUB_TOKEN` in code or logs.

## File Structure

### Local Paths (on Render server):
- `/mnt/data/games.json` (or `backend/data/games.json` in development)
- `/mnt/data/movies.json` (or `backend/data/movies.json` in development)

### Repository Paths (in GitHub):
- `data/games.json`
- `data/movies.json`

## How It Works

1. **Read Operations**: Read directly from local JSON files
2. **Write Operations**:
   - Write to local JSON file (atomic: temp file → rename)
   - Automatically commit to GitHub
   - If GitHub commit fails, local changes are kept and operation returns success with a warning

## API Endpoints

### Games

- `GET /api/games` - Get all games
- `GET /api/games/:category` - Get games by category (readyToPlay, repack, online)
- `POST /api/games/:category` - Add new game
- `PUT /api/games/:category/:id` - Update game
- `DELETE /api/games/:category/:id` - Delete game

### Movies

- `GET /api/movies` - Get all movies/TV shows/anime
- `GET /api/movies/:type` - Get by type (movies, tvShows, anime)
- `POST /api/movies/:type` - Add new item
- `PUT /api/movies/:type/:id` - Update item
- `DELETE /api/movies/:type/:id` - Delete item

### Debug

- `GET /api/health` - Health check with GitHub status
- `GET /api/data/status` - Data and GitHub status
- `POST /api/debug/commit-test` - Test GitHub commit

## Response Format

### Success (with GitHub commit):
```json
{
  "id": 1234567890,
  "name": "Game Name",
  "_github": {
    "committed": true,
    "commitUrl": "https://github.com/owner/repo/commit/abc123"
  }
}
```

### Success (local only, GitHub failed):
```json
{
  "id": 1234567890,
  "name": "Game Name",
  "_github": {
    "committed": false,
    "message": "Saved locally; GitHub commit failed (see server logs)"
  }
}
```

### Error:
```json
{
  "status": "error",
  "error": "Failed to save game",
  "details": "Error message"
}
```

## Testing with cURL

### 1. Test Health Check
```bash
curl https://bta3-al3ab-backend.onrender.com/api/health
```

### 2. Test GitHub Commit
```bash
curl -X POST https://bta3-al3ab-backend.onrender.com/api/debug/commit-test
```

### 3. Add a Game
```bash
curl -X POST https://bta3-al3ab-backend.onrender.com/api/games/readyToPlay \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Game",
    "size": "1GB",
    "image": "https://example.com/image.jpg"
  }'
```

### 4. Update a Game
```bash
curl -X PUT https://bta3-al3ab-backend.onrender.com/api/games/readyToPlay/1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Game Name",
    "size": "2GB"
  }'
```

### 5. Delete a Game
```bash
curl -X DELETE https://bta3-al3ab-backend.onrender.com/api/games/readyToPlay/1234567890
```

### 6. Add a Movie
```bash
curl -X POST https://bta3-al3ab-backend.onrender.com/api/movies/movies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Movie",
    "year": 2024,
    "rating": 8.5
  }'
```

## Features

### ✅ Atomic Writes
- Writes to temp file first, then renames (atomic operation)
- Prevents corruption if process crashes during write

### ✅ Race Condition Protection
- Mutex queue per file type
- Prevents concurrent writes from conflicting

### ✅ GitHub Conflict Handling
- Automatically retries on 409 conflicts
- Re-fetches file SHA and retries up to 3 times
- Exponential backoff between retries

### ✅ Graceful Degradation
- If GitHub commit fails, local changes are kept
- Frontend receives success response with warning
- System continues to work with local files

### ✅ Security
- Never logs `GITHUB_TOKEN`
- Sanitizes error messages
- Uses environment variables for secrets

## Logging

### Successful Operations:
```
✅ Saved games.json locally
✅ Committed games.json to GitHub: https://github.com/...
```

### Failed GitHub Commits:
```
⚠️  GitHub commit failed: <error> — falling back to local
```

### Errors:
```
❌ Error writing games.json: <error message>
```

## Troubleshooting

### GitHub Commit Fails

1. **Check Environment Variables:**
   ```bash
   # In Render logs, you should see:
   🔗 GitHub: MGaweesh/bta3-al3ab-backend
   ```

2. **Test Connection:**
   ```bash
   curl https://bta3-al3ab-backend.onrender.com/api/health
   # Check github.connection field
   ```

3. **Test Commit:**
   ```bash
   curl -X POST https://bta3-al3ab-backend.onrender.com/api/debug/commit-test
   ```

4. **Common Issues:**
   - Invalid `GITHUB_TOKEN` → Check token permissions
   - Wrong `GITHUB_OWNER` or `GITHUB_REPO` → Verify repository name
   - Branch doesn't exist → Check `GITHUB_BRANCH` value
   - No write permissions → Token needs `repo` scope

### File Not Found

- Check that `backend/data/` directory exists
- On Render, files are in `/mnt/data/` (set `DATA_DIR` env var if different)

## Manual Deploy on Render

1. Push code to GitHub
2. Render will auto-deploy
3. Or manually: Render Dashboard → Manual Deploy → Deploy latest commit

## Notes

- **Data Persistence**: Local JSON files persist on Render's `/mnt/data/` (persistent disk)
- **GitHub Sync**: Every write operation commits to GitHub automatically
- **Fallback**: If GitHub is unavailable, system continues with local files
- **Performance**: Reads are fast (direct file read), writes include GitHub API call (~1-2 seconds)

