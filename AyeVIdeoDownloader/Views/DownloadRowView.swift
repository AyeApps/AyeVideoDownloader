import SwiftUI

struct DownloadRowView: View {
    @ObservedObject var item: DownloadItem
    let manager: DownloadManager

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Main row
            HStack(spacing: 10) {
                thumbnail
                statusIcon.frame(width: 18)

                VStack(alignment: .leading, spacing: 2) {
                    Text(item.title)
                        .lineLimit(1).truncationMode(.middle)
                        .font(.system(size: 13, weight: .medium))
                    Text(item.url)
                        .lineLimit(1).truncationMode(.middle)
                        .font(.caption).foregroundStyle(.secondary)
                }

                Spacer()

                HStack(spacing: 6) {
                    formatBadge
                    if case .waiting = item.status { customizeToggle }
                    actionButtons
                }
            }

            // Per-video settings (expandable, solo en waiting)
            if item.isCustomized, case .waiting = item.status {
                perVideoSettings
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            // Progress / error
            switch item.status {
            case .downloading:
                if item.progress > 0.0 {
                    ProgressView(value: item.progress).progressViewStyle(.linear)
                } else {
                    ProgressView().progressViewStyle(.linear)
                }
                if !item.progressText.isEmpty {
                    Text(item.progressText).font(.caption2).foregroundStyle(.secondary)
                }
            case .done:
                ProgressView(value: 1.0).progressViewStyle(.linear).tint(.green)
            case .failed(let msg):
                Text(msg).font(.caption2).foregroundStyle(.red)
            default:
                EmptyView()
            }
        }
        .padding(.vertical, 4)
        .animation(.easeInOut(duration: 0.2), value: item.isCustomized)
    }

    // MARK: - Customize toggle button

    private var customizeToggle: some View {
        Button {
            item.isCustomized.toggle()
            if !item.isCustomized {
                // Reset format detection when disabling
                item.formatsState = .idle
                item.selectedFormatID = nil
            }
        } label: {
            Label(item.isCustomized ? "Global" : "Personalizar",
                  systemImage: item.isCustomized ? "slider.horizontal.3" : "slider.horizontal.3")
                .font(.caption)
                .foregroundStyle(item.isCustomized ? .blue : .secondary)
        }
        .buttonStyle(.borderless)
    }

    // MARK: - Per-video settings panel

    @ViewBuilder
    private var perVideoSettings: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 8) {
                // Only show quality+codec if no specific format detected
                if case .loaded(let formats) = item.formatsState, !formats.isEmpty {
                    // Specific format picker
                    HStack(spacing: 8) {
                        Image(systemName: "film.stack").font(.caption).foregroundStyle(.secondary)
                        Text("Formato:").font(.caption).foregroundStyle(.secondary)
                        Picker("Formato específico", selection: $item.selectedFormatID) {
                            ForEach(formats) { fmt in
                                Text(fmt.displayLabel + fmt.sizeLabel).tag(Optional(fmt.id))
                            }
                        }
                        .labelsHidden().pickerStyle(.menu).frame(maxWidth: 450)

                        if let fid = item.selectedFormatID,
                           let sel = formats.first(where: { $0.id == fid }) {
                            codecBadge(sel.codecLabel)
                            if sel.isHDR {
                                Text("HDR")
                                    .font(.system(size: 9, weight: .bold))
                                    .padding(.horizontal, 4).padding(.vertical, 2)
                                    .background(Color.yellow.opacity(0.2))
                                    .foregroundStyle(Color.yellow)
                                    .clipShape(Capsule())
                            }
                        }

                        Spacer()

                        Button("Borrar detección") {
                            item.formatsState = .idle
                            item.selectedFormatID = nil
                        }
                        .font(.caption).buttonStyle(.borderless).foregroundStyle(.secondary)
                    }
                } else {
                    // Quality + Codec manual pickers
                    HStack(spacing: 16) {
                        HStack(spacing: 4) {
                            Image(systemName: "sparkles").font(.caption).foregroundStyle(.secondary)
                            Text("Calidad:").font(.caption).foregroundStyle(.secondary)
                            Picker("Calidad", selection: $item.customQuality) {
                                ForEach(VideoQuality.allCases) { q in Text("\(q.rawValue) - \(q.description)").tag(q) }
                            }
                            .labelsHidden().pickerStyle(.menu).frame(maxWidth: 160)
                        }

                        HStack(spacing: 4) {
                            Image(systemName: "cpu").font(.caption).foregroundStyle(.secondary)
                            Text("Codec:").font(.caption).foregroundStyle(.secondary)
                            Picker("Codec", selection: $item.customCodec) {
                                ForEach(VideoCodec.allCases) { c in Text("\(c.rawValue) - \(c.description)").tag(c) }
                            }
                            .labelsHidden().pickerStyle(.menu).frame(maxWidth: 240)
                        }

                        HStack(spacing: 4) {
                            Image(systemName: "sun.max").font(.caption).foregroundStyle(.secondary)
                            Text("HDR:").font(.caption).foregroundStyle(.secondary)
                            Picker("HDR", selection: $item.customHDR) {
                                ForEach(DynamicRangePreference.allCases) { h in Text("\(h.rawValue) - \(h.description)").tag(h) }
                            }
                            .labelsHidden().pickerStyle(.menu).frame(maxWidth: 160)
                        }

                        Spacer()

                        // Detect button
                        detectButton
                    }
                }
            }
            .padding(2)
        }
        .padding(.leading, 128) // align past thumbnail + icon
    }

    @ViewBuilder
    private var detectButton: some View {
        switch item.formatsState {
        case .idle:
            Button {
                manager.fetchFormats(for: item)
            } label: {
                Label("Detectar formatos", systemImage: "magnifyingglass")
            }
            .font(.caption).buttonStyle(.bordered)

        case .loading:
            HStack(spacing: 4) {
                ProgressView().scaleEffect(0.6).frame(width: 14, height: 14)
                Text("Detectando...").font(.caption).foregroundStyle(.secondary)
            }

        case .failed:
            Button {
                manager.fetchFormats(for: item)
            } label: {
                Label("Reintentar", systemImage: "arrow.clockwise")
            }
            .font(.caption).buttonStyle(.bordered).tint(.red)

        case .loaded:
            EmptyView()
        }
    }

    // MARK: - Subviews

    @ViewBuilder
    private var thumbnail: some View {
        if let url = item.thumbnailURL {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image): image.resizable().aspectRatio(contentMode: .fill)
                case .failure, .empty:    Color.secondary.opacity(0.15)
                @unknown default:         Color.secondary.opacity(0.15)
                }
            }
            .frame(width: 96, height: 54)
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
    }

    @ViewBuilder
    private var statusIcon: some View {
        switch item.status {
        case .waiting:    Image(systemName: "clock").foregroundStyle(.secondary)
        case .downloading:Image(systemName: "arrow.down.circle").foregroundStyle(.blue).symbolEffect(.pulse)
        case .done:       Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
        case .failed:     Image(systemName: "xmark.circle.fill").foregroundStyle(.red)
        case .cancelled:  Image(systemName: "slash.circle").foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private var formatBadge: some View {
        Text(item.format == .audioMP3 ? "MP3" : "MP4")
            .font(.caption2).fontWeight(.semibold)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(item.format == .audioMP3 ? Color.purple.opacity(0.15) : Color.blue.opacity(0.15))
            .foregroundStyle(item.format == .audioMP3 ? .purple : .blue)
            .clipShape(RoundedRectangle(cornerRadius: 4))
    }

    @ViewBuilder
    private var actionButtons: some View {
        switch item.status {
        case .waiting, .downloading:
            Button("Cancelar") { manager.cancel(item) }
                .buttonStyle(.borderless).foregroundStyle(.red)
        case .done:
            if let path = item.outputPath {
                Button("Abrir") { NSWorkspace.shared.open(path) }.buttonStyle(.borderless)
            } else {
                Button("Ver carpeta") { NSWorkspace.shared.open(manager.outputDirectory) }.buttonStyle(.borderless)
            }
            Button { manager.remove(item) } label: { Image(systemName: "trash") }
                .buttonStyle(.borderless).foregroundStyle(.secondary)
        case .failed, .cancelled:
            Button { manager.remove(item) } label: { Image(systemName: "trash") }
                .buttonStyle(.borderless).foregroundStyle(.secondary)
        }
    }

    private func codecBadge(_ label: String) -> some View {
        let color: Color = switch label {
        case "H.264": .blue
        case "H.265": .purple
        case "VP9":   .green
        case "AV1":   .orange
        default:      .secondary
        }
        return Text(label)
            .font(.caption2).fontWeight(.semibold)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}
