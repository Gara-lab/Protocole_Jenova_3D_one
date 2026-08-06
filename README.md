# Protocole_Jenova_3D_one
First test of creating a 3D viewpoint of the neural network


# AI Customer Service API Workflow Architecture

## 1. Project Objective

Create a scalable AI customer service system where the AI handles client conversations while external API layers handle data retrieval.

The objective is to:

* Reduce AI memory and GPU usage.
* Avoid unnecessary live database requests.
* Reduce hallucination risks.
* Separate decision-making from execution.
* Scale to large numbers of clients through distributed API infrastructure.

---

# 2. Core Architecture

## Client Call Flow

1. A client calls.
2. The AI manages the conversation.
3. The phone number is sent to the master database.
4. The master database acts as a pointer:

   * Finds the Client ID.
   * Finds the API Clone ID responsible for that client.
5. The API Clone receives precise commands from the AI.
6. The API Clone retrieves the required information.
7. The result is returned as structured JSON.
8. The AI uses the result to answer the client.

---

# 3. Master Database

## Role

The master database is only a routing system.

It stores:

* Phone number.
* Client ID.
* API Clone ID.
* Other possible identifiers.

It does not store full client information.

The Client ID is permanent and does not change.

Possible fallback identifiers:

* Email address.
* Client ID.

---

# 4. API Clone System

## Role

API Clones are execution layers.

They:

* Receive fixed commands.
* Access client logical databases.
* Return standardized JSON.
* Forward requests when another system is required.

They do not:

* Interpret AI requests.
* Make decisions.
* Store permanent information.

---

## Scaling

API Clones are distributed using API IDs.

Each API Clone handles a controlled number of clients based on tested capacity.

The goal is preventing saturation rather than recovering from saturation.

Adding new API Clones is a planned expansion process.

---

## Redundancy

Each API Clone has a backup clone.

If the main API Clone becomes unavailable, the backup takes over.

The backup does not need its own client databases because API Clones are not data owners.

---

# 5. Client Logical Databases

## Role

Client logical databases store frequently required information to avoid unnecessary live requests.

They replace the current single large client database model.

They are not designed to contain all possible client information.

They contain information selected according to usage frequency.

---

## Current Database Situation

Current system:

* One database containing all clients.
* Updated every 5 hours.
* Contains incomplete historical information.
* Mainly stores latest purchase information.

Future system:

* Multiple logical client databases.
* Organized through database clusters.
* Routed through the master database.

---

## Database Organization

Selected architecture:

Hybrid logical separation.

Structure:

* Database clusters.
* Each cluster contains many client logical databases.
* Master database points toward the correct location.

This avoids:

* One enormous database.
* Millions of independent databases.

---

# 6. API Searchers

## Role

API Searchers retrieve live information from external systems.

Examples:

* Odoo.
* Salesforce.
* CRM systems.

They are used only when required.

They:

* Receive requests from API Clones.
* Extract live information.
* Convert results into JSON.
* Return the data.

They do not make decisions.

---

# 7. AI Role

The AI acts as the workflow manager.

It:

* Understands the client request.
* Retrieves necessary instructions dynamically.
* Selects fixed commands.
* Requests information.
* Generates the final answer.

The AI does not:

* Directly access databases.
* Create arbitrary API requests.
* Store permanent conversation memory.

---

# 8. Command System

Commands are fixed.

The AI does not generate custom requests.

Commands are retrieved dynamically with their specifications to reduce:

* Hallucinations.
* Invalid requests.
* Excessive AI context usage.

API Clones execute commands without interpretation.

---

# 9. Data Retrieval Logic

The system separates:

## Default information

Stored in client logical databases.

Examples:

* Phone number.
* Name.
* Surname.
* Email.
* Postal code.
* Age.

Used for frequent requests.

---

## Live information

Retrieved through API Searchers.

Used for:

* Specific information.
* Data requiring current values.
* Information not stored locally.

---

# 10. Logging System

After every call:

Information is stored in a log database.

Purpose:

* Analyze request frequency.
* Improve AI training.
* Identify API improvements.
* Decide which information should enter client logical databases.

---

# 11. Security Model

Current approach:

Authentication is based on:

* Phone number.
* Client-provided identifying information.

The AI cannot guarantee human identity.

Higher security methods are a business decision.

---

# 12. Error Handling

API layers handle:

* Retries.
* Timeouts.
* Fallback mechanisms.

The AI handles:

* Client communication.
* Explaining delays.
* Explaining unavailable information.

---

# 13. Confirmed Architectural Advantages

* AI workload is reduced.
* Databases are not overloaded with repetitive requests.
* Live systems are only contacted when necessary.
* API failures are isolated.
* The system can scale horizontally.
* Data retrieval is separated from conversation logic.
* Structured JSON reduces AI errors.
* Fixed commands reduce hallucination risks.

---

# 14. Open Questions / Decisions To Be Made

## Client Database Updates

How changes from systems like Odoo or Salesforce propagate into client logical databases.

Possible approaches:

* Real-time synchronization.
* Scheduled updates.
* External update system.

---

## Client Database Content Rules

Define criteria for adding information.

Current proposed criterion:

* Request frequency.

Possible additional criteria:

* Data importance.
* Retrieval cost.
* Data volatility.

---

## Temporary AI Memory

Possible addition:

During one call, temporarily store retrieved JSON responses to avoid duplicate requests.

Memory would be deleted after the call.

---

## Request Processing

Decision needed:

When multiple requests exist during one conversation:

* Execute sequentially.
* Execute in parallel.

---

## Unknown Caller Handling

Decision needed:

Process when the caller does not match a known phone number.

Possible identifiers:

* Email.
* Client ID.
* Other verification methods.

---

## API Capacity Expansion

Decision needed:

When adding new API Clones:

* Manual deployment.
* Automated deployment.

---

## Response Delay Threshold

Decision needed:

Define when the AI informs the client that a request is taking too long.

---

# 15. General Improvements Identified

## Configuration-Based Commands

Store API Clone command definitions as configuration instead of hardcoded logic.

This simplifies future updates.

---

## Separation of Responsibilities

Maintain strict separation:

AI:

* Understands requests.
* Manages workflow.

API Clone:

* Executes commands.

API Searcher:

* Extracts external information.

Database:

* Stores and provides information.

---

# Current Project State

The architecture is based on a distributed AI orchestration system where the AI manages conversations while specialized API layers handle data retrieval.

The current design focuses on:

* scalability,
* reduced resource consumption,
* controlled data access,
* predictable behavior,
* and minimizing unnecessary live system requests.

## 16. Data Conflict Management

### Decision

The system will not automatically decide which information is correct when conflicting data is detected.

Example situations:

* A client changes their phone number.
* A live system contains different information than the client logical database.

The possible approach is:

* Keep the existing information.
* Store the new information separately.
* Send the case for human review when necessary.

### Open Question

Define the process used to validate, merge, or replace conflicting information.

---

# 17. Information Update Validation

### Decision

Information updates should not automatically overwrite existing data without validation.

Changes can be recorded first and evaluated later.

### Open Question

Define who decides:

* whether information is permanent,
* whether it replaces previous data,
* whether both old and new values should be kept.

---

# 18. Client Logical Database Evolution

### Decision

Client logical databases should grow according to actual request frequency.

Information is added when repeated requests justify avoiding live system calls.

The database is not intended to contain all possible client information.

### Open Question

Define additional criteria besides request frequency:

* importance of the information,
* retrieval cost,
* update frequency.

---

# 19. Client Data Access Permissions

### Decision

Permission management is outside the current workflow scope.

The AI and API layers should not invent or determine permissions.

### Open Question

Define where authorization rules are enforced.

---

# 20. Client Structure Differences

### Decision

The current assumption is that clients have similar information requirements.

### Open Question

Determine whether some clients require:

* additional data fields,
* restricted information,
* different API Searchers.

---

# 21. API Searcher Creation

### Decision

A new API Searcher is created when a new information source or retrieval requirement appears.

API Searchers remain specialized extraction components.

---

# 22. Universal JSON Formatting

### Decision

All API Searchers should use a universal formatting layer.

Purpose:

* guarantee identical JSON structures,
* simplify AI interpretation,
* prevent different APIs from returning incompatible formats.

---

# 23. Call Interruption Handling

### Decision

If the client disconnects during a request:

* Active requests should stop.
* Existing logs may still be stored if available.

---

# 24. AI Training Process

### Decision

The AI training process is outside the current workflow scope.

The log database provides information that can later support improvement.

### Open Question

Define whether training is:

* automatic,
* human-reviewed,
* or manually controlled.

---

# 25. API Clone Version Updates

### Decision

API Clone updates should avoid disrupting active conversations.

Possible approach:

* Deploy new API Clone versions.
* Redirect new requests.
* Remove old versions after migration.

### Open Question

Define the exact deployment and migration process.

---

# 26. Client Database Distribution

### Open Question

Define how client logical databases are assigned between database clusters.

Possible factors:

* storage size,
* request frequency,
* API Clone distribution,
* load balancing.

---

# 27. Data Synchronization

### Open Question

Define how information from live systems enters client logical databases.

Possible approaches:

* scheduled synchronization,
* event-based updates,
* external synchronization services.

---

# 28. Missing API Searcher Handling

### Open Question

Define what happens when the AI requests information for which no API Searcher currently exists.

Possible actions:

* inform the client,
* create a new Searcher,
* use human support.

---

# 29. Removed or Reduced Scope Questions

The following subjects are acknowledged but are outside the AI+API+DB workflow design scope:

* Infrastructure monitoring.
* Disaster recovery strategy.
* Abuse prevention.
* Full authentication/security policies.
* AI retraining architecture.

These require decisions from specialized teams.
