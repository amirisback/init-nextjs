---
name: jira-integration
description: "Connect and interact with Qomunal Jira project (QT board). Use this skill whenever the user asks about Jira tickets, board status, sprint info, or wants to create/update/comment on Jira issues. Always read jira_config.json for credentials."
---

# Jira Integration Skill

## Overview
This skill enables interaction with the Qomunal-TokoWibu Jira project via REST API.

## Configuration
Credentials are stored in `.agents/jira_config.json` in the workspace root:
- `baseUrl`: Jira instance URL
- `email`: Atlassian account email
- `apiToken`: Atlassian API token
- `projectKey`: QT
- `boardId`: 6

## How to Use

### Step 1: Read Credentials
Always read the config file first:
```
view_file: d:\Project\tokowibu-web\.agents\jira_config.json
```

### Step 2: Build Auth Header
Use Basic Auth with email:apiToken (base64 encoded):
```powershell
$config = Get-Content "d:\Project\tokowibu-web\.agents\jira_config.json" | ConvertFrom-Json
$pair = "$($config.email):$($config.apiToken)"
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $base64"; "Content-Type" = "application/json"; Accept = "application/json" }
```

### Step 3: Common API Endpoints

#### Get Board Info
```
GET /rest/agile/1.0/board/6
```

#### Get Active Sprint
```
GET /rest/agile/1.0/board/6/sprint?state=active
```

#### Get Sprint Issues
```
GET /rest/agile/1.0/sprint/{sprintId}/issue
```

#### Search Issues (JQL)
```
GET /rest/api/3/search?jql=project=QT+AND+status="To Do"
```

#### Get Single Issue
```
GET /rest/api/3/issue/QT-{number}
```

#### Transition Issue (Change Status)
```
POST /rest/api/3/issue/QT-{number}/transitions
Body: { "transition": { "id": "{transitionId}" } }
```

#### Add Comment
```
POST /rest/api/3/issue/QT-{number}/comment
Body: { "body": { "type": "doc", "version": 1, "content": [...] } }
```

#### Get Available Transitions
```
GET /rest/api/3/issue/QT-{number}/transitions
```

## Project Details
- **Project**: Qomunal-TokoWibu (QT)
- **Board**: QT board (ID: 6, type: simple)
- **Board URL**: https://qomunal.atlassian.net/jira/software/projects/QT/boards/6
