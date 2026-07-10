# Output Registry

Each output registers `outputId`, `outputType`, `destination`, `encoder`, `transport`, `healthProvider`, `runtimeOwner`, `priority`, and `productionGraphSource`.

Duplicate `outputId` values are rejected. Duplicate destination/transport pairs are also rejected to prevent accidental duplicated distribution work.

Supported output metadata types are Program, Preview, Aux, Clean Feed, Multiview, Streaming, Recording, NDI, SRT, RTMP, RTSP, WebRTC, SDI, HDMI, Virtual Output, Monitoring, and Unknown.
