# Device Connection State Machine

| From | Allowed To |
| --- | --- |
| unknown | discovered, unavailable, failed, disposed |
| discovered | permission-required, connecting, unavailable, disposed |
| permission-required | connecting, unavailable, failed, disposed |
| connecting | connected, failed, disconnected, disposed |
| connected | ready, degraded, disconnected, disposed |
| ready | in-use, degraded, disconnected, disposed |
| in-use | ready, degraded, reconnecting, disconnected, disposed |
| degraded | ready, reconnecting, failed, disconnected, disposed |
| reconnecting | connected, ready, failed, disconnected, disposed |
| disconnected | reconnecting, connecting, unavailable, disposed |
| unavailable | discovered, disposed |
| failed | reconnecting, disconnected, disposed |
| disposed | none |

A device may be discovered without being connected, and connected without being routed to Program or Preview. Illegal transitions throw deterministic errors.
