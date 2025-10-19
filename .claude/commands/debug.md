# Debug

You are tasked with helping debug issues during manual testing or implementation in the house-work-scheduler project. This command allows you to investigate problems by examining logs, database state, and git history without editing files. Think of this as a way to bootstrap a debugging session without using the primary window's context.

## Initial Response

When invoked WITH a plan/ticket file:

```
I'll help debug issues with [file name]. Let me understand the current state.

What specific problem are you encountering?
- What were you trying to test/implement?
- What went wrong?
- Any error messages?

I'll investigate the logs, database, and git state to help figure out what's happening.
```

When invoked WITHOUT parameters:

```
I'll help debug your current issue.

Please describe what's going wrong:
- What are you working on?
- What specific problem occurred?
- When did it last work?

I can investigate logs, database state, and recent changes to help identify the issue.
```

## Environment Information

You have access to these key locations and tools:

**Docker Logs** (when using docker-compose):

- Backend logs: `docker compose logs -f backend`
- Frontend logs: `docker compose logs -f frontend`
- MySQL logs: `docker compose logs -f mysql`
- All services: `docker compose logs -f`

**Development Server Logs** (when running locally):

- Backend logs: `npm run dev:backend` (NestJS with --watch)
- Frontend logs: `npm run dev:frontend` (Next.js dev server)
- Combined logs: `npm run dev` (concurrently)

**Database**:

- MySQL container: `docker exec -it house-work-mysql mysql -u housework -p house_work_scheduler`
- Connection details: localhost:3306, user: housework, database: house_work_scheduler
- Can query directly with MySQL client or TypeORM

**Git State**:

- Check current branch, recent commits, uncommitted changes
- Similar to how `commit` and `describe_pr` commands work

**Service Status**:

- Check if Docker containers are running: `docker compose ps`
- Check if Node.js processes are running: `ps aux | grep -E "(node|npm|nest|next)"`
- Check if ports are in use: `lsof -i :3001` (backend), `lsof -i :3002` (frontend), `lsof -i :3306` (MySQL)

## Process Steps

### Step 1: Understand the Problem

After the user describes the issue:

1. **Read any provided context** (plan or ticket file):
   - Understand what they're implementing/testing
   - Note which phase or step they're on
   - Identify expected vs actual behavior

2. **Quick state check**:
   - Current git branch and recent commits
   - Any uncommitted changes
   - When the issue started occurring

### Step 2: Investigate the Issue

Spawn parallel Task agents for efficient investigation:

```
Task 1 - Check Service Logs:
Find and analyze the most recent logs for errors:
1. Check Docker container status: docker compose ps
2. Check Docker logs: docker compose logs --tail=50 backend/frontend/mysql
3. If running locally, check Node.js process logs
4. Search for errors, warnings, or issues around the problem timeframe
5. Look for stack traces, database connection errors, or API errors
6. Check for port conflicts or service startup issues
Return: Key errors/warnings with timestamps and service context
```

```
Task 2 - Database State:
Check the current database state:
1. Connect to MySQL: docker exec -it house-work-mysql mysql -u housework -p house_work_scheduler
2. Check database schema: SHOW TABLES; and DESCRIBE [table_name];
3. Query recent data based on the issue:
   - SELECT * FROM housework_history ORDER BY created_at DESC LIMIT 10;
   - Check for any data inconsistencies or missing records
   - Verify foreign key relationships
4. Look for connection issues or query errors
Return: Relevant database findings and connection status
```

```
Task 3 - Git and File State:
Understand what changed recently:
1. Check git status and current branch
2. Look at recent commits: git log --oneline -10
3. Check uncommitted changes: git diff
4. Verify expected files exist (package.json, docker-compose.yml, etc.)
5. Check for any file permission issues
6. Verify environment variables and configuration files
Return: Git state and any file issues
```

```
Task 4 - Service Dependencies:
Check service health and dependencies:
1. Verify Docker containers are running: docker compose ps
2. Check port availability: lsof -i :3001 :3002 :3306
3. Test API endpoints: curl http://localhost:3001/health
4. Check frontend accessibility: curl http://localhost:3002
5. Verify database connectivity from backend
6. Check for environment variable issues
Return: Service health status and dependency issues
```

### Step 3: Present Findings

Based on the investigation, present a focused debug report:

````markdown
## Debug Report

### What's Wrong

[Clear statement of the issue based on evidence]

### Evidence Found

**From Service Logs**:

- [Docker container errors with timestamp]
- [Backend/Frontend/MySQL log issues]
- [API endpoint errors or database connection issues]

**From Database**:

```sql
-- Relevant query and result
[Finding from MySQL database]
```
````

**From Git/Files**:

- [Recent changes that might be related]
- [File state issues or missing configuration]

**From Service Dependencies**:

- [Container status issues]
- [Port conflicts or connectivity problems]
- [Environment variable or configuration issues]

### Root Cause

[Most likely explanation based on evidence]

### Next Steps

1. **Try This First**:

   ```bash
   [Specific command or action]
   ```

2. **If That Doesn't Work**:
   - Restart Docker services: `docker compose down && docker compose up -d`
   - Restart development servers: `npm run dev`
   - Check browser console for frontend errors (F12)
   - Run with debug mode: `npm run start:debug --workspace=backend`

3. **Common Solutions**:
   - Clear Docker volumes: `docker compose down -v && docker compose up -d`
   - Rebuild containers: `docker compose build --no-cache`
   - Check environment variables in `.env` file
   - Verify database connection settings

### Can't Access?

Some issues might be outside my reach:

- Browser console errors (F12 in browser)
- External API issues (Notion, Telegram)
- System-level Docker issues
- Network connectivity problems

Would you like me to investigate something specific further?

````

## Important Notes

- **Focus on manual testing scenarios** - This is for debugging during implementation
- **Always require problem description** - Can't debug without knowing what's wrong
- **Read files completely** - No limit/offset when reading context
- **Think like `commit` or `describe_pr`** - Understand git state and changes
- **Guide back to user** - Some issues (browser console, external APIs) are outside reach
- **No file editing** - Pure investigation only
- **Support both Docker and local development** - Check which mode is being used

## Quick Reference

**Check Service Status**:
```bash
docker compose ps                    # Docker container status
ps aux | grep -E "(node|npm|nest|next)"  # Local Node.js processes
lsof -i :3001 :3002 :3306           # Port usage check
````

**View Logs**:

```bash
docker compose logs -f backend       # Backend logs
docker compose logs -f frontend      # Frontend logs
docker compose logs -f mysql         # MySQL logs
docker compose logs --tail=50        # Last 50 lines from all services
```

**Database Access**:

```bash
docker exec -it house-work-mysql mysql -u housework -p house_work_scheduler
# Then in MySQL:
SHOW TABLES;
DESCRIBE housework_history;
SELECT * FROM housework_history ORDER BY created_at DESC LIMIT 10;
```

**Service Management**:

```bash
docker compose up -d                 # Start all services
docker compose down                  # Stop all services
docker compose restart backend       # Restart specific service
npm run dev                          # Start local development
```

**Git State**:

```bash
git status
git log --oneline -10
git diff
```

**Health Checks**:

```bash
curl http://localhost:3001/health    # Backend health check
curl http://localhost:3002           # Frontend accessibility
```

Remember: This command helps you investigate without burning the primary window's context. Perfect for when you hit an issue during manual testing and need to dig into logs, database, or git state in the house-work-scheduler project.
