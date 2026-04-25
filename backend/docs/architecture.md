%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#E1F5FE', 'edgeLabelBackground':'#ffffff', 'tertiaryColor': '#fff'}}}%%
graph TD
%% Define Nodes
SupplierApp[("Supplier Web Client<br>(Bidding Interface)")];
API[("Node.js API Server<br>(Prisma Client)")]
DB[(("PostgreSQL Database<br>(Prisma Schema Source)"));]
TaskQueue[("Task Queue<br>(e.g., BullMQ for Extensions)")]
WebSocket[("WebSocket Server<br>(Real-time Alerts)")]
BuyerApp[("Buyer Web Client<br>(RFQ Dashboard)")]

    %% Define Flows (Bidding Flow)
    SupplierApp -->|Places Bid| API
    API -->|1. Validates & Writes| DB
    API -->|2. Check Extension/AutoBid| TaskQueue
    API -->|3. Trigger Socket Alert| WebSocket
    WebSocket -->|4. Push 'Outbid' Status| SupplierApp
    WebSocket -->|'L1 Change'| BuyerApp

    %% (Extension Flow)
    TaskQueue -->|Processed Worker Task| API
    API -->|Updates RFQ.currentEndTime| DB
    API -->|'Extended' Event| WebSocket
