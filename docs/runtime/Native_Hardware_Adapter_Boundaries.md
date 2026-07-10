# Native Hardware Adapter Boundaries

Placeholder adapter contracts exist for DeckLink, NDI, SDI capture, HDMI capture, VISCA, ONVIF, ASIO, CoreAudio, WASAPI, virtual camera, and virtual microphone.

Placeholders report `metadata-only`, `provider-unavailable`, `not-installed`, or `unsupported-platform` and `supportsRuntimeTransport: false`. UBOS v4.3 does not claim native hardware transport support unless a real future adapter implements it.

Browser APIs expose limited labels and identifiers until permissions are granted; native integrations may expose richer manufacturer, serial, firmware, and signal metadata only when permitted by OS policy.
