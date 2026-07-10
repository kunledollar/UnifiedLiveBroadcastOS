# Device Capability Negotiation

Capability resolution is metadata-only and never changes existing capture implementation. Selection rules:

1. Prefer explicit operator configuration.
2. Otherwise use compatible production defaults.
3. Otherwise use the first declared supported format.
4. Validate all selections against declared capabilities.
5. Return clear fallback reasons; never silently select unsupported formats.

Video metadata covers resolution, frame rate, aspect ratio, pixel format, color space, HDR, interlaced/progressive scan, and latency class. Audio metadata covers sample rate, bit depth, channels, layout, and latency class.
