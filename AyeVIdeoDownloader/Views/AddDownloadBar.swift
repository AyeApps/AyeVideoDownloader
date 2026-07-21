import SwiftUI

struct AddDownloadBar: View {
    @ObservedObject var manager: DownloadManager
    @State private var urlText = ""
    @State private var format: DownloadFormat = .videoMP4

    var body: some View {
        VStack(spacing: 0) {
            // URL row
            HStack(spacing: 8) {
                TextField("Pega la URL de YouTube aquí", text: $urlText)
                    .textFieldStyle(.roundedBorder)

                Button {
                    manager.add(url: urlText, format: format)
                    urlText = ""
                } label: {
                    Label("Agregar", systemImage: "plus")
                }
                .disabled(urlText.trimmingCharacters(in: .whitespaces).isEmpty)
                .keyboardShortcut(.return, modifiers: [])
            }
            .padding(.horizontal)
            .padding(.top, 12)
            .padding(.bottom, 8)

            // Global settings row
            HStack(spacing: 16) {
                // Format
                Picker("Formato", selection: $format) {
                    ForEach(DownloadFormat.allCases) { f in
                        Text(f.rawValue).tag(f)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .frame(maxWidth: 240)

                if format == .videoMP4 {
                    Divider().frame(height: 18)

                    // Quality
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("Calidad:")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Picker("Calidad", selection: $manager.globalQuality) {
                            ForEach(VideoQuality.allCases) { q in
                                Text("\(q.rawValue) - \(q.description)").tag(q)
                            }
                        }
                        .pickerStyle(.menu)
                        .labelsHidden()
                        .frame(maxWidth: 160)
                    }

                    // Codec
                    HStack(spacing: 4) {
                        Image(systemName: "cpu")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("Codec:")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Picker("Codec", selection: $manager.globalCodec) {
                            ForEach(VideoCodec.allCases) { c in
                                Text("\(c.rawValue) - \(c.description)").tag(c)
                            }
                        }
                        .pickerStyle(.menu)
                        .labelsHidden()
                        .frame(maxWidth: 240)
                    }

                    // HDR
                    HStack(spacing: 4) {
                        Image(systemName: "sun.max")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("HDR:")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Picker("HDR", selection: $manager.globalHDR) {
                            ForEach(DynamicRangePreference.allCases) { h in
                                Text("\(h.rawValue) - \(h.description)").tag(h)
                            }
                        }
                        .pickerStyle(.menu)
                        .labelsHidden()
                        .frame(maxWidth: 160)
                    }
                }

                Spacer()

                // Cookies browser
                HStack(spacing: 4) {
                    Image(systemName: "lock.open")
                        .font(.caption)
                        .foregroundStyle(manager.cookieBrowser == .none ? AnyShapeStyle(.secondary) : AnyShapeStyle(Color.orange))
                    Text("Cookies:")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Picker("Cookies", selection: $manager.cookieBrowser) {
                        ForEach(CookieBrowser.allCases) { b in
                            Text(b.rawValue).tag(b)
                        }
                    }
                    .pickerStyle(.menu)
                    .labelsHidden()
                    .frame(maxWidth: 120)
                }

                Text("Configuración global")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal)
            .padding(.bottom, 10)
        }
        .background(.regularMaterial)
    }
}
