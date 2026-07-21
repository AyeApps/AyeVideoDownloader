import Foundation
import Combine
import AppKit

class DownloadManager: ObservableObject {

    // Global settings
    @Published var globalQuality: VideoQuality = .best
    @Published var globalCodec: VideoCodec = .any
    @Published var globalHDR: DynamicRangePreference = .any
    @Published var cookieBrowser: CookieBrowser = .none

    @Published var items: [DownloadItem] = []
    @Published var outputDirectory: URL = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first!
    @Published var ytdlpMissing = false // Kept for compatibility with ContentView
    @Published var ffmpegMissing = false // Kept for compatibility with ContentView
    
    private let network = NetworkService.shared

    // MARK: - Public API

    func add(url: String, format: DownloadFormat) {
        guard !url.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let item = DownloadItem(url: url.trimmingCharacters(in: .whitespaces), format: format)
        DispatchQueue.main.async { self.items.append(item) }
    }

    func startAll() {
        let waitingItems = items.filter { if case .waiting = $0.status { return true }; return false }
        for item in waitingItems {
            Task {
                await start(item: item)
            }
        }
    }

    func cancel(_ item: DownloadItem) {
        item.sseClient?.disconnect()
        
        Task {
            if let jobId = item.jobId {
                _ = try? await network.rawRequest("/downloads/\(jobId)", method: "DELETE")
            }
        }
        
        DispatchQueue.main.async {
            self.objectWillChange.send()
            item.status = .cancelled
            item.progressText = ""
        }
    }

    func remove(_ item: DownloadItem) {
        cancel(item)
        DispatchQueue.main.async { self.items.removeAll { $0.id == item.id } }
    }

    func chooseOutputDirectory() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.prompt = "Seleccionar"
        if panel.runModal() == .OK, let url = panel.url {
            DispatchQueue.main.async { self.outputDirectory = url }
        }
    }

    // MARK: - Per-video Format Detection

    func fetchAllFormats() {
        for item in items {
            if case .waiting = item.status, item.format == .videoMP4 {
                if case .idle = item.formatsState {
                    DispatchQueue.main.async { item.isCustomized = true }
                    fetchFormats(for: item)
                }
            }
        }
    }

    struct FetchFormatsRequest: Encodable {
        let url: String
    }

    struct FetchFormatsResponse: Decodable {
        let url: String
        let title: String?
        let duration: Int?
        let thumbnail: String?
        let formats: [AvailableFormatResponse]
    }

    struct AvailableFormatResponse: Decodable {
        let id: String
        let height: Int
        let fps: Double
        let vcodec: String
        let filesize: Int64?
        let dynamic_range: String?
    }

    func fetchFormats(for item: DownloadItem) {
        DispatchQueue.main.async {
            self.objectWillChange.send()
            item.formatsState = .loading
        }

        Task {
            do {
                let request = FetchFormatsRequest(url: item.url)
                let response: FetchFormatsResponse = try await network.request("/formats/fetch", method: "POST", body: request)
                
                let videoFormats: [AvailableFormat] = response.formats.map { f in
                    AvailableFormat(
                        id: f.id,
                        height: f.height,
                        fps: f.fps,
                        vcodec: f.vcodec,
                        filesize: f.filesize,
                        dynamicRange: f.dynamic_range
                    )
                }
                
                await MainActor.run {
                    self.objectWillChange.send()
                    if let t = response.title, !t.isEmpty { item.title = t }
                    item.formatsState = .loaded(videoFormats)
                    
                    let preferred = videoFormats.first {
                        item.customCodec.matches(vcodec: $0.vcodec) &&
                        (item.customHDR == .any || (item.customHDR == .hdr && $0.isHDR) || (item.customHDR == .sdr && !$0.isHDR))
                    }
                    item.selectedFormatID = (preferred ?? videoFormats.first)?.id
                }
            } catch {
                await MainActor.run {
                    self.objectWillChange.send()
                    item.formatsState = .failed
                }
            }
        }
    }

    // MARK: - Queue & Download

    private func start(item: DownloadItem) async {
        await MainActor.run {
            self.objectWillChange.send()
            item.status = .downloading
            item.progress = 0.0
            item.progressText = "Preparando descarga en la nube..."
        }
        
        do {
            let quality = item.isCustomized ? item.customQuality.rawValue : self.globalQuality.rawValue
            let codec = item.isCustomized ? item.customCodec.rawValue : self.globalCodec.rawValue
            let hdr = item.isCustomized ? item.customHDR.rawValue : self.globalHDR.rawValue
            
            let request = CreateDownloadRequest(
                url: item.url,
                format: item.format == .videoMP4 ? "videoMP4" : "audioMP3",
                quality: quality,
                codec: codec,
                hdr: hdr,
                selected_format_id: item.isCustomized ? item.selectedFormatID : nil
            )
            
            let job: DownloadJobResponse = try await network.request(
                "/downloads/", method: "POST", body: request
            )
            
            await MainActor.run { item.jobId = job.job_id }
            
            await listenProgress(for: item)
        } catch {
            await MainActor.run {
                item.status = .failed(error.localizedDescription)
            }
        }
    }

    private func listenProgress(for item: DownloadItem) async {
        guard let jobId = item.jobId else { return }
        
        let token = await KeychainService.shared.getToken(.accessToken) ?? ""
        
        await MainActor.run {
            let client = SSEClient()
            item.sseClient = client
            
            client.connect(jobId: jobId, token: token) { [weak self] progress, event in
                guard let self = self else { return }
                
                Task { @MainActor in
                    if event == "done" {
                        item.progressText = "Descargando archivo final..."
                        Task { await self.downloadFile(for: item) }
                        client.disconnect()
                    } else if event == "error" {
                        item.status = .failed("Error en SSE")
                        client.disconnect()
                    } else if let p = progress {
                        item.progress = p.progress
                        item.progressText = p.progress_text
                        if let title = p.title, !title.isEmpty {
                            item.title = title
                        }
                        if p.status == "failed" {
                            item.status = .failed("Fallo en la nube")
                            client.disconnect()
                        } else if p.status == "cancelled" {
                            item.status = .cancelled
                            client.disconnect()
                        }
                    }
                }
            }
        }
    }

    func downloadFile(for item: DownloadItem) async {
        guard let jobId = item.jobId else { return }
        
        do {
            let data = try await network.downloadData("/downloads/\(jobId)/file")
            
            // Unique file name logic can be added, for now write directly to output
            let baseName = item.title.isEmpty ? "video" : item.title
            let ext = item.format == .audioMP3 ? "mp3" : "mp4"
            let safeName = baseName.replacingOccurrences(of: "/", with: "-")
            
            var destURL = outputDirectory.appendingPathComponent("\(safeName).\(ext)")
            
            // Ensure unique filename
            var counter = 1
            while FileManager.default.fileExists(atPath: destURL.path) {
                destURL = outputDirectory.appendingPathComponent("\(safeName) (\(counter)).\(ext)")
                counter += 1
            }
            
            try data.write(to: destURL)
            
            await MainActor.run {
                item.outputPath = destURL
                item.status = .done
                item.progress = 1.0
                item.progressText = "Completado"
            }
        } catch {
            await MainActor.run {
                item.status = .failed("Error al guardar archivo: \(error.localizedDescription)")
            }
        }
    }
}
