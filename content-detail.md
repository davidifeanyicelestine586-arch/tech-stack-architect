# File: content-detail.md
# Generation Version: 2026.1.0

## 1. Domain Directory Mapping

| Domain ID | Display Title | Target Problem Space | Cross-Reference Blog Post |
| :--- | :--- | :--- | :--- |
| `web-saas` | Web Development & SaaS | MVP Creation, Performance, and Fintech Infrastructure | "How to Build a SaaS MVP Without a Developer in 2026" |
| `ai-automation` | AI Workflows & Automation | Protocol Integrity, Token Efficiencies, Interconnects | "What Is MCP? The Protocol That Makes AI Actually Act" |
| `mechatronics` | Hardware & Mechatronics | Embedded Microcontrollers, IoT Devices, and Robotics | "Building a Smart Obstacle-Avoiding Self-Balancing Robot" |

---

## 2. Component Dictionary & Rule Manifest

### DOMAIN: Web Development & SaaS (`web-saas`)

#### Item 1: Next.js Framework
*   **ID:** `nextjs`
*   **Category:** Frontend Architecture
*   **System Requirements:** `[ "nodejs", "vercel" ]`
*   **Validation Rules:** High performance, SEO-friendly framework tailored for dynamic web utilities.
*   **Architectural Warning:** "Avoid bundling heavy real-time tracking loops client-side; delegate to background server workers or edge locations."

#### Item 2: SQLite Database
*   **ID:** `sqlite`
*   **Category:** Database Configuration
*   **System Requirements:** `[ "local-filesystem" ]`
*   **Validation Rules:** Local file-based system. Excellent for lightweight, rapid MVP testing.
*   **Architectural Warning:** "Critical Scaling Bottleneck: Concurrent write locking will fail under heavy regional traffic. Swap to PostgreSQL if building Africa's next digital payment network."

#### Item 3: Flutter / Mobile Web
*   **ID:** `flutter-web`
*   **Category:** Frontend Interface
*   **System Requirements:** `[ "browser-runtime" ]`
*   **Validation Rules:** Multi-platform target optimized for zero-install mobile-first browser distribution.
*   **Architectural Warning:** "Heavy initial asset load size may experience latency on low-bandwidth mobile connections. Ensure script minification is active."

---

### DOMAIN: AI Workflows & Automation (`ai-automation`)

#### Item 4: Model Context Protocol (MCP) Server
*   **ID:** `mcp-server`
*   **Category:** Protocol Interface
*   **System Requirements:** `[ "llm-gateway", "secure-token-vault" ]`
*   **Validation Rules:** Establishes the hands that allow models to safely query host computers, databases, and external APIs.
*   **Architectural Warning:** "Security Risk: Granting unrestricted shell execution or write access to an unverified MCP server can compromise structural repository permissions."

#### Item 5: Pydroid3 Runtime Environment
*   **ID:** `pydroid3`
*   **Category:** Local Workspace Execution
*   **System Requirements:** `[ "android-os" ]`
*   **Validation Rules:** Sandboxed Python interpreter environment running directly on an Android device profile.
*   **Architectural Warning:** "Compute Constraints: Long-running processing loops will drain mobile batteries and risk being terminated by OS memory reclamation."

#### Item 6: Multiple AI Toolchains (The Stacker)
*   **ID:** `ai-stacker`
*   **Category:** Optimization Layout
*   **System Requirements:** `[ "api-orchestrator" ]`
*   **Validation Rules:** Chains multiple specialized prompt systems and models into single pipelines.
*   **Architectural Warning:** "Cognitive Offloading Risk: Layering 4+ disconnected AI writing and code subscriptions without a central orchestration tier breeds untraceable bugs and subscription sprawl."

---

### DOMAIN: Hardware & Mechatronics (`mechatronics`)

#### Item 7: Arduino Uno MCU
*   **ID:** `arduino-uno`
*   **Category:** Processor Platform
*   **System Requirements:** `[ "usb-serial-interface" ]`
*   **Pins Provided:** `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, "A0", "A1", "A2", "A3", "A4", "A5"]`
*   **Validation Rules:** 8-bit microcontroller board for direct hardware IO integration.
*   **Architectural Warning:** "Hard limit of 2KB SRAM. Avoid compiling large libraries or string buffers inside the core execution loop."

#### Item 8: L298N Dual H-Bridge Driver
*   **ID:** `l298n`
*   **Category:** Actuator Interface
*   **System Requirements:** `[ "external-power-supply" ]`
*   **Pins Demanded:** `[5, 6, 7, 8, 9, 11]` *(Default Multi-Motor Directional Configuration)*
*   **Validation Rules:** Dual H-Bridge module regulating DC motor signals.
*   **Architectural Warning:** "High voltage drop (~2V). Ensure your main battery provides enough head-room above your motors' rated operational threshold."

#### Item 9: HC-SR04 Ultrasonic Sensor
*   **ID:** `hc-sr04`
*   **Category:** Sensor Array
*   **System Requirements:** `[ "5v-power-bus" ]`
*   **Pins Demanded:** `[9, 10]` *(Default Trigger + Echo array configuration)*
*   **Validation Rules:** Ultrasonic transducer reporting distance metrics.
*   **Architectural Warning:** "PIN CONFLICT RISK: Pin 9 is heavily used by standard motor shield PWM drivers. Reassign Echo to Pin 3 if combining with motor driver components."

---

## 3. Structural Blueprint Matrices (Valid Combinations)

### Recipe 1: The Bootstrapped Payment Dashboard
*   **Required Components:** `[ "nextjs", "sqlite" ]`
*   **Target Output Code Framework:**
```bash
npx create-next-app@latest ediccrew-mvp --typescript --tailwind --app
npm install lucide-react better-sqlite3
```

### Recipe 2: The Mobile AI Developer Workspace
*   **Required Components:** `[ "pydroid3", "mcp-server" ]`
*   **Target Output Code Framework:**
```python
# Secure Local MCP Server Anchor Hook
import sys

def init_mcp_environment():
    print("Initializing Ediccrew MCP Gateway protocol on Android kernel...")
    # Check processing dependencies
```

### Recipe 3: Autonomous Obstacle Avoidance Array
*   **Required Components:** `[ "arduino-uno", "hc-sr04" ]`
*   **Target Output Code Framework:**
```cpp
// Pin Configuration Override Engine
const int trigPin = 3; // Shifted from default 9 to resolve conflict
const int echoPin = 4; // Shifted from default 10
void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}
```
